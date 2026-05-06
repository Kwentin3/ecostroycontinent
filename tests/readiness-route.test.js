import test from "node:test";
import assert from "node:assert/strict";

import { GET } from "../app/api/readiness/route.js";
import { buildReadinessSnapshot } from "../lib/health/readiness.js";

function makeConfig(overrides = {}) {
  return {
    nodeEnv: "test",
    databaseConfigured: true,
    ...overrides
  };
}

test("readiness snapshot returns ready only after the DB probe succeeds", async () => {
  let queryText = "";

  const snapshot = await buildReadinessSnapshot({
    config: makeConfig(),
    queryFn: async (text) => {
      queryText = text;
      return { rows: [{ ok: 1 }] };
    },
    now: () => new Date("2026-05-05T08:00:00.000Z"),
    env: {
      APP_VERSION: "0.1.0",
      APP_COMMIT_SHA: "commit_readiness"
    }
  });

  assert.equal(queryText, "SELECT 1 AS ok");
  assert.equal(snapshot.httpStatus, 200);
  assert.equal(snapshot.body.status, "ready");
  assert.equal(snapshot.body.service, "next-app");
  assert.equal(snapshot.body.nodeEnv, "test");
  assert.equal(snapshot.body.timestamp, "2026-05-05T08:00:00.000Z");
  assert.deepEqual(snapshot.body.database, { status: "ok" });
  assert.equal(snapshot.body.runtime.version, "0.1.0");
  assert.equal(snapshot.body.runtime.commit, "commit_readiness");
});

test("readiness snapshot fails closed and does not expose DB error details", async () => {
  const snapshot = await buildReadinessSnapshot({
    config: makeConfig(),
    queryFn: async () => {
      throw new Error("postgres://user:secret-password@db/internal failure");
    },
    now: () => new Date("2026-05-05T08:01:00.000Z"),
    env: {
      DATABASE_URL: "postgres://user:secret-password@db/app"
    }
  });
  const serialized = JSON.stringify(snapshot.body);

  assert.equal(snapshot.httpStatus, 503);
  assert.equal(snapshot.body.status, "not_ready");
  assert.deepEqual(snapshot.body.database, { status: "error" });
  assert.ok(!serialized.includes("postgres://"));
  assert.ok(!serialized.includes("secret-password"));
  assert.ok(!serialized.includes("DATABASE_URL"));
  assert.ok(!serialized.includes("internal failure"));
});

test("readiness snapshot reports missing DB config without running a probe", async () => {
  let called = false;

  const snapshot = await buildReadinessSnapshot({
    config: makeConfig({ databaseConfigured: false }),
    queryFn: async () => {
      called = true;
      return { rows: [{ ok: 1 }] };
    },
    now: () => new Date("2026-05-05T08:02:00.000Z")
  });

  assert.equal(called, false);
  assert.equal(snapshot.httpStatus, 503);
  assert.equal(snapshot.body.status, "not_ready");
  assert.deepEqual(snapshot.body.database, { status: "not_configured" });
});

test("readiness route returns terminal status and no-store/noindex headers", async () => {
  const response = await GET(new Request("http://localhost/api/readiness"), {}, {
    buildReadinessSnapshot: async () => ({
      httpStatus: 503,
      body: {
        status: "not_ready",
        service: "next-app",
        nodeEnv: "test",
        timestamp: "2026-05-05T08:03:00.000Z",
        database: { status: "error" },
        runtime: { node: "v22.0.0", version: null, commit: null }
      }
    })
  });
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "no-store, max-age=0");
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
  assert.equal(body.status, "not_ready");
  assert.deepEqual(body.database, { status: "error" });
});
