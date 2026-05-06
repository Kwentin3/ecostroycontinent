import test from "node:test";
import assert from "node:assert/strict";

import { probeCdn } from "../lib/admin/infra-health.js";

const storageResult = {
  item: {
    tone: "healthy"
  },
  probeKey: "media/asset 123.webp"
};

test("CDN health reports app proxy standby without probing CDN", async () => {
  let fetchCalled = false;
  const item = await probeCdn(
    {
      mediaDeliveryMode: "app_proxy",
      mediaPublicBaseUrl: ""
    },
    storageResult,
    {
      fetchImpl: async () => {
        fetchCalled = true;
        return { ok: true, status: 200 };
      }
    }
  );

  assert.equal(fetchCalled, false);
  assert.equal(item.status, "standby");
  assert.equal(item.tone, "unknown");
  assert.deepEqual(item.lines, ["delivery: app_proxy", "host: не используется"]);
});

test("CDN health samples multiple edges before reporting ok", async () => {
  const statuses = [200, 403, 200, 403];
  const observed = [];

  const item = await probeCdn(
    {
      mediaDeliveryMode: "auto",
      mediaPublicBaseUrl: "https://cdn.example.test"
    },
    storageResult,
    {
      fetchImpl: async (url, options) => {
        observed.push({ url, method: options.method });
        const status = statuses.shift();
        return { ok: status >= 200 && status < 300, status };
      }
    }
  );

  assert.equal(observed.length, 4);
  assert.deepEqual(
    observed.map((entry) => entry.url),
    Array(4).fill("https://cdn.example.test/media/asset%20123.webp")
  );
  assert.deepEqual([...new Set(observed.map((entry) => entry.method))], ["HEAD"]);
  assert.equal(item.status, "warn");
  assert.equal(item.tone, "degraded");
  assert.match(item.note, /edge: 2\/4 ok/);
  assert.match(item.note, /403/);
});

test("CDN health reports ok only when every edge sample succeeds", async () => {
  const item = await probeCdn(
    {
      mediaDeliveryMode: "cdn",
      mediaPublicBaseUrl: "https://cdn.example.test"
    },
    storageResult,
    {
      fetchImpl: async () => ({ ok: true, status: 200 })
    }
  );

  assert.equal(item.status, "ok");
  assert.equal(item.tone, "healthy");
  assert.deepEqual(item.lines, ["host: cdn.example.test", "delivery: cdn"]);
});

test("CDN health reports down when every edge sample fails", async () => {
  const item = await probeCdn(
    {
      mediaDeliveryMode: "auto",
      mediaPublicBaseUrl: "https://cdn.example.test"
    },
    storageResult,
    {
      fetchImpl: async () => {
        throw new Error("network failure");
      }
    }
  );

  assert.equal(item.status, "down");
  assert.equal(item.tone, "down");
  assert.match(item.note, /edge: 0\/4 ok/);
  assert.match(item.note, /Error/);
});
