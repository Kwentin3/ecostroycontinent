import test from "node:test";
import assert from "node:assert/strict";

import { GET } from "../app/api/admin/telemetry/debug/route.js";

test("telemetry debug read is admin-only", async () => {
  const response = await GET(new Request("http://localhost/api/admin/telemetry/debug"), {}, {
    getCurrentUser: async () => null
  });
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.ok, false);
});

test("telemetry debug read defaults to excluding internal and test traffic", async () => {
  let capturedOptions = null;
  const response = await GET(new Request("http://localhost/api/admin/telemetry/debug"), {}, {
    getCurrentUser: async () => ({ id: "admin_1", role: "superadmin" }),
    getTelemetryDebugSummary: async (options) => {
      capturedOptions = options;
      return {
        events_by_name: { page_viewed: 1 },
        contact_journey_count: 0,
        default_excludes_internal: true,
        default_excludes_test: true
      };
    }
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.deepEqual(capturedOptions, {
    includeInternal: false,
    includeTest: false
  });
});

test("telemetry debug read can include internal/test events explicitly", async () => {
  let capturedOptions = null;
  const response = await GET(new Request("http://localhost/api/admin/telemetry/debug?include_internal=1&include_test=true"), {}, {
    getCurrentUser: async () => ({ id: "admin_1", role: "superadmin" }),
    getTelemetryDebugSummary: async (options) => {
      capturedOptions = options;
      return { events_by_name: {}, contact_journey_count: 0 };
    }
  });

  assert.equal(response.status, 200);
  assert.deepEqual(capturedOptions, {
    includeInternal: true,
    includeTest: true
  });
});
