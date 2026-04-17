import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("display mode debug overrides are gated by config and stay subordinate to formal mode", () => {
  const configSource = readFileSync(new URL("../lib/config.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const middlewareSource = readFileSync(new URL("../middleware.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const runtimeResolverSource = readFileSync(new URL("../lib/public-launch/runtime-display-mode.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const runtimeProbeRoute = readFileSync(new URL("../app/api/public/display-mode/route.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");

  assert.match(configSource, /PUBLIC_DISPLAY_MODE_DEBUG_OVERRIDE_ENABLED/);
  assert.match(configSource, /publicDisplayModeDebugOverrideEnabled/);

  assert.match(middlewareSource, /PUBLIC_DISPLAY_MODE_QUERY_PARAM/);
  assert.match(middlewareSource, /publicDisplayModeDebugOverrideEnabled/);
  assert.match(middlewareSource, /debugMode/);
  assert.match(middlewareSource, /resolvePersistedModeFromRuntimeProbe/);
  assert.match(middlewareSource, /X-Robots-Tag/);
  assert.doesNotMatch(middlewareSource, /getDisplayModeState/);
  assert.doesNotMatch(middlewareSource, /cachedPersistedMode/);
  assert.doesNotMatch(middlewareSource, /PERSISTED_MODE_CACHE_TTL_MS/);

  assert.match(runtimeResolverSource, /allowDebugOverride/);
  assert.match(runtimeResolverSource, /publicDisplayModeDebugOverrideEnabled/);
  assert.match(runtimeProbeRoute, /getDisplayModeState/);
  assert.match(runtimeProbeRoute, /indexingSuppressed/);
});
