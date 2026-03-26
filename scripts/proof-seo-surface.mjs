const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
const seoUsername = process.env.SEED_SEO_USERNAME ?? "seo";
const seoPassword = process.env.SEED_SEO_PASSWORD ?? "change-me-seo";
const cliArgs = new Set(process.argv.slice(2));
const mutateRequested = cliArgs.has("--mutate") || process.env.SEO_TEST_MUTATE === "1";
const mutationAck = process.env.SEO_TEST_MUTATION_OK === "1";

function log(message) {
  console.log(`[seo-surface] ${message}`);
}

function fail(message) {
  throw new Error(message);
}

function ensure(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function buildFormData(entries) {
  const form = new FormData();

  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      for (const item of value) {
        form.append(key, item);
      }
      continue;
    }

    form.append(key, value);
  }

  return form;
}

function getSetCookieHeader(response) {
  return response.headers.getSetCookie?.() ?? [];
}

function extractCookies(response) {
  return getSetCookieHeader(response)
    .map((item) => item.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function request(path, { method = "GET", cookie = "", body = null, redirect = "manual" } = {}) {
  return fetch(new URL(path, baseUrl), {
    method,
    headers: cookie ? { cookie } : undefined,
    body,
    redirect
  });
}

async function login(username, password) {
  const response = await request("/api/admin/login", {
    method: "POST",
    body: buildFormData([
      ["username", username],
      ["password", password]
    ])
  });

  if (!(response.status >= 300 && response.status < 400)) {
    return null;
  }

  const cookie = extractCookies(response);

  if (!cookie) {
    return null;
  }

  return cookie;
}

async function readHtml(path, cookie) {
  const response = await request(path, { cookie, redirect: "follow" });
  ensure(response.ok, `GET ${path} failed with ${response.status}.`);
  return await response.text();
}

async function probeRoute(path, cookie) {
  const response = await request(path, { cookie, redirect: "manual" });
  const location = response.headers.get("location");

  return {
    path,
    status: response.status,
    location: location || null,
    redirectedToNoAccess: Boolean(location && location.includes("/admin/no-access")),
    redirectedToLogin: Boolean(location && location.includes("/admin/login")),
    ok: response.ok
  };
}

async function probePostRoute(path, cookie, entries = []) {
  const response = await request(path, {
    method: "POST",
    cookie,
    body: buildFormData(entries),
    redirect: "manual"
  });
  const location = response.headers.get("location");

  return {
    path,
    status: response.status,
    location: location || null,
    redirectedToNoAccess: Boolean(location && location.includes("/admin/no-access")),
    redirectedToLogin: Boolean(location && location.includes("/admin/login")),
    ok: response.ok
  };
}

function extractFirstLink(html, pattern) {
  const match = html.match(pattern);
  return match ? match[1] : null;
}

function extractFirstEntityIdFromList(html, entityType) {
  const pattern = new RegExp(`href="\\/admin\\/entities\\/${entityType}\\/([^"]+)"`, "g");
  const matches = [...html.matchAll(pattern)];

  for (const match of matches) {
    const candidate = match[1];

    if (candidate !== "new") {
      return candidate;
    }
  }

  return null;
}

function extractRevisionIdFromEditor(html) {
  const submitMatch = html.match(/\/api\/admin\/revisions\/([^/]+)\/submit/);

  if (submitMatch) {
    return submitMatch[1];
  }

  const publishMatch = html.match(/\/admin\/revisions\/([^/]+)\/publish/);
  return publishMatch ? publishMatch[1] : null;
}

function createProofPngFile() {
  const pngBytes = Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
    0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0xc9, 0xfe, 0x92,
    0xef, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
    0x44, 0xae, 0x42, 0x60, 0x82
  ]);

  return new File([pngBytes], "seo-surface-proof.png", { type: "image/png" });
}

async function createScratchServiceDraft(cookie, proofId) {
  const slug = `seo-surface-${proofId}`;
  const title = `SEO Surface ${proofId}`;

  const response = await request("/api/admin/entities/service/save", {
    method: "POST",
    cookie,
    body: buildFormData([
      ["entityId", ""],
      ["changeIntent", "Create SEO surface proof service draft"],
      ["slug", slug],
      ["title", title],
      ["h1", title],
      ["summary", "SEO surface proof summary"],
      ["serviceScope", "SEO surface proof scope"],
      ["ctaVariant", "proof-cta"],
      ["metaTitle", "SEO surface proof title"],
      ["metaDescription", "SEO surface proof description"]
    ])
  });

  ensure(response.status >= 300 && response.status < 400, "Service draft save should redirect.");

  const location = response.headers.get("location");
  ensure(location, "Service draft save redirect is missing.");
  const redirectUrl = new URL(location, baseUrl);
  const entityIdMatch = redirectUrl.pathname.match(/\/admin\/entities\/service\/([^/?]+)/);
  ensure(entityIdMatch, "Could not extract scratch service entity id.");

  const entityId = entityIdMatch[1];
  const editorHtml = await readHtml(`/admin/entities/service/${entityId}`, cookie);
  const revisionId = extractRevisionIdFromEditor(editorHtml);
  ensure(revisionId, "Could not extract scratch service revision id.");

  const submitResponse = await request(`/api/admin/revisions/${revisionId}/submit`, {
    method: "POST",
    cookie,
    body: buildFormData([])
  });

  ensure(submitResponse.status >= 300 && submitResponse.status < 400, "Scratch revision submit should redirect.");

  return {
    entityId,
    revisionId,
    slug
  };
}

