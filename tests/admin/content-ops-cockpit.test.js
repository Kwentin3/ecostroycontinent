import test from "node:test";
import assert from "node:assert/strict";

import { ENTITY_TYPES } from "../../lib/content-core/content-types.js";
import {
  buildContentOpsCockpitProjection,
  buildEvidenceProjection,
  buildListBadgeProjection
} from "../../lib/admin/content-ops-cockpit.js";

test("evidence projection keeps readiness gaps visible and classified", () => {
  const projection = buildEvidenceProjection({
    entityType: ENTITY_TYPES.SERVICE,
    entityId: "service-1",
    readiness: {
      summary: "Есть блокирующие замечания.",
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
        },
        {
          severity: "blocking",
          code: "invalid_case_refs",
          message: "One case reference is broken.",
          field: "relatedCaseIds"
        }
      ]
    },
    obligations: [
      {
        obligationType: "redirect_required",
        status: "open",
        payload: {
          reason: "Route changed and redirect is still open."
        }
      }
    ]
  });

  const categories = projection.items.map((item) => item.category).sort();

  assert.equal(projection.state, "blocked");
  assert.equal(projection.items.length, 4);
  assert.deepEqual(categories, [
    "invalid refs",
    "missing proof",
    "publish obligations",
    "publish obligations"
  ]);
  assert.equal(
    projection.items.find((item) => item.field === "title")?.anchor.anchorId,
    "service-seo-truth"
  );
  assert.equal(
    projection.items.find((item) => item.category === "missing proof")?.anchor.isFallback,
    true
  );
  assert.equal(projection.counts.category["publish obligations"], 2);
});

test("evidence projection makes missing readiness projection explicit", () => {
  const projection = buildEvidenceProjection({
    entityType: ENTITY_TYPES.PAGE,
    entityId: "page-1"
  });

  assert.equal(projection.state, "missing");
  assert.equal(projection.items.length, 1);
  assert.equal(projection.items[0].reason, "Readiness projection is unavailable.");
  assert.equal(projection.items[0].anchor.isFallback, true);
  assert.equal(projection.items[0].category, "unknown");
});

test("list badge projection distinguishes ready, blocked, proof gap and partial states", () => {
  const readyReadiness = {
    summary: "Готово.",
    hasBlocking: false,
    results: []
  };
  const blockedReadiness = {
    summary: "Есть блокирующие замечания.",
    hasBlocking: true,
    results: [
      {
        severity: "blocking",
        code: "missing_service_minimum",
        message: "Service needs title and H1.",
        field: "title"
      }
    ]
  };
  const readyEvidence = buildEvidenceProjection({
    entityType: ENTITY_TYPES.MEDIA_ASSET,
    entityId: "media-1",
    readiness: readyReadiness
  });

  const blockedEvidence = buildEvidenceProjection({
    entityType: ENTITY_TYPES.SERVICE,
    entityId: "service-1",
    readiness: blockedReadiness
  });

  const proofGapEvidence = buildEvidenceProjection({
    entityType: ENTITY_TYPES.CASE,
    entityId: "case-1",
    readiness: {
      summary: "Есть предупреждения.",
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
  });

  const readyBadge = buildListBadgeProjection({
    readiness: readyReadiness,
    evidenceProjection: readyEvidence
  });
  const blockedBadge = buildListBadgeProjection({
    readiness: blockedReadiness,
    evidenceProjection: blockedEvidence
  });
  const proofGapBadge = buildListBadgeProjection({
    readiness: {
      summary: "Есть предупреждения.",
      hasBlocking: false,
      results: [
        {
          severity: "warning",
          code: "missing_proof_path",
          message: "Proof is still missing.",
          field: null
        }
      ]
    },
    evidenceProjection: proofGapEvidence
  });
  const partialBadge = buildListBadgeProjection({
    readiness: null,
    evidenceProjection: null
  });

  assert.equal(readyBadge.state, "ready");
  assert.equal(blockedBadge.state, "blocked");
  assert.equal(proofGapBadge.state, "proof_gap");
  assert.equal(partialBadge.state, "partial");
  assert.equal(blockedBadge.reason, "Service needs title and H1.");
});

test("cockpit projection keeps first-slice coverage visible and truthful", () => {
  const cockpit = buildContentOpsCockpitProjection({
    entities: [
      {
        entityType: ENTITY_TYPES.GLOBAL_SETTINGS,
        entityId: "settings-1",
        label: "Global settings",
        readiness: {
          summary: "Готово.",
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
          summary: "Есть блокирующие замечания.",
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
          summary: "Есть предупреждения.",
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
      },
      {
        entityType: ENTITY_TYPES.PAGE,
        entityId: "page-1",
        label: "About",
        readiness: null
      },
      {
        entityType: ENTITY_TYPES.MEDIA_ASSET,
        entityId: "media-1",
        label: "Facade photo",
        readiness: {
          summary: "Готово.",
          hasBlocking: false,
          results: []
        }
      }
    ]
  });

  const coverageTypes = cockpit.coverage.map((group) => group.entityType);
  const serviceGroup = cockpit.coverage.find((group) => group.entityType === ENTITY_TYPES.SERVICE);
  const caseGroup = cockpit.coverage.find((group) => group.entityType === ENTITY_TYPES.CASE);
  const pageGroup = cockpit.coverage.find((group) => group.entityType === ENTITY_TYPES.PAGE);
  const galleryGroup = cockpit.coverage.find((group) => group.entityType === ENTITY_TYPES.GALLERY);
  const serviceRow = cockpit.rows.find((row) => row.entityType === ENTITY_TYPES.SERVICE);
  const caseRow = cockpit.rows.find((row) => row.entityType === ENTITY_TYPES.CASE);

  assert.deepEqual(coverageTypes, [
    ENTITY_TYPES.GLOBAL_SETTINGS,
    ENTITY_TYPES.SERVICE,
    ENTITY_TYPES.CASE,
    ENTITY_TYPES.PAGE,
    ENTITY_TYPES.MEDIA_ASSET,
    ENTITY_TYPES.GALLERY
  ]);
  assert.deepEqual(cockpit.summary, {
    ready: 2,
    blocked: 1,
    needsProof: 1,
    partial: 1,
    missing: 1,
    total: 6
  });
  assert.equal(serviceGroup.status, "blocked");
  assert.equal(caseGroup.status, "needs_proof");
  assert.equal(pageGroup.status, "partial");
  assert.equal(galleryGroup.status, "missing");
  assert.equal(serviceRow.primaryActionAnchor.anchorId, "service-seo-truth");
  assert.equal(serviceRow.primaryActionAnchor.isFallback, false);
  assert.equal(caseRow.primaryActionAnchor.isFallback, true);
  assert.equal(cockpit.unsupportedRows.length, 0);
});
