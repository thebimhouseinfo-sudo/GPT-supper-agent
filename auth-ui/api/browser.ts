import { createRemoteJWKSet, jwtVerify } from "jose";
import {
  runAgentBrowserCommand,
  withAgentBrowserSandbox,
} from "@agent-browser/sandbox/vercel";

const SUPABASE_URL = "https://fbyqktduoqlpbbtkghkf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_7oa0dc4bp6gtG7p5bv3wtg_vlL0w5l5";
const EVIDENCE_BUCKET = "gsa-test-evidence";
const ISSUER = SUPABASE_URL + "/auth/v1";
const JWKS = createRemoteJWKSet(new URL(ISSUER + "/.well-known/jwks.json"));
const MAX_SCREENSHOTS = 12;
const MAX_SINGLE_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const MAX_PRIVATE_BUNDLE_BYTES = 50 * 1024 * 1024;

type Viewport = { width: number; height: number; label?: string };
type Step = {
  action: "click" | "fill" | "check" | "hover" | "select" | "press" | "wait_text" | "assert_text";
  by?: "css" | "text" | "label" | "placeholder" | "testid" | "role";
  target?: string;
  name?: string;
  value?: string;
};

function json(res: any, status: number, body: unknown) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

type GsaUser = { userId: string; token: string };
type EvidenceBinding = {
  project_id: string;
  repository: string;
  job_id: string;
  checkpoint_id: string;
  attempt_id: string;
  run_id: string;
  target_ref: string | null;
  target_revision: string;
  privacy_class: "PRIVATE_REQUIRED" | "REPO_SAFE";
  result: string | null;
  limitations: string[];
};
type EvidenceRequest = {
  label: string;
  expiresIn: number;
  bundle: EvidenceBinding | null;
};
type StoredEvidence = {
  artifact_id?: string;
  label: string;
  storage_path: string;
  signed_url: string;
  expires_at: string;
  mime_type: "image/png";
  size_bytes?: number;
  sha256?: string;
  width?: number;
  height?: number;
};
type EvidenceBundleRef = {
  evidence_bundle_id: string;
  backend: "PRIVATE_SUPABASE";
  privacy_class: "PRIVATE_REQUIRED" | "REPO_SAFE";
  manifest_path: string;
  manifest_sha256: string;
  viewer_url: string;
  target_revision: string;
  artifact_count: number;
  size_bytes: number;
};

type PageErrorSummary = { text: string; hasErrors: boolean };

function normalizePageErrors(raw: unknown): PageErrorSummary {
  const text = String(raw ?? "").trim();
  if (!text || text === "✗" || /^no errors?\b/i.test(text)) {
    return { text: "", hasErrors: false };
  }

  try {
    const parsed: any = JSON.parse(text);
    const data = parsed?.data;
    const candidates =
      Array.isArray(data) ? data :
      Array.isArray(data?.errors) ? data.errors :
      Array.isArray(data?.messages) ? data.messages :
      Array.isArray(parsed?.errors) ? parsed.errors :
      Array.isArray(parsed?.messages) ? parsed.messages :
      null;

    if (candidates) {
      return {
        text: candidates.length ? JSON.stringify(candidates) : "",
        hasErrors: candidates.length > 0,
      };
    }

    if (
      parsed?.success === true &&
      (parsed?.error == null || parsed?.error === "") &&
      (data == null || (typeof data === "object" && !Array.isArray(data) && Object.keys(data).length === 0))
    ) {
      return { text: "", hasErrors: false };
    }
  } catch {}

  // Conservative fallback: unknown non-empty output remains an error.
  return { text, hasErrors: true };
}

async function requireGsaUser(req: any): Promise<GsaUser> {
  const header = String(req.headers.authorization || "");
  if (!header.startsWith("Bearer ")) throw new Error("AUTH_REQUIRED");
  const token = header.slice(7);
  const verified = await jwtVerify(token, JWKS, { issuer: ISSUER });
  if (!verified.payload.sub) throw new Error("AUTH_REQUIRED");
  return { userId: String(verified.payload.sub), token };
}

