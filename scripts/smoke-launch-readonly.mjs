import { pathToFileURL } from "node:url";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_PUBLIC_ROUTES = ["/", "/services", "/cases"];
const OWNER_CONTENT_ROUTES = [
  { path: "/about", envName: "EXPECT_ABOUT", label: "about" },
  { path: "/contacts", envName: "EXPECT_CONTACTS", label: "contacts" }
];
const ADMIN_ROUTES = ["/admin", "/admin/review", "/admin/entities/service"];
const CORE_SITEMAP_PATHS = ["/", "/services", "/cases"];
const SENSITIVE_PATTERNS = [
  /postgres(?:ql)?:\/\//i,
  /\bDATABASE_URL\b/i,
  /\bpassword\b/i,
  /\bsecret\b/i,
  /\btoken\b/i,
  /private[_-]?key/i,
  /\bAWS_(?:ACCESS|SECRET|SESSION)/i,
  /BEGIN [A-Z ]*PRIVATE KEY/i
];

function normalizeBaseUrl(value) {
  const baseUrl = String(value || "http://localhost:3000").trim();

  try {
    return new URL(baseUrl).toString().replace(/\/+$/, "");
  } catch {
    throw new Error("APP_BASE_URL must be a valid absolute URL.");
  }
}

function parseBoolean(name, value, fallback) {
  if (value == null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["true", "1", "yes"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }

  throw new Error(`${name} must be true or false.`);
}

function parseContentExpectation(name, value) {
  const normalized = String(value || "known_missing").trim().toLowerCase();

  if (["published", "known_missing"].includes(normalized)) {
    return normalized;
  }

  throw new Error(`${name} must be published or known_missing.`);
}

function parseTimeout(value) {
  const timeoutMs = Number(value || DEFAULT_TIMEOUT_MS);

  if (!Number.isFinite(timeoutMs) || timeoutMs < 500) {
    throw new Error("SMOKE_TIMEOUT_MS must be a number >= 500.");
  }

  return timeoutMs;
}

function buildConfig(env = process.env) {
  return {
    baseUrl: normalizeBaseUrl(env.APP_BASE_URL),
    hostHeader: String(env.SMOKE_HOST_HEADER || "").trim(),
    timeoutMs: parseTimeout(env.SMOKE_TIMEOUT_MS),
    expectReadiness: parseBoolean("EXPECT_READINESS", env.EXPECT_READINESS, true),
    expectations: {
      about: parseContentExpectation("EXPECT_ABOUT", env.EXPECT_ABOUT),
      contacts: parseContentExpectation("EXPECT_CONTACTS", env.EXPECT_CONTACTS)
    },
    mediaUrl: String(env.EXPECT_MEDIA_URL || "").trim()
  };
}

function buildHeaders(config) {
  if (!config.hostHeader) {
    return undefined;
  }

  return {
    host: config.hostHeader
  };
}

function resolveUrl(target, baseUrl) {
  try {
    return new URL(target, `${baseUrl}/`).toString();
  } catch {
    throw new Error("Smoke target URL could not be resolved.");
  }
}

function normalizePathname(value) {
  const pathname = value.replace(/\/+$/, "");
  return pathname || "/";
}

function pathFromUrl(value) {
  try {
    return normalizePathname(new URL(value).pathname);
  } catch {
    return "";
  }
}

function sanitizeUrlForLog(value) {
  try {
    const url = new URL(value);
    return `${url.origin}${normalizePathname(url.pathname)}`;
  } catch {
    return "<invalid-url>";
  }
}

function summarize(checks) {
  const summary = {
    passed: 0,
    failed: 0,
    known_content_blocker: 0,
    skipped: 0
  };

  for (const check of checks) {
    summary[check.result] += 1;
  }

  return summary;
}

function makeCheck({ group, path, expected, actualStatus = null, result, reason, location = null }) {
  return {
    group,
    path,
    expected,
    actualStatus,
    result,
    reason,
    location
  };
}

function isAllowedAdminRedirect(location) {
  if (!location) {
    return false;
  }

  return location.includes("/admin/login") || location.includes("/admin/no-access");
}

function isSensitiveText(value) {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(value));
}

export function containsSensitiveValue(value) {
  try {
    return isSensitiveText(JSON.stringify(value));
  } catch {
    return true;
  }
}

function decodeXmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

export function extractSitemapLocs(xml) {
  const locs = [];
  const pattern = /<loc>\s*([^<]+?)\s*<\/loc>/gi;
  let match = pattern.exec(xml);

  while (match) {
    locs.push(decodeXmlEntities(match[1].trim()));
    match = pattern.exec(xml);
  }

  return [...new Set(locs)];
}

async function fetchWithTimeout(fetchImpl, url, { method, config }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method,
      redirect: "manual",
      headers: buildHeaders(config),
      signal: controller.signal
    });
    const text = method === "HEAD" ? "" : await response.text();

    return {
      ok: true,
      url,
      status: response.status,
      location: response.headers.get("location") || null,
      contentType: response.headers.get("content-type") || "",
      text
    };
  } catch (error) {
    return {
      ok: false,
      url,
      status: null,
      location: null,
      contentType: "",
      text: "",
      errorType: error?.name === "AbortError" ? "timeout" : "network_error"
    };
  } finally {
    clearTimeout(timer);
  }
}

async function probePath(path, context, method = "GET") {
  return fetchWithTimeout(context.fetchImpl, resolveUrl(path, context.config.baseUrl), {
    method,
    config: context.config
  });
}

async function probeAbsolute(url, context, method = "GET") {
  return fetchWithTimeout(context.fetchImpl, url, {
    method,
    config: context.config
  });
}

function parseJsonResponse(response) {
  try {
    return {
      ok: true,
      value: JSON.parse(response.text)
    };
  } catch {
    return {
      ok: false,
      value: null
    };
  }
}

async function checkHealth(context) {
  const response = await probePath("/api/health", context);
  const checks = [];

  if (!response.ok) {
    checks.push(makeCheck({
      group: "runtime",
      path: "/api/health",
      expected: "200 JSON status=ok",
      result: "failed",
      reason: response.errorType
    }));
    return checks;
  }

  const parsed = parseJsonResponse(response);
  const valid = response.status === 200 && parsed.ok && parsed.value?.status === "ok";
  checks.push(makeCheck({
    group: "runtime",
    path: "/api/health",
    expected: "200 JSON status=ok",
    actualStatus: response.status,
    result: valid ? "passed" : "failed",
    reason: valid ? "health ok" : "unexpected health response"
  }));

  checks.push(makeCheck({
    group: "runtime",
    path: "/api/health#no-secrets",
    expected: "public-safe JSON",
    actualStatus: response.status,
    result: parsed.ok && !containsSensitiveValue(parsed.value) ? "passed" : "failed",
    reason: parsed.ok ? "secret scan complete" : "health JSON parse failed"
  }));

  return checks;
}

async function checkReadiness(context) {
  if (!context.config.expectReadiness) {
    return {
      checks: [
        makeCheck({
          group: "runtime",
          path: "/api/readiness",
          expected: "EXPECT_READINESS=false",
          result: "skipped",
          reason: "readiness check disabled by env"
        })
      ],
      marker: null
    };
  }

  const response = await probePath("/api/readiness", context);
  const checks = [];
  let marker = null;

  if (!response.ok) {
    checks.push(makeCheck({
      group: "runtime",
      path: "/api/readiness",
      expected: "200 JSON status=ready database.status=ok",
      result: "failed",
      reason: response.errorType
    }));
    return { checks, marker };
  }

  const parsed = parseJsonResponse(response);
  const readinessOk =
    response.status === 200 &&
    parsed.ok &&
    parsed.value?.status === "ready" &&
    parsed.value?.database?.status === "ok";

  if (parsed.ok) {
    marker = {
      version: parsed.value?.runtime?.version ?? null,
      commit: parsed.value?.runtime?.commit ?? null,
      node: parsed.value?.runtime?.node ?? null
    };
  }

  checks.push(makeCheck({
    group: "runtime",
    path: "/api/readiness",
    expected: "200 JSON status=ready database.status=ok",
    actualStatus: response.status,
    result: readinessOk ? "passed" : "failed",
    reason: readinessOk ? "database readiness ok" : "readiness did not report ready database"
  }));

  checks.push(makeCheck({
    group: "runtime",
    path: "/api/readiness#no-secrets",
    expected: "public-safe JSON",
    actualStatus: response.status,
    result: parsed.ok && !containsSensitiveValue(parsed.value) ? "passed" : "failed",
    reason: parsed.ok ? "secret scan complete" : "readiness JSON parse failed"
  }));

  return { checks, marker };
}

