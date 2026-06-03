import test from "node:test";
import assert from "node:assert/strict";

import {
  containsSensitiveValue,
  extractSitemapLocs,
  runLaunchSmoke
} from "../scripts/smoke-launch-readonly.mjs";

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

function textResponse(value, status = 200, headers = {}) {
  return new Response(value, {
    status,
    headers
  });
}

function redirectResponse(location, status = 307) {
  return new Response("", {
    status,
    headers: {
      location
    }
  });
}

function createFetch(routes) {
  return async (input, options = {}) => {
    const url = new URL(input);
    const method = options.method || "GET";
    const key = `${method} ${url.pathname}`;
    const fallbackKey = `GET ${url.pathname}`;
    const route = routes[key] ?? routes[fallbackKey];

    if (!route) {
      return textResponse("not found", 404);
    }

    return typeof route === "function" ? route(url, options) : route.clone();
  };
}

function createLaunchRoutes({ sitemapXml, ownerPages = "missing" }) {
  const ownerStatus = ownerPages === "published" ? 200 : 404;

  return {
    "GET /api/health": jsonResponse({
      status: "ok",
      service: "next-app",
      nodeEnv: "production",
      databaseConfigured: true
    }),
    "GET /api/readiness": jsonResponse({
      status: "ready",
      service: "next-app",
      nodeEnv: "production",
      database: {
        status: "ok"
      },
      runtime: {
        node: "v22.22.2",
        version: "0.1.0",
        commit: "abc1234",
        buildTime: "2026-05-06T09:00:00Z"
      }
    }),
    "GET /": textResponse("<html>home</html>"),
    "GET /services": textResponse("<html>services</html>"),
    "GET /cases": textResponse("<html>cases</html>"),
    "GET /about": textResponse(ownerPages === "published" ? "<html>about</html>" : "not found", ownerStatus),
    "GET /contacts": textResponse(ownerPages === "published" ? "<html>contacts</html>" : "not found", ownerStatus),
    "GET /robots.txt": textResponse([
      "User-agent: *",
      "Allow: /",
      "Disallow: /admin",
      "Sitemap: https://example.test/sitemap.xml"
    ].join("\n")),
    "GET /sitemap.xml": textResponse(sitemapXml, 200, {
      "content-type": "application/xml"
    }),
    "GET /admin": redirectResponse("/admin/login"),
    "GET /admin/review": redirectResponse("/admin/login"),
    "GET /admin/entities/service": redirectResponse("/admin/login")
  };
}

test("extractSitemapLocs reads unique sitemap loc entries", () => {
  const locs = extractSitemapLocs(`
    <urlset>
      <url><loc>https://example.test/</loc></url>
      <url><loc>https://example.test/services?x=1&amp;y=2</loc></url>
      <url><loc>https://example.test/</loc></url>
    </urlset>
  `);

  assert.deepEqual(locs, [
    "https://example.test/",
    "https://example.test/services?x=1&y=2"
  ]);
});

test("containsSensitiveValue catches connection strings and secret-shaped fields", () => {
  assert.equal(containsSensitiveValue({ database: { status: "ok" } }), false);
  assert.equal(containsSensitiveValue({ error: "postgres://user:secret@example.test/db" }), true);
  assert.equal(containsSensitiveValue({ DATABASE_URL: "hidden" }), true);
});

test("runLaunchSmoke defaults to published owner pages for current production", async () => {
  const sitemapXml = `
    <urlset>
      <url><loc>https://example.test/</loc></url>
      <url><loc>https://example.test/services</loc></url>
      <url><loc>https://example.test/cases</loc></url>
      <url><loc>https://example.test/about</loc></url>
      <url><loc>https://example.test/contacts</loc></url>
    </urlset>
  `;
  const report = await runLaunchSmoke({
    env: {
      APP_BASE_URL: "https://example.test"
    },
    fetchImpl: createFetch(createLaunchRoutes({ sitemapXml, ownerPages: "published" }))
  });

  assert.equal(report.summary.failed, 0);
  assert.equal(report.expectations.about, "published");
  assert.equal(report.expectations.contacts, "published");
  assert.equal(
    report.checks.some((check) => check.path === "/sitemap.xml#/about" && check.result === "passed"),
    true
  );
  assert.equal(
    report.checks.some((check) => check.path === "/sitemap.xml#/contacts" && check.result === "passed"),
    true
  );
});

test("runLaunchSmoke passes with known missing owner pages and protected admin", async () => {
  const sitemapXml = `
    <urlset>
      <url><loc>https://example.test/</loc></url>
      <url><loc>https://example.test/services</loc></url>
      <url><loc>https://example.test/cases</loc></url>
    </urlset>
  `;
  const report = await runLaunchSmoke({
    env: {
      APP_BASE_URL: "https://example.test",
      EXPECT_ABOUT: "known_missing",
      EXPECT_CONTACTS: "known_missing",
      EXPECT_RUNTIME_COMMIT: "true"
    },
    fetchImpl: createFetch(createLaunchRoutes({ sitemapXml }))
  });

  assert.equal(report.summary.failed, 0);
  assert.equal(report.summary.known_content_blocker, 2);
  assert.equal(report.runtimeMarker.commit, "abc1234");
  assert.equal(report.runtimeMarker.buildTime, "2026-05-06T09:00:00Z");
  assert.equal(report.sitemap.urlCount, 3);
});

test("runLaunchSmoke fails when sitemap lists a known missing owner route", async () => {
  const sitemapXml = `
    <urlset>
      <url><loc>https://example.test/</loc></url>
      <url><loc>https://example.test/services</loc></url>
      <url><loc>https://example.test/cases</loc></url>
      <url><loc>https://example.test/about</loc></url>
    </urlset>
  `;
  const report = await runLaunchSmoke({
    env: {
      APP_BASE_URL: "https://example.test",
      EXPECT_ABOUT: "known_missing",
      EXPECT_CONTACTS: "known_missing"
    },
    fetchImpl: createFetch(createLaunchRoutes({ sitemapXml }))
  });

  assert.equal(report.summary.failed > 0, true);
  assert.equal(
    report.checks.some((check) => check.path === "/sitemap.xml#/about" && check.result === "failed"),
    true
  );
});

test("runLaunchSmoke fails strict runtime commit acceptance when commit marker is missing", async () => {
  const sitemapXml = `
    <urlset>
      <url><loc>https://example.test/</loc></url>
      <url><loc>https://example.test/services</loc></url>
      <url><loc>https://example.test/cases</loc></url>
    </urlset>
  `;
  const routes = createLaunchRoutes({ sitemapXml });
  routes["GET /api/readiness"] = jsonResponse({
    status: "ready",
    service: "next-app",
    nodeEnv: "production",
    database: {
      status: "ok"
    },
    runtime: {
      node: "v22.22.2",
      version: "0.1.0",
      commit: null,
      buildTime: null
    }
  });

  const report = await runLaunchSmoke({
    env: {
      APP_BASE_URL: "https://example.test",
      EXPECT_ABOUT: "known_missing",
      EXPECT_CONTACTS: "known_missing",
      EXPECT_RUNTIME_COMMIT: "true"
    },
    fetchImpl: createFetch(routes)
  });

  assert.equal(
    report.checks.some((check) => check.path === "/api/readiness#runtime.commit" && check.result === "failed"),
    true
  );
  assert.equal(report.summary.failed > 0, true);
});
