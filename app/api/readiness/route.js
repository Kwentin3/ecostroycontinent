import { buildReadinessSnapshot } from "../../../lib/health/readiness.js";

const HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow"
};

export async function GET(_request, _context, deps = {}) {
  const snapshot = await (deps.buildReadinessSnapshot ?? buildReadinessSnapshot)();

  return Response.json(snapshot.body, {
    status: snapshot.httpStatus,
    headers: HEADERS
  });
}