function evidenceRequest(body: any): EvidenceRequest | null {
  if (body?.evidence?.persist !== true) return null;
  const label = safeSegment(body.evidence.label || "screenshot", 80) || "screenshot";
  const expiresIn = Math.max(60, Math.min(604800, Number(body.evidence.expires_in || 86400)));
  const raw = body.evidence.bundle;
  if (raw == null) return { label, expiresIn, bundle: null };

  const required = (key: string, max = 240) => {
    const value = String(raw?.[key] || "").trim();
    if (!value || value.length > max) {
      throw new Error("EVIDENCE_BUNDLE_" + key.toUpperCase() + "_INVALID");
    }
    return value;
  };
  const privacy = String(raw.privacy_class || "PRIVATE_REQUIRED");
  if (!["PRIVATE_REQUIRED", "REPO_SAFE"].includes(privacy)) {
    throw new Error("EVIDENCE_BUNDLE_PRIVACY_CLASS_INVALID");
  }

  return {
    label,
    expiresIn,
    bundle: {
      project_id: required("project_id"),
      repository: required("repository", 500),
      job_id: required("job_id"),
      checkpoint_id: required("checkpoint_id"),
      attempt_id: required("attempt_id"),
      run_id: required("run_id"),
      target_ref: raw.target_ref ? String(raw.target_ref).slice(0, 500) : null,
      target_revision: required("target_revision"),
      privacy_class: privacy as "PRIVATE_REQUIRED" | "REPO_SAFE",
      result: raw.result ? String(raw.result).slice(0, 80) : null,
      limitations: Array.isArray(raw.limitations)
        ? raw.limitations.slice(0, 20).map((item: unknown) => String(item).slice(0, 500))
        : [],
    },
  };
}

function safeSegment(raw: unknown, max = 80) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);
}

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function commonStorageHeaders(auth: GsaUser) {
  return {
    Authorization: "Bearer " + auth.token,
    apikey: SUPABASE_PUBLISHABLE_KEY,
  };
}

async function sha256Bytes(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Text(value: string) {
  return sha256Bytes(new TextEncoder().encode(value));
}

function decodeBase64(base64Data: string) {
  return Uint8Array.from(atob(base64Data), (char) => char.charCodeAt(0));
}

async function uploadPrivateObject(
  auth: GsaUser,
  objectPath: string,
  contentType: string,
  bytes: Uint8Array,
) {
  const upload = await fetch(
    SUPABASE_URL + "/storage/v1/object/" + EVIDENCE_BUCKET + "/" + encodeStoragePath(objectPath),
    {
      method: "POST",
      headers: {
        ...commonStorageHeaders(auth),
        "Content-Type": contentType,
        "x-upsert": "false",
      },
      body: bytes.buffer,
    },
  );
  if (!upload.ok) {
    throw new Error(
      "EVIDENCE_UPLOAD_FAILED:" + upload.status + ":" + (await upload.text()).slice(0, 500),
    );
  }
}

async function signPrivateObject(auth: GsaUser, objectPath: string, expiresIn: number) {
  const signed = await fetch(
    SUPABASE_URL + "/storage/v1/object/sign/" + EVIDENCE_BUCKET + "/" + encodeStoragePath(objectPath),
    {
      method: "POST",
      headers: {
        ...commonStorageHeaders(auth),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn }),
    },
  );
  const signedText = await signed.text();
  let signedData: any = null;
  try { signedData = JSON.parse(signedText); } catch {}
  if (!signed.ok) {
    throw new Error("EVIDENCE_SIGN_FAILED:" + signed.status + ":" + signedText.slice(0, 500));
  }
  const signedPath = String(signedData?.signedURL || signedData?.signedUrl || "");
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
    expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
  };
}

