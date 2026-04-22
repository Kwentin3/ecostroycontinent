import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  formatPreviewViewportWidth,
  getPreviewViewportOption
} from "../../lib/admin/preview-viewport.js";
import { buildEntityAggregates } from "../../lib/internal/test-data-cleanup.js";

test("preview viewport exposes tablet semantics as explicit operator affordance", () => {
  const tablet = getPreviewViewportOption("tablet");

  assert.equal(tablet.value, "tablet");
  assert.equal(tablet.width, 834);
  assert.equal(tablet.deviceShellClassName, "previewViewportDeviceTablet");
  assert.equal(formatPreviewViewportWidth(tablet.width), "834 пикс.");
  assert.match(tablet.hint, /перенос|CTA|секц/i);
});

test("preview viewport falls back to desktop for unknown device", () => {
  const fallback = getPreviewViewportOption("wallboard");

  assert.equal(fallback.value, "desktop");
  assert.equal(fallback.width, 1120);
});

test("standalone page keeps theme styling on the outer preview shell", () => {
  const source = readFileSync(new URL("../../components/public/PublicRenderers.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");

  assert.match(source, /<PublicPageShell[\s\S]*globalSettings=\{globalSettings\}[\s\S]*themeClassName=\{pageThemeClassName\}[\s\S]*currentPath=\{currentPath\}/);
});

test("page workspace preview modal uses a single control center and renders viewport as a clean canvas", () => {
  const source = readFileSync(new URL("../../components/admin/PageWorkspaceScreen.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const previewViewportSource = readFileSync(new URL("../../components/admin/PreviewViewport.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const css = readFileSync(new URL("../../components/admin/admin-ui.module.css", import.meta.url), "utf8").replace(/\r\n/g, "\n");

  assert.match(source, /showToolbar=\{false\}/);
  assert.match(source, /showFrameTop=\{false\}/);
  assert.match(source, /fullPage/);
  assert.match(source, /previewModalControlRow/);
  assert.match(source, /adminStyles\.previewViewportControls/);
  assert.match(previewViewportSource, /fullPage = false/);
  assert.match(previewViewportSource, /styles\.previewViewportFullPage/);
  assert.match(previewViewportSource, /data-preview-device=\{activeOption\.value\}/);
  assert.match(css, /\.previewViewportFullPage \.previewViewportDeviceDesktop \.previewViewportDeviceViewport[\s\S]*aspect-ratio:\s*auto;/);
});

test("entity registry page keeps SurfacePacket imported for non-page entity lists", () => {
  const source = readFileSync(new URL("../../app/admin/(console)/entities/[entityType]/page.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");

  assert.match(source, /import\s+\{\s*SurfacePacket\s*\}\s+from\s+["']\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/components\/admin\/SurfacePacket["']/);
  assert.match(source, /<SurfacePacket/);
});

test("equipment registry rows render compact media previews", () => {
  const source = readFileSync(new URL("../../app/admin/(console)/entities/[entityType]/page.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const listVisibility = readFileSync(new URL("../../lib/admin/list-visibility.js", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const css = readFileSync(new URL("../../components/admin/admin-ui.module.css", import.meta.url), "utf8").replace(/\r\n/g, "\n");

  assert.match(source, /normalizedType === ENTITY_TYPES\.EQUIPMENT/);
  assert.match(source, /row\.previewMediaUrl \?/);
  assert.match(source, /styles\.entityListThumb/);
  assert.match(listVisibility, /previewMediaUrl/);
  assert.match(listVisibility, /\/api\/admin\/media\/\$\{mediaId\}\/preview/);
  assert.match(css, /\.entityListCell\s*\{/);
  assert.match(css, /\.entityListThumb\s*,\s*\.entityListThumbFallback\s*\{/);
});

test("cleanup aggregate builder preserves entities without revisions for exact-id cleanup", () => {
  const aggregates = buildEntityAggregates([
    {
      entity_id: "entity_page_empty",
      entity_type: "page",
      active_published_revision_id: null,
      entity_created_at: "2026-04-11T00:00:00.000Z",
      entity_updated_at: "2026-04-11T00:00:00.000Z",
      revision_id: null,
      revision_number: null,
      state: null,
      payload: null,
      change_intent: null,
      review_comment: null,
      revision_created_at: null,
      revision_updated_at: null
    }
  ]);

  assert.equal(aggregates.length, 1);
  assert.equal(aggregates[0].entity.id, "entity_page_empty");
  assert.deepEqual(aggregates[0].revisions, []);
});

test("cleanup aggregate builder still orders existing revisions without duplicating the entity", () => {
  const aggregates = buildEntityAggregates([
    {
      entity_id: "entity_page_real",
      entity_type: "page",
      active_published_revision_id: "rev_2",
      entity_created_at: "2026-04-11T00:00:00.000Z",
      entity_updated_at: "2026-04-11T00:00:00.000Z",
      revision_id: "rev_2",
      revision_number: 2,
      state: "published",
      payload: { title: "Current" },
      change_intent: "Publish current",
      review_comment: "",
      revision_created_at: "2026-04-11T00:00:00.000Z",
      revision_updated_at: "2026-04-11T00:00:00.000Z"
    },
    {
      entity_id: "entity_page_real",
      entity_type: "page",
      active_published_revision_id: "rev_2",
      entity_created_at: "2026-04-11T00:00:00.000Z",
      entity_updated_at: "2026-04-11T00:00:00.000Z",
      revision_id: "rev_1",
      revision_number: 1,
      state: "draft",
      payload: { title: "Draft" },
      change_intent: "Draft",
      review_comment: "",
      revision_created_at: "2026-04-10T00:00:00.000Z",
      revision_updated_at: "2026-04-10T00:00:00.000Z"
    }
  ]);

  assert.equal(aggregates.length, 1);
  assert.equal(aggregates[0].revisions.length, 2);
  assert.equal(aggregates[0].revisions[0].id, "rev_2");
  assert.equal(aggregates[0].revisions[1].id, "rev_1");
});

