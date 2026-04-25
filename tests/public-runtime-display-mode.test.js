import test from "node:test";
import assert from "node:assert/strict";

import { PUBLIC_DISPLAY_MODES } from "../lib/public-launch/display-mode.js";
import { resolvePublicRuntimeDisplayMode } from "../lib/public-launch/runtime-display-mode.js";

function createCookieStore(values = {}) {
  return {
    get(key) {
      if (!(key in values)) {
        return undefined;
      }

      return { value: values[key] };
    }
  };
}

test("runtime display mode uses persisted mixed mode when no debug override is present", async () => {
  const resolved = await resolvePublicRuntimeDisplayMode({}, {
    persistedMode: PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER,
    cookieStore: createCookieStore()
  });

  assert.equal(resolved.mode, PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER);
  assert.equal(resolved.placeholderFallbackEnabled, true);
  assert.equal(resolved.debugOverrideMode, null);
});

test("runtime display mode accepts legacy placeholder query override as mixed mode", async () => {
  const resolved = await resolvePublicRuntimeDisplayMode(
    { __placeholder: "on" },
    {
      persistedMode: PUBLIC_DISPLAY_MODES.PUBLISHED_ONLY,
      cookieStore: createCookieStore()
    }
  );

  assert.equal(resolved.mode, PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER);
  assert.equal(resolved.source, "debug_override");
  assert.equal(resolved.debugOverrideSource, "query_placeholder_toggle");
});

test("runtime display mode resolves formal display mode query override", async () => {
  const resolved = await resolvePublicRuntimeDisplayMode(
    { __display_mode: "under_construction" },
    {
      persistedMode: PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER,
      cookieStore: createCookieStore()
    }
  );

  assert.equal(resolved.mode, PUBLIC_DISPLAY_MODES.UNDER_CONSTRUCTION);
  assert.equal(resolved.underConstruction, true);
  assert.equal(resolved.debugOverrideSource, "query_display_mode");
});