async function readPrivateObject(auth: GsaUser, objectPath: string) {
  const response = await fetch(
    SUPABASE_URL +
      "/storage/v1/object/authenticated/" +
      EVIDENCE_BUCKET +
      "/" +
      encodeStoragePath(objectPath),
    {
      method: "GET",
      headers: commonStorageHeaders(auth),
    },
  );
  if (!response.ok) {
    throw new Error(
      "EVIDENCE_READBACK_FAILED:" +
        response.status +
        ":" +
        (await response.text()).slice(0, 300),
    );
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function verifyPrivateObject(
  auth: GsaUser,
  objectPath: string,
  expectedSize: number,
  expectedSha256: string,
) {
  const bytes = await readPrivateObject(auth, objectPath);
  if (bytes.byteLength !== expectedSize) {
    throw new Error("EVIDENCE_READBACK_SIZE_MISMATCH");
  }
  const actualSha256 = await sha256Bytes(bytes);
  if (actualSha256 !== expectedSha256) {
    throw new Error("EVIDENCE_READBACK_HASH_MISMATCH");
  }
}


async function insertEvidenceManifest(
  auth: GsaUser,
  bundleId: string,
  manifestText: string,
  manifestSha256: string,
) {
  const response = await fetch(SUPABASE_URL + "/rest/v1/gsa_evidence_bundles", {
    method: "POST",
    headers: {
      ...commonStorageHeaders(auth),
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      user_id: auth.userId,
      evidence_bundle_id: bundleId,
      manifest_json: manifestText,
      manifest_sha256: manifestSha256,
    }),
  });
  if (!response.ok) {
    throw new Error(
      "EVIDENCE_MANIFEST_PERSIST_FAILED:" +
        response.status +
        ":" +
        (await response.text()).slice(0, 500),
    );
  }
}


async function verifyEvidenceManifest(
  auth: GsaUser,
  bundleId: string,
  expectedManifestText: string,
  expectedManifestSha256: string,
) {
  const url = new URL(SUPABASE_URL + "/rest/v1/gsa_evidence_bundles");
  url.searchParams.set("select", "manifest_json,manifest_sha256");
  url.searchParams.set("user_id", "eq." + auth.userId);
  url.searchParams.set("evidence_bundle_id", "eq." + bundleId);
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...commonStorageHeaders(auth),
      Accept: "application/json",
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      "EVIDENCE_MANIFEST_READBACK_FAILED:" +
        response.status +
        ":" +
        text.slice(0, 300),
    );
  }

  let rows: any[] = [];
  try {
    rows = JSON.parse(text);
  } catch {
    throw new Error("EVIDENCE_MANIFEST_READBACK_INVALID_JSON");
  }
  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new Error("EVIDENCE_MANIFEST_READBACK_NOT_FOUND");
  }
  if (
    String(rows[0]?.manifest_json || "") !== expectedManifestText ||
    String(rows[0]?.manifest_sha256 || "").toLowerCase() !== expectedManifestSha256
  ) {
    throw new Error("EVIDENCE_MANIFEST_READBACK_MISMATCH");
  }
}


async function persistPngEvidence(
  auth: GsaUser,
  base64Data: string,
  request: EvidenceRequest,
  suffix?: string,
): Promise<StoredEvidence> {
  const safeSuffix = suffix ? "-" + (safeSegment(suffix, 60) || "capture") : "";
  const day = new Date().toISOString().slice(0, 10);
  const fileName = crypto.randomUUID() + "-" + request.label + safeSuffix + ".png";
  const objectPath = auth.userId + "/" + day + "/" + fileName;
  const bytes = decodeBase64(base64Data);
  if (bytes.byteLength > MAX_SINGLE_SCREENSHOT_BYTES) {
    throw new Error("EVIDENCE_SCREENSHOT_LIMIT_EXCEEDED");
  }
  await uploadPrivateObject(auth, objectPath, "image/png", bytes);
  const signed = await signPrivateObject(auth, objectPath, request.expiresIn);

  return {
    label: request.label + safeSuffix,
    storage_path: objectPath,
    ...signed,
    mime_type: "image/png",
    size_bytes: bytes.byteLength,
    sha256: await sha256Bytes(bytes),
  };
}

