import { createRemoteJWKSet, jwtVerify } from "jose";

const SUPABASE_URL = "https://fbyqktduoqlpbbtkghkf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_7oa0dc4bp6gtG7p5bv3wtg_vlL0w5l5";
const EVIDENCE_BUCKET = "gsa-test-evidence";
const ISSUER = SUPABASE_URL + "/auth/v1";
const JWKS = createRemoteJWKSet(new URL(ISSUER + "/.well-known/jwks.json"));
const SIGNED_READ_SECONDS = 300;
const MAX_ARTIFACTS = 12;

type GsaUser = { userId: string; token: string };

function json(res: any, status: number, body: unknown) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function requireGsaUser(req: any): Promise<GsaUser> {
  const header = String(req.headers.authorization || "");
  if (!header.startsWith("Bearer ")) throw new Error("AUTH_REQUIRED");
  const token = header.slice(7);
  const verified = await jwtVerify(token, JWKS, { issuer: ISSUER });
  if (!verified.payload.sub) throw new Error("AUTH_REQUIRED");
  return { userId: String(verified.payload.sub), token };
}

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function validBundleId(raw: unknown) {
  const value = String(raw || "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(value)) throw new Error("INVALID_EVIDENCE_BUNDLE_ID");
  return value;
}

function commonHeaders(auth: GsaUser) {
  return {
    Authorization: "Bearer " + auth.token,
    apikey: SUPABASE_PUBLISHABLE_KEY,
  };
}

async function readManifestRecord(auth: GsaUser, bundleId: string) {
  const url = new URL(SUPABASE_URL + "/rest/v1/gsa_evidence_bundles");
  url.searchParams.set("select", "manifest_json,manifest_sha256");
  url.searchParams.set("user_id", "eq." + auth.userId);
  url.searchParams.set("evidence_bundle_id", "eq." + bundleId);
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...commonHeaders(auth),
      Accept: "application/json",
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error("EVIDENCE_MANIFEST_READ_FAILED:" + response.status + ":" + text.slice(0, 300));
  }

  let rows: any[] = [];
  try {
    rows = JSON.parse(text);
  } catch {
    throw new Error("EVIDENCE_MANIFEST_ROW_INVALID_JSON");
  }
  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new Error("EVIDENCE_MANIFEST_NOT_FOUND");
  }

  const manifestJson = String(rows[0]?.manifest_json || "");
  const manifestSha256 = String(rows[0]?.manifest_sha256 || "").toLowerCase();
  if (!manifestJson || !/^[0-9a-f]{64}$/.test(manifestSha256)) {
    throw new Error("EVIDENCE_MANIFEST_ROW_INVALID");
  }
  const actualSha256 = await sha256Text(manifestJson);
  if (actualSha256 !== manifestSha256) {
    throw new Error("EVIDENCE_MANIFEST_HASH_MISMATCH");
  }

  let manifest: any = null;
  try {
    manifest = JSON.parse(manifestJson);
  } catch {
    throw new Error("EVIDENCE_MANIFEST_INVALID_JSON");
  }
  return { manifest, manifestSha256 };
}

async function signPrivateObject(auth: GsaUser, objectPath: string) {
  const response = await fetch(
    SUPABASE_URL +
      "/storage/v1/object/sign/" +
      EVIDENCE_BUCKET +
      "/" +
      encodeStoragePath(objectPath),
    {
      method: "POST",
      headers: {
        ...commonHeaders(auth),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: SIGNED_READ_SECONDS }),
    },
  );
  const text = await response.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {}
  if (!response.ok) {
    throw new Error("EVIDENCE_SIGN_FAILED:" + response.status);
  }
  const signedPath = String(data?.signedURL || data?.signedUrl || "");
  if (!signedPath) throw new Error("EVIDENCE_SIGNED_URL_MISSING");
  const signedUrl = /^https?:\/\//i.test(signedPath)
    ? signedPath
    : new URL(
        signedPath.startsWith("/storage/v1/")
          ? signedPath
          : "/storage/v1/" + signedPath.replace(/^\/+/, ""),
        SUPABASE_URL,
      ).toString();
  return {
    signed_url: signedUrl,
    expires_at: new Date(Date.now() + SIGNED_READ_SECONDS * 1000).toISOString(),
  };
}

async function sha256Text(text: string) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return json(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const auth = await requireGsaUser(req);
    const bundleId = validBundleId(req.query?.bundle || req.query?.bundle_id);
    const root = auth.userId + "/bundles/" + bundleId + "/";
    const manifestPath = "db:gsa_evidence_bundles/" + bundleId;
    const stored = await readManifestRecord(auth, bundleId);
    const manifest: any = stored.manifest;

    if (
      manifest?.schema_version !== 1 ||
      manifest?.evidence_bundle_id !== bundleId ||
      manifest?.backend !== "PRIVATE_SUPABASE" ||
      manifest?.manifest_path !== manifestPath
    ) {
      throw new Error("EVIDENCE_MANIFEST_IDENTITY_MISMATCH");
    }

    const artifacts = Array.isArray(manifest.artifacts) ? manifest.artifacts : [];
    if (artifacts.length > MAX_ARTIFACTS) {
      throw new Error("EVIDENCE_MANIFEST_ARTIFACT_LIMIT_EXCEEDED");
    }

    const signedArtifacts = [];
    for (const artifact of artifacts) {
      const storagePath = String(artifact?.storage_path || "");
      if (!storagePath.startsWith(root)) {
        throw new Error("EVIDENCE_ARTIFACT_PATH_OUT_OF_BUNDLE");
      }
      const signed = await signPrivateObject(auth, storagePath);
      signedArtifacts.push({
        ...artifact,
        ...signed,
      });
    }

    return json(res, 200, {
      ok: true,
      evidence_bundle_id: bundleId,
      manifest_sha256: stored.manifestSha256,
      manifest,
      artifacts: signedArtifacts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status =
      message === "AUTH_REQUIRED"
        ? 401
        : message === "EVIDENCE_MANIFEST_NOT_FOUND"
          ? 404
          : 400;
    return json(res, status, { ok: false, error: message });
  }
}
