import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("display mode debug overrides are gated by config and stay subordinate to formal mode", () => {
  const configSource = readFileSync(new URL("../lib/config.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const proxySource = readFileSync(new URL("../proxy.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const runtimeResolverSource = readFileSync(new URL("../lib/public-launch/runtime-display-mode.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const runtimeProbeRoute = readFileSync(new URL("../app/api/public/display-mode/route.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");

  assert.match(configSource, /PUBLIC_DISPLAY_MODE_DEBUG_OVERRIDE_ENABLED/);
  assert.match(configSource, /publicDisplayModeDebugOverrideEnabled/);

  assert.match(proxySource, /PUBLIC_DISPLAY_MODE_QUERY_PARAM/);
  assert.match(proxySource, /publicDisplayModeDebugOverrideEnabled/);
  assert.match(proxySource, /debugMode/);
  assert.match(proxySource, /resolvePersistedModeFromRuntimeProbe/);
  assert.match(proxySource, /X-Robots-Tag/);
  assert.match(proxySource, /getDisplayModeState/);
  assert.match(proxySource, /export async function proxy/);
  assert.doesNotMatch(proxySource, /runtime = \"nodejs\"/);
  assert.doesNotMatch(proxySource, /cachedPersistedMode/);
  assert.doesNotMatch(proxySource, /PERSISTED_MODE_CACHE_TTL_MS/);

  assert.match(runtimeResolverSource, /allowDebugOverride/);
  assert.match(runtimeResolverSource, /publicDisplayModeDebugOverrideEnabled/);
  assert.match(runtimeProbeRoute, /getDisplayModeState/);
  assert.match(runtimeProbeRoute, /indexingSuppressed/);
});
