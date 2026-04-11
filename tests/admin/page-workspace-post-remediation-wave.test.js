import test from "node:test";
import assert from "node:assert/strict";

import {
  formatPreviewViewportWidth,
  getPreviewViewportOption
} from "../../lib/admin/preview-viewport.js";
import { buildEntityAggregates } from "../../lib/internal/test-data-cleanup.js";

test("preview viewport exposes tablet semantics as explicit operator affordance", () => {
  const tablet = getPreviewViewportOption("tablet");

  assert.equal(tablet.value, "tablet");
  assert.equal(tablet.width, 834);
  assert.equal(formatPreviewViewportWidth(tablet.width), "834 px");
  assert.match(tablet.hint, /РїРµСЂРµРЅРѕСЃ|CTA|СЃРµРєС†Рё/i);
});

test("preview viewport falls back to desktop for unknown device", () => {
  const fallback = getPreviewViewportOption("wallboard");

  assert.equal(fallback.value, "desktop");
  assert.equal(fallback.width, 1120);
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