async function checkPublicRoutes(context) {
  const checks = [];

  for (const path of DEFAULT_PUBLIC_ROUTES) {
    const response = await probePath(path, context);
    checks.push(makeCheck({
      group: "public",
      path,
      expected: "200",
      actualStatus: response.status,
      result: response.ok && response.status === 200 ? "passed" : "failed",
      reason: response.ok && response.status === 200 ? "public route ok" : response.errorType || "unexpected public route status"
    }));
  }

  for (const route of OWNER_CONTENT_ROUTES) {
    const response = await probePath(route.path, context);
    const expectation = context.config.expectations[route.label];

    if (!response.ok) {
      checks.push(makeCheck({
        group: "owner-content",
        path: route.path,
        expected: expectation,
        result: "failed",
        reason: response.errorType
      }));
      continue;
    }

    if (expectation === "known_missing") {
      const isKnownMissing = response.status === 404;
      checks.push(makeCheck({
        group: "owner-content",
        path: route.path,
        expected: "404 known owner/content blocker",
        actualStatus: response.status,
        result: isKnownMissing ? "known_content_blocker" : "failed",
        reason: isKnownMissing
          ? "missing approved published content"
          : "route state no longer matches EXPECT_* known_missing"
      }));
      continue;
    }

    checks.push(makeCheck({
      group: "owner-content",
      path: route.path,
      expected: "200 published content",
      actualStatus: response.status,
      result: response.status === 200 ? "passed" : "failed",
      reason: response.status === 200 ? "published content route ok" : "expected published content route"
    }));
  }

  return checks;
}

async function checkRobots(context) {
  const response = await probePath("/robots.txt", context);

  if (!response.ok) {
    return [
      makeCheck({
        group: "seo",
        path: "/robots.txt",
        expected: "200 with sitemap and admin disallow",
        result: "failed",
        reason: response.errorType
      })
    ];
  }

  const hasSitemap = /sitemap:\s*https?:\/\/\S+\/sitemap\.xml/i.test(response.text);
  const blocksAdmin = /disallow:\s*\/admin/i.test(response.text);
  const valid = response.status === 200 && hasSitemap && blocksAdmin;

  return [
    makeCheck({
      group: "seo",
      path: "/robots.txt",
      expected: "200 with sitemap and admin disallow",
      actualStatus: response.status,
      result: valid ? "passed" : "failed",
      reason: valid ? "robots ok" : "robots missing sitemap or admin disallow"
    })
  ];
}

async function checkSitemap(context) {
  const response = await probePath("/sitemap.xml", context);
  const checks = [];

  if (!response.ok) {
    checks.push(makeCheck({
      group: "seo",
      path: "/sitemap.xml",
      expected: "200 XML",
      result: "failed",
      reason: response.errorType
    }));
    return { checks, locs: [] };
  }

  const locs = extractSitemapLocs(response.text);
  checks.push(makeCheck({
    group: "seo",
    path: "/sitemap.xml",
    expected: "200 XML with loc entries",
    actualStatus: response.status,
    result: response.status === 200 && locs.length > 0 ? "passed" : "failed",
    reason: locs.length > 0 ? `${locs.length} sitemap URLs found` : "sitemap has no loc entries"
  }));

  const sitemapPaths = new Set(locs.map(pathFromUrl).filter(Boolean));

  for (const path of CORE_SITEMAP_PATHS) {
    checks.push(makeCheck({
      group: "seo",
      path: `/sitemap.xml#${path}`,
      expected: "core public route present",
      result: sitemapPaths.has(path) ? "passed" : "failed",
      reason: sitemapPaths.has(path) ? "listed" : "missing from sitemap"
    }));
  }

  for (const route of OWNER_CONTENT_ROUTES) {
    const expectation = context.config.expectations[route.label];
    const listed = sitemapPaths.has(route.path);
    const shouldBeListed = expectation === "published";

    checks.push(makeCheck({
      group: "seo",
      path: `/sitemap.xml#${route.path}`,
      expected: shouldBeListed ? "listed because published" : "absent because known_missing",
      result: listed === shouldBeListed ? "passed" : "failed",
      reason: listed === shouldBeListed ? "sitemap matches content expectation" : "sitemap/content expectation mismatch"
    }));
  }

  for (const loc of locs) {
    const target = await probeAbsolute(loc, context);
    const targetPath = pathFromUrl(loc) || sanitizeUrlForLog(loc);
    const valid = target.ok && target.status !== 404 && target.status < 500;
    checks.push(makeCheck({
      group: "seo",
      path: `/sitemap.xml -> ${targetPath}`,
      expected: "listed URL must not return 404/5xx",
      actualStatus: target.status,
      result: valid ? "passed" : "failed",
      reason: valid ? "listed URL resolves" : target.errorType || "listed URL returned invalid status"
    }));
  }

  return { checks, locs };
}

