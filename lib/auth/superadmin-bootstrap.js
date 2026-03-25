import crypto from "node:crypto";

import { getAppConfig } from "../config.js";
import { createId } from "../utils/id.js";
import { hashPassword } from "./password.js";
import { AUDIT_EVENT_KEYS } from "../content-core/content-types.js";

export class BootstrapSuperadminError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "BootstrapSuperadminError";
    this.code = code;
  }
}

function digest(value) {
  return crypto.createHash("sha256").update(String(value)).digest();
}

function constantTimeEqual(left, right) {
  const leftDigest = digest(left);
  const rightDigest = digest(right);
  return crypto.timingSafeEqual(leftDigest, rightDigest);
}

function createBootstrapPassword() {
  return crypto.randomBytes(24).toString("base64url");
}

async function writeBootstrapAuditEvent({ writeAuditEvent, traceId, targetUser, outcome, authorityClass, failureCode = null }) {
  await writeAuditEvent({
    actorUserId: null,
    eventKey:
      outcome === "completed"
        ? AUDIT_EVENT_KEYS.SUPERADMIN_CREDENTIAL_BOOTSTRAPPED
        : AUDIT_EVENT_KEYS.SUPERADMIN_CREDENTIAL_BOOTSTRAP_BLOCKED,
    summary:
      outcome === "completed"
        ? `Superadmin bootstrap completed for ${targetUser.username}.`
        : `Superadmin bootstrap blocked for ${targetUser.username}.`,
    details: {
      traceId,
      authorityClass,
      targetUserId: targetUser.id,
      targetLogin: targetUser.username,
      outcome,
      failureCode,
      revealMode: "server_generated_one_time",
      oneTimeReveal: true,
      secretClass: "credential_secret",
      secretMaterialIncluded: false
    }
  });
}

export async function bootstrapSuperadminCredentials(input = {}, deps = {}) {
  const config = deps.config ?? getAppConfig();
  const bootstrapToken = String(input.bootstrapToken ?? "");
  const confirmationAccepted = input.confirmationAccepted === true;
  const targetLogin = config.bootstrapSuperadminUsername;
  const traceIdFactory = deps.traceIdFactory ?? (() => createId("trace"));
  const traceId = traceIdFactory();
  const findUserByUsernameFn = deps.findUserByUsername;
  const createUserFn = deps.createUser;
  const deleteUserFn = deps.deleteUser;
  const writeAuditEventFn = deps.writeAuditEvent;

  if (!findUserByUsernameFn || !createUserFn || !deleteUserFn || !writeAuditEventFn) {
    throw new Error("Bootstrap superadmin service dependencies are required.");
  }

  if (!config.bootstrapSuperadminConfigured) {
    throw new BootstrapSuperadminError("POLICY_VIOLATION", "Superadmin bootstrap is not configured.");
  }

  async function fail(code, message, extraDetails = {}) {
    try {
      await writeAuditEventFn({
        actorUserId: null,
        eventKey: AUDIT_EVENT_KEYS.SUPERADMIN_CREDENTIAL_BOOTSTRAP_BLOCKED,
        summary: `Superadmin bootstrap blocked: ${message}`,
        details: {
          traceId,
          authorityClass: "bootstrap_access_token",
          targetLogin,
          outcome: "blocked",
          failureCode: code,
          secretClass: "credential_secret",
          secretMaterialIncluded: false,
          ...extraDetails
        }
      });
    } catch {
      // The bootstrap still fails closed even if the blocked audit event cannot be written.
    }

    throw new BootstrapSuperadminError(code, message);
  }

  if (!confirmationAccepted) {
    await fail("CONFIRMATION_REQUIRED", "Explicit confirmation is required.");
  }

  if (!bootstrapToken) {
    await fail("VALIDATION_FAILED", "Bootstrap authority token is required.");
  }

  if (!targetLogin) {
    await fail("AMBIGUOUS_TARGET", "Bootstrap target identity is not configured.");
  }

  if (!constantTimeEqual(bootstrapToken, config.bootstrapSuperadminAccessToken)) {
    await fail("AUTHORITY_FORBIDDEN", "Bootstrap authority rejected.");
  }
  const passwordFactory = deps.passwordFactory ?? createBootstrapPassword;
  let existing;
  try {
    existing = await findUserByUsernameFn(targetLogin);
  } catch {
    await fail("LOOKUP_FAILURE", "Superadmin bootstrap failed during target lookup.");
  }

  if (existing) {
    await fail("BOOTSTRAP_ALREADY_EXISTS", "Superadmin bootstrap already exists.", {
      targetUserId: existing.id
    });
  }

  const generatedPassword = passwordFactory();
  const passwordHash = hashPassword(generatedPassword);
  let created;

  try {
    created = await createUserFn({
      username: targetLogin,
      displayName: config.bootstrapSuperadminDisplayName,
      role: "superadmin",
      passwordHash
    });
  } catch (error) {
    if (error?.code === "23505") {
      await fail("BOOTSTRAP_ALREADY_EXISTS", "Superadmin bootstrap already exists.");
    }

    await fail("CREATE_FAILURE", "Superadmin bootstrap failed while creating the reserved account.");
  }

  try {
    await writeBootstrapAuditEvent({
      writeAuditEvent: writeAuditEventFn,
      traceId,
      targetUser: created,
      outcome: "completed",
      authorityClass: "bootstrap_access_token"
    });
  } catch (error) {
    await deleteUserFn(created.id).catch(() => null);
    await fail("AUDIT_FAILURE", "Superadmin bootstrap failed while writing the audit event.");
  }

  return {
    traceId,
    targetLogin,
    generatedPassword,
    user: created
  };
}

export function renderBootstrapRevealHtml({ targetLogin, generatedPassword, traceId }) {
  const safeTarget = String(targetLogin);
  const safePassword = String(generatedPassword);
  const safeTraceId = String(traceId);

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Superadmin bootstrap reveal</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: linear-gradient(160deg, #f8fafc 0%, #eef2ff 100%);
        color: #0f172a;
      }
      main {
        width: min(760px, calc(100vw - 32px));
        background: #fff;
        border: 1px solid #cbd5e1;
        border-radius: 18px;
        box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
        padding: 32px;
      }
      h1 { margin: 0 0 12px; font-size: 1.75rem; }
      p { line-height: 1.55; margin: 0 0 12px; }
      .meta { color: #475569; font-size: 0.95rem; }
      .warning {
        padding: 14px 16px;
        border-radius: 12px;
        background: #fef3c7;
        border: 1px solid #f59e0b;
        margin: 18px 0;
      }
      .secret {
        display: block;
        padding: 18px;
        border-radius: 14px;
        background: #0f172a;
        color: #f8fafc;
        font-size: 1.1rem;
        overflow-wrap: anywhere;
        user-select: all;
      }
      .small { color: #64748b; font-size: 0.92rem; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    </style>
  </head>
  <body>
    <main>
      <p class="meta">One-time secure reveal</p>
      <h1>Superadmin credentials bootstrapped</h1>
      <p>Target login: <code>${safeTarget}</code></p>
      <div class="warning">
        This password is shown once only. Copy it now. Refreshing this response will not recover it.
      </div>
      <pre class="secret">${safePassword}</pre>
      <p class="small">Trace ID: <code>${safeTraceId}</code></p>
      <p class="small">The secret is intentionally absent from audit events, logs, reports, and transcripts.</p>
    </main>
  </body>
</html>`;
}