async function persistEvidenceBundle(
  auth: GsaUser,
  captures: Array<{ data: string; label: string; width?: number; height?: number }>,
  request: EvidenceRequest,
  viewerOrigin: string,
  capture: { mode: string; url: string; result?: string; limitations?: string[] },
): Promise<{ evidence: StoredEvidence[]; bundle: EvidenceBundleRef }> {
  const binding = request.bundle;
  if (!binding) throw new Error("EVIDENCE_BUNDLE_CONTEXT_REQUIRED");
  if (captures.length < 1 || captures.length > MAX_SCREENSHOTS) {
    throw new Error("EVIDENCE_SCREENSHOT_COUNT_LIMIT_EXCEEDED");
  }

  const bundleSeed = JSON.stringify([
    binding.project_id,
    binding.repository,
    binding.job_id,
    binding.checkpoint_id,
    binding.attempt_id,
    binding.run_id,
    binding.target_revision,
  ]);
  const bundleId = await sha256Text(bundleSeed);
  const root = auth.userId + "/bundles/" + bundleId + "/";
  const evidence: StoredEvidence[] = [];
  const manifestArtifacts: any[] = [];
  let totalBytes = 0;

  for (let index = 0; index < captures.length; index++) {
    const item = captures[index];
    const bytes = decodeBase64(String(item.data || ""));
    if (bytes.byteLength > MAX_SINGLE_SCREENSHOT_BYTES) {
      throw new Error("EVIDENCE_SCREENSHOT_LIMIT_EXCEEDED");
    }
    totalBytes += bytes.byteLength;
    if (totalBytes > MAX_PRIVATE_BUNDLE_BYTES) {
      throw new Error("EVIDENCE_BUNDLE_SIZE_LIMIT_EXCEEDED");
    }

    const semantic = safeSegment(item.label || ("capture-" + (index + 1)), 60) || ("capture-" + (index + 1));
    const objectPath =
      root +
      "screenshots/" +
      String(index + 1).padStart(2, "0") +
      "-" +
      semantic +
      ".png";
    const hash = await sha256Bytes(bytes);
    await uploadPrivateObject(auth, objectPath, "image/png", bytes);
    await verifyPrivateObject(auth, objectPath, bytes.byteLength, hash);
    const signed = await signPrivateObject(auth, objectPath, request.expiresIn);
    const artifactId = bundleId + ":screenshot:" + String(index + 1).padStart(2, "0");

    const durable = {
      artifact_id: artifactId,
      label: semantic,
      storage_path: objectPath,
      mime_type: "image/png" as const,
      size_bytes: bytes.byteLength,
      sha256: hash,
      width: item.width ?? null,
      height: item.height ?? null,
    };
    manifestArtifacts.push(durable);
    evidence.push({
      ...durable,
      width: item.width,
      height: item.height,
      ...signed,
    });
  }

  const createdAt = new Date().toISOString();
  const manifestPath = "db:gsa_evidence_bundles/" + bundleId;
  const manifest = {
    schema_version: 1,
    evidence_bundle_id: bundleId,
    backend: "PRIVATE_SUPABASE",
    privacy_class: binding.privacy_class,
    created_at: createdAt,
    manifest_path: manifestPath,
    canonical_signed_urls: false,
    binding: {
      project_id: binding.project_id,
      repository: binding.repository,
      job_id: binding.job_id,
      checkpoint_id: binding.checkpoint_id,
      attempt_id: binding.attempt_id,
      run_id: binding.run_id,
      target_ref: binding.target_ref,
      target_revision: binding.target_revision,
    },
    capture: {
      mode: capture.mode,
      url: capture.url,
    },
    result: binding.result || capture.result || null,
    limitations: [...new Set([...(binding.limitations || []), ...(capture.limitations || [])])],
    retention: {
      mode: "PROJECT_CLEANUP",
      expires_at: null,
    },
    artifacts: manifestArtifacts,
  };
  const manifestText = JSON.stringify(manifest, null, 2) + "\n";
  const manifestBytes = new TextEncoder().encode(manifestText);
  if (totalBytes + manifestBytes.byteLength > MAX_PRIVATE_BUNDLE_BYTES) {
    throw new Error("EVIDENCE_BUNDLE_SIZE_LIMIT_EXCEEDED");
  }
  const manifestSha256 = await sha256Bytes(manifestBytes);
  await insertEvidenceManifest(auth, bundleId, manifestText, manifestSha256);
  await verifyEvidenceManifest(auth, bundleId, manifestText, manifestSha256);

  return {
    evidence,
    bundle: {
      evidence_bundle_id: bundleId,
      backend: "PRIVATE_SUPABASE",
      privacy_class: binding.privacy_class,
      manifest_path: manifestPath,
      manifest_sha256: manifestSha256,
      viewer_url: viewerOrigin.replace(/\/$/, "") + "/evidence.html?bundle=" + encodeURIComponent(bundleId),
      target_revision: binding.target_revision,
      artifact_count: evidence.length,
      size_bytes: totalBytes + manifestBytes.byteLength,
    },
  };
}