async function checkAdminProtection(context) {
  const checks = [];

  for (const path of ADMIN_ROUTES) {
    const response = await probePath(path, context);

    if (!response.ok) {
      checks.push(makeCheck({
        group: "admin",
        path,
        expected: "redirect to auth, 401, or 403",
        result: "failed",
        reason: response.errorType
      }));
      continue;
    }

    const redirectProtected = response.status >= 300 && response.status < 400 && isAllowedAdminRedirect(response.location);
    const authProtected = response.status === 401 || response.status === 403;
    const valid = redirectProtected || authProtected;

    checks.push(makeCheck({
      group: "admin",
      path,
      expected: "not public and not 500",
      actualStatus: response.status,
      result: valid ? "passed" : "failed",
      reason: valid ? "admin protected" : "admin route is public, missing, or has unexpected status",
      location: response.location
    }));
  }

  return checks;
}

async function checkMedia(context) {
  if (!context.config.mediaUrl) {
    return [
      makeCheck({
        group: "media",
        path: "EXPECT_MEDIA_URL",
        expected: "optional known public media URL",
        result: "skipped",
        reason: "not_configured"
      })
    ];
  }

  const mediaUrl = resolveUrl(context.config.mediaUrl, context.config.baseUrl);
  let response = await probeAbsolute(mediaUrl, context, "HEAD");

  if (response.ok && response.status === 405) {
    response = await probeAbsolute(mediaUrl, context, "GET");
  }

  const valid = response.ok && response.status >= 200 && response.status < 300;

  return [
    makeCheck({
      group: "media",
      path: sanitizeUrlForLog(mediaUrl),
      expected: "2xx from known public media URL",
      actualStatus: response.status,
      result: valid ? "passed" : "failed",
      reason: valid ? "media delivery ok" : response.errorType || "media URL did not return 2xx"
    })
  ];
}

export async function runLaunchSmoke(options = {}) {
  const config = buildConfig(options.env || process.env);
  const context = {
    config,
    fetchImpl: options.fetchImpl || fetch
  };

  const checks = [];
  checks.push(...await checkHealth(context));

  const readiness = await checkReadiness(context);
  checks.push(...readiness.checks);

  checks.push(...await checkPublicRoutes(context));
  checks.push(...await checkRobots(context));

  const sitemap = await checkSitemap(context);
  checks.push(...sitemap.checks);

  checks.push(...await checkAdminProtection(context));
  checks.push(...await checkMedia(context));

  const summary = summarize(checks);

  return {
    traceId: `launch-smoke-${Date.now().toString(36)}`,
    baseUrl: sanitizeUrlForLog(config.baseUrl),
    hostHeader: config.hostHeader || null,
    timeoutMs: config.timeoutMs,
    expectations: {
      about: config.expectations.about,
      contacts: config.expectations.contacts,
      readiness: config.expectReadiness,
      media: config.mediaUrl ? "configured" : "not_configured"
    },
    runtimeMarker: readiness.marker,
    sitemap: {
      urlCount: sitemap.locs.length,
      urls: sitemap.locs.map(sanitizeUrlForLog)
    },
    summary,
    checks
  };
}

async function main() {
  const report = await runLaunchSmoke();
  console.log(JSON.stringify(report, null, 2));

  if (report.summary.failed > 0) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`[smoke:launch] FAILED: ${error.message}`);
    process.exitCode = 1;
  });
}
