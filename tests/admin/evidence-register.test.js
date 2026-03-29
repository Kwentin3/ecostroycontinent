import test from "node:test";
import assert from "node:assert/strict";

import { ENTITY_TYPES } from "../../lib/content-core/content-types.js";
import { buildContentOpsCockpitProjection } from "../../lib/admin/content-ops-cockpit.js";
import { buildEvidenceRegisterViewModel } from "../../lib/admin/evidence-register-view.js";

test("cockpit evidence register flattens proof gaps into actionable rows", () => {
  const cockpit = buildContentOpsCockpitProjection({
    entities: [
      {
        entityType: ENTITY_TYPES.GLOBAL_SETTINGS,
        entityId: "settings-1",
        label: "Global settings",
        readiness: {
          summary: "Ready.",
          hasBlocking: false,
          results: []
        },
        hasPublishedRevision: true
      },
      {
        entityType: ENTITY_TYPES.SERVICE,
        entityId: "service-1",
        label: "Drainage",
        readiness: {
          summary: "There are blockers.",
          hasBlocking: true,
          results: [
            {
              severity: "blocking",
              code: "missing_service_minimum",
              message: "Service needs title and H1.",
              field: "title"
            },
            {
              severity: "blocking",
              code: "missing_proof_path",
              message: "A proof path is required.",
              field: null
            }
          ]
        },
        hasDraftRevision: true
      },
      {
        entityType: ENTITY_TYPES.CASE,
        entityId: "case-1",
        label: "Case one",
        readiness: {
          summary: "There are warnings.",
          hasBlocking: false,
          results: [
            {
              severity: "warning",
              code: "missing_proof_path",
              message: "Proof is still missing.",
              field: null
            }
          ]
        }
      }
    ]
  });

  const model = buildEvidenceRegisterViewModel({ cockpit });
  const exactRow = model.rows.find((row) => row.entityType === ENTITY_TYPES.SERVICE && row.field === "title");
  const fallbackRow = model.rows.find((row) => row.entityType === ENTITY_TYPES.SERVICE && row.field === null);

  assert.equal(model.scope, "cockpit");
  assert.equal(model.state.key, "blocked");
  assert.equal(model.state.note, "Ниже видны блокирующие точки с доказательствами.");
  assert.equal(model.rows.length > 0, true);
  assert.equal(exactRow.target.href, "/admin/entities/service/service-1#service-seo-truth");
  assert.equal(exactRow.target.isFallback, false);
  assert.equal(fallbackRow.target.href, "/admin/entities/service/service-1#service-fallback");
  assert.equal(fallbackRow.target.isFallback, true);
  assert.equal(fallbackRow.target.label, "Открыть резервный раздел");
  assert.equal(fallbackRow.category, "missing proof");
});

test("ready cockpit evidence register renders an explicit no-gaps state", () => {
  const cockpit = buildContentOpsCockpitProjection({
    entities: [
      {
        entityType: ENTITY_TYPES.GLOBAL_SETTINGS,
        entityId: "settings-1",
        label: "Global settings",
        readiness: {
          summary: "Ready.",
          hasBlocking: false,
          results: []
        }
      },
      {
        entityType: ENTITY_TYPES.MEDIA_ASSET,
        entityId: "media-1",
        label: "Facade photo",
        readiness: {
          summary: "Ready.",
          hasBlocking: false,
          results: []
        }
      }
    ]
  });

  const model = buildEvidenceRegisterViewModel({ cockpit });

  assert.equal(model.state.key, "ready");
  assert.equal(model.rows.length, 0);
  assert.equal(model.state.note, "Пробелов в доказательствах не видно.");
});

test("editor evidence register keeps missing projection explicit and labelled", () => {
  const model = buildEvidenceRegisterViewModel({
    entityType: ENTITY_TYPES.PAGE,
    entityId: "page-1",
    entityLabel: "About"
  });

  assert.equal(model.scope, "editor");
  assert.equal(model.state.key, "missing");
  assert.equal(model.state.note, "Доказательства ещё не собраны полностью.");
  assert.equal(model.rows.length, 1);
  assert.equal(model.rows[0].reason, "Проекция готовности недоступна.");
  assert.equal(model.rows[0].category, "unknown");
  assert.equal(model.rows[0].target.href, "#page-fallback");
  assert.equal(model.rows[0].target.isFallback, true);
});