function requestOrigin(req: any) {
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "gpt-supper-agent.vercel.app")
    .split(",")[0]
    .trim();
  return proto + "://" + host;
}

function validatePublicUrl(raw: unknown) {
  const url = new URL(String(raw || ""));
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("URL_PROTOCOL_NOT_ALLOWED");
  const host = url.hostname.toLowerCase();
  const blocked =
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (blocked) throw new Error("PRIVATE_TARGET_NOT_ALLOWED");
  return url;
}

function clampViewport(v: any): Viewport {
  const width = Math.max(320, Math.min(1920, Number(v?.width || 1440)));
  const height = Math.max(480, Math.min(1440, Number(v?.height || 900)));
  return { width, height, label: v?.label ? String(v.label).slice(0, 40) : undefined };
}

async function screenshotBase64(sandbox: any, host: string, annotate = true) {
  const args = ["--allowed-domains", host, "screenshot", "--json"];
  if (annotate) args.push("--annotate");
  const shot = await runAgentBrowserCommand(sandbox, args, { json: false });
  let parsed: any = null;
  try { parsed = JSON.parse(String(shot.stdout || "")); } catch {}
  const path = parsed?.data?.path;
  if (!path) throw new Error("SCREENSHOT_PATH_MISSING");
  const encoded = await sandbox.runCommand("base64", ["-w", "0", path]);
  if (encoded.exitCode !== 0) throw new Error("SCREENSHOT_READ_FAILED");
  return (await encoded.stdout()).trim();
}

