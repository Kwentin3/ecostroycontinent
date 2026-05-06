import { NextResponse } from "next/server.js";

import { requireRouteUser } from "../../../../../lib/admin/route-helpers.js";
import { buildSeoDashboardReadModel } from "../../../../../lib/analytics/read-model.js";

const JSON_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow"
};

function parsePeriod(value) {
  const parsed = Number(value || 28);
  return [7, 28, 90].includes(parsed) ? parsed : 28;
}

export async function GET(request, _context, deps = {}) {
  const routeDeps = {
    requireRouteUser,
    buildSeoDashboardReadModel,
    ...deps
  };
  // Admin boundary: return prepared read model only; never expose raw events,
  // secrets/tokens/form values. RBAC is required. See the SEO handoff doc.
  const { response } = await routeDeps.requireRouteUser(request);

  if (response) {
    return response;
  }

  const url = new URL(request.url);
  const periodDays = parsePeriod(url.searchParams.get("period"));
  const selectedPagePath = url.searchParams.get("page") || "";

  try {
    const readModel = await routeDeps.buildSeoDashboardReadModel({ periodDays, selectedPagePath });
    return NextResponse.json({ ok: true, data: readModel }, { status: 200, headers: JSON_HEADERS });
  } catch {
    return NextResponse.json(
      { ok: false, error: "READ_MODEL_FAILED", message: "Не удалось собрать аналитический read model." },
      { status: 500, headers: JSON_HEADERS }
    );
  }
}
