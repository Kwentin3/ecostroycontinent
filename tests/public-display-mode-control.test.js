import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  DEFAULT_PUBLIC_DISPLAY_MODE,
  PUBLIC_DISPLAY_MODES,
  buildPublicDisplayModeSnapshot,
  normalizePublicDisplayMode,
  parsePublicDisplayMode,
  resolvePublicDisplayModePriority
} from "../lib/public-launch/display-mode.js";

test("display mode parser accepts only canonical mode values", () => {
  assert.equal(parsePublicDisplayMode("published_only"), PUBLIC_DISPLAY_MODES.PUBLISHED_ONLY);
  assert.equal(parsePublicDisplayMode("MIXED_PLACEHOLDER"), PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER);
  assert.equal(parsePublicDisplayMode("under_construction"), PUBLIC_DISPLAY_MODES.UNDER_CONSTRUCTION);
  assert.equal(parsePublicDisplayMode("unknown"), null);
  assert.equal(parsePublicDisplayMode(undefined), null);
});

test("display mode normalization is fail-safe to published_only", () => {
  assert.equal(normalizePublicDisplayMode("published_only"), PUBLIC_DISPLAY_MODES.PUBLISHED_ONLY);
  assert.equal(normalizePublicDisplayMode("mixed_placeholder"), PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER);
  assert.equal(normalizePublicDisplayMode("not-a-mode"), DEFAULT_PUBLIC_DISPLAY_MODE);
});

test("display mode snapshot exposes fallback and indexing flags", () => {
  const published = buildPublicDisplayModeSnapshot({ mode: PUBLIC_DISPLAY_MODES.PUBLISHED_ONLY });
  const mixed = buildPublicDisplayModeSnapshot({ mode: PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER });
  const holding = buildPublicDisplayModeSnapshot({ mode: PUBLIC_DISPLAY_MODES.UNDER_CONSTRUCTION });

  assert.equal(published.placeholderFallbackEnabled, false);
  assert.equal(published.underConstruction, false);
  assert.equal(published.indexingSuppressed, false);

  assert.equal(mixed.placeholderFallbackEnabled, true);
  assert.equal(mixed.underConstruction, false);
  assert.equal(mixed.indexingSuppressed, true);

  assert.equal(holding.placeholderFallbackEnabled, false);
  assert.equal(holding.underConstruction, true);
  assert.equal(holding.indexingSuppressed, true);
});

test("display mode resolver honors priority under_construction > mixed_placeholder > published_only", () => {
  const fromPersisted = resolvePublicDisplayModePriority({ persistedMode: PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER });
  const fromDebug = resolvePublicDisplayModePriority({
    persistedMode: PUBLIC_DISPLAY_MODES.PUBLISHED_ONLY,
    debugOverrideMode: PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER
  });
  const forcedHolding = resolvePublicDisplayModePriority({
    persistedMode: PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER,
    forcedMode: PUBLIC_DISPLAY_MODES.UNDER_CONSTRUCTION
  });

  assert.equal(fromPersisted.mode, PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER);
  assert.equal(fromPersisted.source, "persisted");

  assert.equal(fromDebug.mode, PUBLIC_DISPLAY_MODES.MIXED_PLACEHOLDER);
  assert.equal(fromDebug.source, "debug_override");

  assert.equal(forcedHolding.mode, PUBLIC_DISPLAY_MODES.UNDER_CONSTRUCTION);
  assert.equal(forcedHolding.source, "forced");
});

test("display mode storage migration and repository hooks are present", () => {
  const migrationSource = readFileSync(
    new URL("../db/migrations/005_public_display_mode_control.sql", import.meta.url),
    "utf8"
  ).replace(/\r\n/g, "\n");
  const storeSource = readFileSync(
    new URL("../lib/public-launch/display-mode-store.js", import.meta.url),
    "utf8"
  ).replace(/\r\n/g, "\n");

  assert.match(migrationSource, /site_display_mode_state/);
  assert.match(migrationSource, /site_display_mode_audit/);
  assert.match(migrationSource, /published_only/);
  assert.match(storeSource, /getDisplayModeState/);
  assert.match(storeSource, /setDisplayModeState/);
  assert.match(storeSource, /listDisplayModeAuditTrail/);
});