async function runUiInspect(url: URL, body: any, auth: GsaUser, viewerOrigin: string) {
  const viewports = (Array.isArray(body.viewports) && body.viewports.length
    ? body.viewports.slice(0, 3)
    : [
        { width: 390, height: 844, label: "mobile" },
        { width: 1440, height: 900, label: "desktop" },
      ]).map(clampViewport);

  return withAgentBrowserSandbox(async (sandbox) => {
    const host = url.hostname;
    const run = (args: string[]) =>
      runAgentBrowserCommand(sandbox, ["--allowed-domains", host, ...args], { json: false });

    await run(["open", url.toString()]);
    await run(["wait", "--load", "networkidle"]);

    const titleResult = await run(["get", "title"]);
    const snapshotResult = await run(["snapshot", "-i", "-c"]);

    const screenshots: any[] = [];
    for (const viewport of viewports) {
      await run(["set", "viewport", String(viewport.width), String(viewport.height)]);
      await run(["wait", "150"]);
      screenshots.push({
        ...viewport,
        mimeType: "image/png",
        data: await screenshotBase64(sandbox, host, true),
      });
    }

    const consoleResult = await run(["console", "--json"]);
    const errorsResult = await run(["errors", "--json"]);
    const pageErrors = normalizePageErrors(errorsResult.stdout);
    const persist = evidenceRequest(body);
    let evidence: StoredEvidence[] | undefined;
    let evidenceBundle: EvidenceBundleRef | undefined;
    if (persist?.bundle) {
      const saved = await persistEvidenceBundle(
        auth,
        screenshots.map((shot) => ({
          data: String(shot.data || ""),
          label: String(shot.label || (shot.width + "x" + shot.height)),
          width: Number(shot.width) || undefined,
          height: Number(shot.height) || undefined,
        })),
        persist,
        viewerOrigin,
        {
          mode: "ui_inspect",
          url: url.toString(),
          result: "OBSERVED",
          limitations: pageErrors.hasErrors ? ["PAGE_ERRORS_PRESENT"] : [],
        },
      );
      evidence = saved.evidence;
      evidenceBundle = saved.bundle;
    } else if (persist) {
      evidence = [];
      for (const shot of screenshots) {
        evidence.push(await persistPngEvidence(
          auth,
          String(shot.data || ""),
          persist,
          String(shot.label || (shot.width + "x" + shot.height)),
        ));
      }
    }
    await run(["close"]);

    const result: any = {
      ok: true,
      mode: "ui_inspect",
      title: String(titleResult.stdout || "").trim(),
      url: url.toString(),
      snapshot: String(snapshotResult.stdout || "").trim(),
      console: String(consoleResult.stdout || "").trim(),
      page_errors: pageErrors.text,
      screenshots,
    };
    if (evidence) result.evidence = evidence;
    if (evidenceBundle) result.evidence_bundle = evidenceBundle;
    return result;
  });
}

function stepCommand(step: Step): string[] {
  if (step.action === "press") {
    if (!step.value) throw new Error("PRESS_REQUIRES_VALUE");
    return ["press", step.value];
  }
  if (step.action === "wait_text") {
    if (!step.target) throw new Error("WAIT_TEXT_REQUIRES_TARGET");
    return ["wait", "--text", step.target];
  }
  if (step.action === "assert_text") return [];

  if (!step.target) throw new Error("STEP_TARGET_REQUIRED");
  const by = step.by || "css";

  if (step.action === "select") {
    if (by !== "css" || step.value == null) throw new Error("SELECT_REQUIRES_CSS_AND_VALUE");
    return ["select", step.target, step.value];
  }

  if (by === "css") {
    const cmd = [step.action, step.target];
    if (step.action === "fill") {
      if (step.value == null) throw new Error("FILL_REQUIRES_VALUE");
      cmd.push(step.value);
    }
    return cmd;
  }

  if (!["text", "label", "placeholder", "testid", "role"].includes(by)) {
    throw new Error("UNSUPPORTED_LOCATOR");
  }

  const cmd = ["find", by, step.target, step.action];
  if (step.action === "fill") {
    if (step.value == null) throw new Error("FILL_REQUIRES_VALUE");
    cmd.push(step.value);
  }
  if (by === "role" && step.name) cmd.push("--name", step.name);
  return cmd;
}

