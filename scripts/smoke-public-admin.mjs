const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
const hostHeader = process.env.SMOKE_HOST_HEADER ?? "";
const strictPublic = process.env.SMOKE_STRICT_PUBLIC === "1";
const strictAdmin = process.env.SMOKE_STRICT_ADMIN === "1";
const responsePreviewBytes = Number(process.env.SMOKE_RESPONSE_PREVIEW_BYTES ?? 240);

const defaultPublicRoutes = [
  "/",
  "/services",
  "/cases",
  "/about",
  "/contacts"
];

const defaultAdminRoutes = [
  "/admin",
  "/admin/review",
  "/admin/entities/service",
  "/admin/entities/case",
  "/admin/entities/page"
];

const optionalDetailRoutes = [
  process.env.SMOKE_SERVICE_DETAIL_PATH ?? "",
  process.env.SMOKE_CASE_DETAIL_PATH ?? ""
].filter(Boolean);

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function buildHeaders() {
  if (!hostHeader) {
    return undefined;
  }

  return {
    host: hostHeader
  };
}

async function probe(path) {
  const startedAt = Date.now();
  const response = await fetch(new URL(path, baseUrl), {
    method: "GET",
    redirect: "manual",
    headers: buildHeaders()
  });

  const location = response.headers.get("location") || null;
  const text = await response.text();

  return {
    path,
    status: response.status,
    ok: response.ok,
    redirected: Boolean(location),
    location,
    responseTimeMs: Date.now() - startedAt,
    responsePreview: text.slice(0, responsePreviewBytes)
  };
}

function classifyRoute(result) {
  if (result.status >= 500) {
    return "failed";
  }

  if (result.status === 404) {
    return "missing_or_unpublished";
  }

  if (result.status >= 300 && result.status < 400) {
    return "redirect";
  }

  if (result.status >= 200 && result.status < 300) {
    return "ok";
  }

  return "other";
}

function validatePublic(result) {
  ensure(result.status < 500, `Public route ${result.path} returned ${result.status}.`);

  if (strictPublic) {
    ensure(result.status === 200, `Strict public smoke expected 200 for ${result.path}, got ${result.status}.`);
  }
}

function validateAdmin(result) {
  ensure(result.status < 500, `Admin route ${result.path} returned ${result.status}.`);

  if (result.status >= 300 && result.status < 400) {
    const location = result.location || "";
    const allowed = location.includes("/admin/login") || location.includes("/admin/no-access");
    ensure(allowed, `Admin route ${result.path} redirected to unexpected location: ${location || "<empty>"}.`);
  }

  if (strictAdmin) {
    ensure(result.status === 200, `Strict admin smoke expected 200 for ${result.path}, got ${result.status}.`);
  }
}

function summarize(records) {
  const counts = {
    ok: 0,
    redirect: 0,
    missing_or_unpublished: 0,
    other: 0,
    failed: 0
  };

  for (const item of records) {
    const bucket = classifyRoute(item);
    counts[bucket] += 1;
  }

  return counts;
}

async function main() {
  const publicRoutes = [...defaultPublicRoutes, ...optionalDetailRoutes];
  const adminRoutes = [...defaultAdminRoutes];

  const publicResults = [];
  for (const route of publicRoutes) {
    const result = await probe(route);
    validatePublic(result);
    publicResults.push({ ...result, class: classifyRoute(result) });
  }

  const adminResults = [];
  for (const route of adminRoutes) {
    const result = await probe(route);
    validateAdmin(result);
    adminResults.push({ ...result, class: classifyRoute(result) });
  }

  const report = {
    traceId: `smoke-${Date.now().toString(36)}`,
    baseUrl,
    hostHeader: hostHeader || null,
    strictPublic,
    strictAdmin,
    publicSummary: summarize(publicResults),
    adminSummary: summarize(adminResults),
    publicRoutes: publicResults,
    adminRoutes: adminResults
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(`[smoke] FAILED: ${error.message}`);
  process.exitCode = 1;
});
