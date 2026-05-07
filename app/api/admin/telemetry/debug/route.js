import { getCurrentUser } from "../../../../../lib/auth/session.js";
import { getTelemetryDebugSummary } from "../../../../../lib/telemetry/repository.js";

const JSON_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow"
};

function truthy(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());
}

export async function GET(request, _context, deps = {}) {
  const routeDeps = {
    getCurrentUser,
    getTelemetryDebugSummary,
    ...deps
  };
  const user = await routeDeps.getCurrentUser();

  if (!user) {
    return Response.json({ ok: false, error: "AUTH_REQUIRED" }, {
      status: 401,
      headers: JSON_HEADERS
    });
  }

  try {
    const url = new URL(request.url);
    const summary = await routeDeps.getTelemetryDebugSummary({
      includeInternal: truthy(url.searchParams.get("include_internal")),
      includeTest: truthy(url.searchParams.get("include_test"))
    });

    return Response.json({ ok: true, summary }, {
      status: 200,
      headers: JSON_HEADERS
    });
  } catch {
    return Response.json({ ok: false, error: "TELEMETRY_DEBUG_READ_FAILED" }, {
      status: 500,
      headers: JSON_HEADERS
    });
  }
}