async function uploadScratchMedia(cookie, proofId) {
  const form = new FormData();
  form.append("redirectTo", "/admin/entities/media_asset");
  form.append("title", `SEO Surface Media ${proofId}`);
  form.append("alt", "SEO surface proof alt");
  form.append("ownershipNote", "SEO surface proof ownership");
  form.append("sourceNote", "Generated for SEO surface probe");
  form.append("file", createProofPngFile());

  const response = await request("/api/admin/media/upload", {
    method: "POST",
    cookie,
    body: form
  });

  ensure(response.status >= 300 && response.status < 400, "Media upload should redirect.");
  const location = response.headers.get("location");
  ensure(location, "Media upload redirect is missing.");

  return new URL(location, baseUrl).searchParams.get("entityId");
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log([
      "proof:seo:surface",
      "Usage: node scripts/proof-seo-surface.mjs [--mutate]",
      "Environment:",
      "  APP_BASE_URL",
      "  SEED_SEO_USERNAME",
      "  SEED_SEO_PASSWORD",
      "  SEO_TEST_MUTATE=1",
      "  SEO_TEST_MUTATION_OK=1",
      "",
      "Default mode is read-only probe.",
      "Mutation mode is stage/dev-only and must be explicitly acknowledged.",
      "Production mutation is refused before any probe activity begins."
    ].join("\n"));
    return;
  }

  if (mutateRequested) {
    ensure(mutationAck, "Set SEO_TEST_MUTATION_OK=1 to acknowledge mutation mode.");

    const nodeEnv = process.env.NODE_ENV ?? "development";
    ensure(nodeEnv !== "production", "Mutation mode is not allowed in production.");
  }

  const probeId = Date.now().toString(36);
  const summary = {
    traceId: `seo-probe-${probeId}`,
    baseUrl,
    auth: {
      username: seoUsername,
      loggedIn: false
    },
    routes: {},
    gaps: [],
    mutations: null
  };

  log(`starting probe ${summary.traceId}`);

  const cookie = await login(seoUsername, seoPassword);

  if (!cookie) {
    fail("SEO fixture is unavailable or inactive. Provide an active stage/dev SEO account before probing.");
  }

  summary.auth.loggedIn = true;

  const visibleRoutes = [
    "/admin",
    "/admin/review",
    "/admin/entities/global_settings",
    "/admin/entities/media_asset",
    "/admin/entities/gallery",
    "/admin/entities/service",
    "/admin/entities/case",
    "/admin/entities/page"
  ];

  for (const route of visibleRoutes) {
    summary.routes[route] = await probeRoute(route, cookie);
  }

  summary.routes["/admin/users"] = await probeRoute("/admin/users", cookie);
  summary.routes["POST /api/admin/users/create"] = await probePostRoute("/api/admin/users/create", cookie);

  const reviewHtml = await readHtml("/admin/review", cookie);
  const reviewRevisionId = extractFirstLink(reviewHtml, /href="\/admin\/review\/([^"]+)"/);

  if (!reviewRevisionId) {
    summary.gaps.push("no_review_fixture_available");
  } else {
    summary.routes[`/admin/review/${reviewRevisionId}`] = await probeRoute(`/admin/review/${reviewRevisionId}`, cookie);
    summary.routes[`/admin/revisions/${reviewRevisionId}/publish`] = await probeRoute(`/admin/revisions/${reviewRevisionId}/publish`, cookie);
    summary.routes[`POST /api/admin/revisions/${reviewRevisionId}/publish`] = await probePostRoute(`/api/admin/revisions/${reviewRevisionId}/publish`, cookie);
    summary.routes[`POST /api/admin/revisions/${reviewRevisionId}/owner-action`] = await probePostRoute(
      `/api/admin/revisions/${reviewRevisionId}/owner-action`,
      cookie,
      [
        ["action", "approve"],
        ["comment", "SEO probe boundary check"]
      ]
    );
  }

  const serviceListHtml = await readHtml("/admin/entities/service", cookie);
  const serviceEntityId = extractFirstEntityIdFromList(serviceListHtml, "service");

  if (serviceEntityId) {
    summary.routes[`/admin/entities/service/${serviceEntityId}`] = await probeRoute(`/admin/entities/service/${serviceEntityId}`, cookie);
    summary.routes[`/admin/entities/service/${serviceEntityId}/history`] = await probeRoute(`/admin/entities/service/${serviceEntityId}/history`, cookie);
    summary.routes[`POST /api/admin/entities/service/${serviceEntityId}/rollback`] = await probePostRoute(
      `/api/admin/entities/service/${serviceEntityId}/rollback`,
      cookie,
      [["targetRevisionId", "rev_probe"]]
    );
  }

  if (mutateRequested) {
    const scratch = {
      service: null,
      mediaAssetId: null
    };

    scratch.service = await createScratchServiceDraft(cookie, probeId);
    scratch.mediaAssetId = await uploadScratchMedia(cookie, probeId);

    summary.mutations = scratch;
  }

  log(`probe complete ${summary.traceId}`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(`[seo-surface] FAILED: ${error.message}`);
  process.exitCode = 1;
});
