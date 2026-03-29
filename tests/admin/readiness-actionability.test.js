import test from "node:test";
import assert from "node:assert/strict";

import { ENTITY_TYPES } from "../../lib/content-core/content-types.js";
import {
  buildEditorActionabilityModel,
  buildReadinessNavigationModel
} from "../../lib/admin/readiness-actionability.js";

test("editor readiness navigation keeps exact anchors and fallback explicit", () => {
  const model = buildReadinessNavigationModel({
    entityType: ENTITY_TYPES.SERVICE,
    readiness: {
      summary: "Есть blockers.",
      results: [
        {
          severity: "blocking",
          code: "missing_service_minimum",
          message: "Service needs title and H1.",
          field: "title"
        },
        {
          severity: "warning",
          code: "missing_proof_path",
          message: "Proof is still missing.",
          field: null
        }
      ]
    },
    context: "editor"
  });

  assert.equal(model.state.key, "blocked");
  assert.equal(model.items[0].target.href, "#service-seo-truth");
  assert.equal(model.items[0].target.isFallback, false);
  assert.equal(model.items[1].target.href, "#service-fallback");
  assert.equal(model.items[1].target.isFallback, true);
  assert.equal(model.items[1].target.targetLabel, "Общий раздел исправления");
});

test("preview readiness navigation uses preview targets and labelled fallback", () => {
  const model = buildReadinessNavigationModel({
    entityType: ENTITY_TYPES.PAGE,
    readiness: {
      summary: "Есть blockers.",
      results: [
        {
          severity: "blocking",
          code: "missing_page_basics",
          message: "Page needs blocks.",
          field: "blocks"
        },
        {
          severity: "warning",
          code: "unknown_field_warning",
          message: "Unknown field warning.",
          field: "unknown_field"
        }
      ]
    },
    context: "preview",
    fallbackAnchorId: "review-readiness",
    fallbackLabel: "Блок готовности"
  });

  assert.equal(model.items[0].target.href, "#preview-page-blocks");
  assert.equal(model.items[0].target.isFallback, false);
  assert.equal(model.items[1].target.href, "#review-readiness");
  assert.equal(model.items[1].target.isFallback, true);
  assert.equal(model.items[1].target.targetLabel, "Блок готовности");
});

test("editor actionability falls back to the first truth anchor when readiness is missing", () => {
  const model = buildEditorActionabilityModel({
    entityType: ENTITY_TYPES.GLOBAL_SETTINGS,
    readiness: null
  });

  assert.equal(model.state.key, "missing");
  assert.equal(model.primaryAction.href, "#global-settings-brand-truth");
  assert.equal(model.primaryAction.isFallback, false);
  assert.equal(model.primaryAction.label, "Начать с Публичное название");
});