async function runTestFlow(url: URL, body: any, auth: GsaUser, viewerOrigin: string) {
  const steps: Step[] = Array.isArray(body.steps) ? body.steps.slice(0, 20) : [];
  const viewport = clampViewport(body.viewport || { width: 1440, height: 900 });
  const stopOnFailure = body.stop_on_failure !== false;

  return withAgentBrowserSandbox(async (sandbox) => {
    const host = url.hostname;
    const run = (args: string[]) =>
      runAgentBrowserCommand(sandbox, ["--allowed-domains", host, ...args], { json: false });

    await run(["open", url.toString()]);
    await run(["set", "viewport", String(viewport.width), String(viewport.height)]);
    await run(["wait", "--load", "networkidle"]);

    const initialSnapshot = await run(["snapshot", "-i", "-c"]);
    const results: any[] = [];
    let passed = true;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      try {
        if (step.action === "assert_text") {
          if (!step.target) throw new Error("ASSERT_TEXT_REQUIRES_TARGET");
          const text = await run(["get", "text", "body"]);
          const actual = String(text.stdout || "");
          const ok = actual.includes(step.target);
          results.push({ index: i, action: step.action, ok, expected: step.target });
          if (!ok) {
            passed = false;
            if (stopOnFailure) break;
          }
          continue;
        }

        const command = stepCommand(step);
        const out = await run(command);
        results.push({
          index: i,
          action: step.action,
          by: step.by || null,
          target: step.target || null,
          ok: true,
          output: String(out.stdout || "").trim().slice(0, 2000),
        });
        if (["click", "fill", "select", "press", "check"].includes(step.action)) {
          await run(["wait", "120"]);
        }
      } catch (error) {
        passed = false;
        results.push({
          index: i,
          action: step.action,
          by: step.by || null,
          target: step.target || null,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
        if (stopOnFailure) break;
      }
    }

    const finalSnapshot = await run(["snapshot", "-i", "-c"]);
    const currentUrl = await run(["get", "url"]);
    const consoleResult = await run(["console", "--json"]);
    const errorsResult = await run(["errors", "--json"]);
    const pageErrors = normalizePageErrors(errorsResult.stdout);
    const screenshot = await screenshotBase64(sandbox, host, true);
    if (pageErrors.hasErrors) passed = false;

    const persist = evidenceRequest(body);
    let evidence: StoredEvidence[] | undefined;
    let evidenceBundle: EvidenceBundleRef | undefined;
    if (persist?.bundle) {
      const finalUrl = String(currentUrl.stdout || "").trim() || url.toString();
      const saved = await persistEvidenceBundle(
        auth,
        [{
          data: screenshot,
          label: viewport.label || "final",
          width: viewport.width,
          height: viewport.height,
        }],
        persist,
        viewerOrigin,
        {
          mode: "test_flow",
          url: finalUrl,
          result: passed ? "PASS" : "FAIL",
          limitations: pageErrors.hasErrors ? ["PAGE_ERRORS_PRESENT"] : [],
        },
      );
      evidence = saved.evidence;
      evidenceBundle = saved.bundle;
    } else if (persist) {
      evidence = [await persistPngEvidence(auth, screenshot, persist, viewport.label || "final")];
    }
    await run(["close"]);

    const result: any = {
      ok: true,
      mode: "test_flow",
      passed,
      url: String(currentUrl.stdout || "").trim() || url.toString(),
      initial_snapshot: String(initialSnapshot.stdout || "").trim(),
      final_snapshot: String(finalSnapshot.stdout || "").trim(),
      console: String(consoleResult.stdout || "").trim(),
      page_errors: pageErrors.text,
      steps: results,
      screenshot: { ...viewport, mimeType: "image/png", data: screenshot },
    };
    if (evidence) result.evidence = evidence;
    if (evidenceBundle) result.evidence_bundle = evidenceBundle;
    return result;
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });

  try {
    const auth = await requireGsaUser(req);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const url = validatePublicUrl(body.url);
    const viewerOrigin = requestOrigin(req);

    if (body.mode === "ui_inspect") {
      return json(res, 200, await runUiInspect(url, body, auth, viewerOrigin));
    }
    if (body.mode === "test_flow") {
      return json(res, 200, await runTestFlow(url, body, auth, viewerOrigin));
    }

    return json(res, 400, { ok: false, error: "UNKNOWN_MODE" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "AUTH_REQUIRED" ? 401 : 400;
    return json(res, status, { ok: false, error: message });
  }
}
