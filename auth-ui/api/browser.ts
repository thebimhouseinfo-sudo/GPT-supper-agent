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
type EvidenceRequest = { label: string; expiresIn: number };
type StoredEvidence = {
  label: string;
  storage_path: string;
  signed_url: string;
  expires_at: string;
  mime_type: "image/png";
};

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
  const label = String(body.evidence.label || "screenshot")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "screenshot";
  const expiresIn = Math.max(60, Math.min(604800, Number(body.evidence.expires_in || 86400)));
  return { label, expiresIn };
}

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function persistPngEvidence(
  auth: GsaUser,
  base64Data: string,
  request: EvidenceRequest,
  suffix?: string,
): Promise<StoredEvidence> {
  const safeSuffix = suffix
    ? "-" + suffix.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60)
    : "";
  const day = new Date().toISOString().slice(0, 10);
  const fileName = crypto.randomUUID() + "-" + request.label + safeSuffix + ".png";
  const objectPath = auth.userId + "/" + day + "/" + fileName;
  const encodedPath = encodeStoragePath(objectPath);
  const bytes = Uint8Array.from(atob(base64Data), (char) => char.charCodeAt(0));

  const commonHeaders = {
    Authorization: "Bearer " + auth.token,
    apikey: SUPABASE_PUBLISHABLE_KEY,
  };

  const upload = await fetch(
    SUPABASE_URL + "/storage/v1/object/" + EVIDENCE_BUCKET + "/" + encodedPath,
    {
      method: "POST",
      headers: {
        ...commonHeaders,
        "Content-Type": "image/png",
        "x-upsert": "false",
      },
      body: bytes.buffer,
    },
  );
  if (!upload.ok) {
    throw new Error("EVIDENCE_UPLOAD_FAILED:" + upload.status + ":" + (await upload.text()).slice(0, 500));
  }

  const signed = await fetch(
    SUPABASE_URL + "/storage/v1/object/sign/" + EVIDENCE_BUCKET + "/" + encodedPath,
    {
      method: "POST",
      headers: {
        ...commonHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: request.expiresIn }),
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

  return {
    label: request.label + safeSuffix,
    storage_path: objectPath,
    signed_url: new URL(signedPath, SUPABASE_URL).toString(),
    expires_at: new Date(Date.now() + request.expiresIn * 1000).toISOString(),
    mime_type: "image/png",
  };
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

async function runUiInspect(url: URL, body: any, auth: GsaUser) {
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
    const errorsResult = await run(["errors"]);
    const persist = evidenceRequest(body);
    let evidence: StoredEvidence[] | undefined;
    if (persist) {
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
      page_errors: String(errorsResult.stdout || "").trim(),
      screenshots,
    };
    if (evidence) result.evidence = evidence;
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

async function runTestFlow(url: URL, body: any, auth: GsaUser) {
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
    const errorsResult = await run(["errors"]);
    const screenshot = await screenshotBase64(sandbox, host, true);
    const persist = evidenceRequest(body);
    const evidence = persist
      ? [await persistPngEvidence(auth, screenshot, persist, viewport.label || "final")]
      : undefined;
    await run(["close"]);

    const pageErrors = String(errorsResult.stdout || "").trim();
    if (pageErrors && !/^no errors/i.test(pageErrors)) passed = false;

    const result: any = {
      ok: true,
      mode: "test_flow",
      passed,
      url: String(currentUrl.stdout || "").trim() || url.toString(),
      initial_snapshot: String(initialSnapshot.stdout || "").trim(),
      final_snapshot: String(finalSnapshot.stdout || "").trim(),
      console: String(consoleResult.stdout || "").trim(),
      page_errors: pageErrors,
      steps: results,
      screenshot: { ...viewport, mimeType: "image/png", data: screenshot },
    };
    if (evidence) result.evidence = evidence;
    return result;
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "METHOD_NOT_ALLOWED" });

  try {
    const auth = await requireGsaUser(req);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const url = validatePublicUrl(body.url);

    if (body.mode === "ui_inspect") {
      return json(res, 200, await runUiInspect(url, body, auth));
    }
    if (body.mode === "test_flow") {
      return json(res, 200, await runTestFlow(url, body, auth));
    }

    return json(res, 400, { ok: false, error: "UNKNOWN_MODE" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "AUTH_REQUIRED" ? 401 : 400;
    return json(res, status, { ok: false, error: message });
  }
}
