import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { POST } from "../../app/api/admin/system/display-mode/route.js";

function buildRequest(fields = {}) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      formData.set(key, String(value));
    }
  }

  return new Request("http://localhost/api/admin/system/display-mode", {
    method: "POST",
    body: formData
  });
}

test("display mode switch route allows superadmin and records actor-bound mode change", async () => {
  let capturedInput = null;

  const response = await POST(
    buildRequest({
      redirectTo: "/admin",
      mode: "mixed_placeholder",
      reason: "Enable architecture verification mode"
    }),
    {},
    {
      requireRouteUser: async () => ({ user: { id: "user_super", role: "superadmin" }, response: null }),
      userIsSuperadmin: () => true,
      getString: (formData, key) => formData.get(key)?.toString() ?? "",
      getBoolean: () => false,
      parsePublicDisplayMode: (value) => value,
      getPublicDisplayModeMeta: (mode) => ({ mode, label: mode }),
      setDisplayModeState: async (input) => {
        capturedInput = input;
        return { changed: true };
      }
    }
  );

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location")?.startsWith("http://localhost:3000/admin?message="), true);
  assert.deepEqual(capturedInput, {
    mode: "mixed_placeholder",
    actorUserId: "user_super",
    reason: "Enable architecture verification mode"
  });
});

test("display mode switch route blocks non-superadmin users", async () => {
  const response = await POST(
    buildRequest({
      mode: "mixed_placeholder",
      reason: "Should not be accepted"
    }),
    {},
    {
      requireRouteUser: async () => ({ user: { id: "user_seo", role: "seo_manager" }, response: null }),
      userIsSuperadmin: () => false,
      getString: () => "",
      getBoolean: () => false,
      parsePublicDisplayMode: () => "mixed_placeholder",
      getPublicDisplayModeMeta: () => ({ label: "mixed_placeholder" }),
      setDisplayModeState: async () => {
        throw new Error("setDisplayModeState should not run");
      }
    }
  );

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "http://localhost:3000/admin/no-access");
});

test("display mode switch route requires explicit confirmation for published_only", async () => {
  const response = await POST(
    buildRequest({
      redirectTo: "/admin",
      mode: "published_only",
      reason: "Вернуть опубликованный режим"
    }),
    {},
    {
      requireRouteUser: async () => ({ user: { id: "user_super", role: "superadmin" }, response: null }),
      userIsSuperadmin: () => true,
      getString: (formData, key) => formData.get(key)?.toString() ?? "",
      getBoolean: () => false,
      parsePublicDisplayMode: (value) => value,
      getPublicDisplayModeMeta: () => ({ label: "published_only" }),
      setDisplayModeState: async () => {
        throw new Error("setDisplayModeState should not run");
      }
    }
  );

  assert.equal(response.status, 303);
  const location = response.headers.get("location") || "";
  assert.match(location, /error=/);
  const decodedLocation = decodeURIComponent(location.replace(/\+/g, " "));
  assert.match(decodedLocation, /Переключение в режим только опубликованного контента требует явного подтверждения/);
});

test("admin dashboard wiring includes display mode control panel and api route", () => {
  const dashboardSource = readFileSync(new URL("../../app/admin/(console)/page.js", import.meta.url), "utf8")
    .replace(/\r\n/g, "\n");
  const panelSource = readFileSync(new URL("../../components/admin/PublicDisplayModeControlPanel.js", import.meta.url), "utf8")
    .replace(/\r\n/g, "\n");
  const routeSource = readFileSync(new URL("../../app/api/admin/system/display-mode/route.js", import.meta.url), "utf8")
    .replace(/\r\n/g, "\n");

  assert.match(dashboardSource, /PublicDisplayModeControlPanel/);
  assert.match(dashboardSource, /getDisplayModeState/);
  assert.match(dashboardSource, /listDisplayModeAuditTrail/);
  assert.match(panelSource, /action="\/api\/admin\/system\/display-mode"/);
  assert.match(routeSource, /confirmPublishedOnly/);
  assert.match(routeSource, /userIsSuperadmin/);
});
