import test from "node:test";
import assert from "node:assert/strict";

import { ENTITY_TYPES } from "../../lib/content-core/content-types.js";
import { buildContentOpsCockpitProjection } from "../../lib/admin/content-ops-cockpit.js";
import {
  buildCockpitSurfaceViewModel,
  getLaunchCoreRouteTarget
} from "../../lib/admin/content-ops-cockpit-view.js";

function buildSampleCockpitProjection() {
  return buildContentOpsCockpitProjection({
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
}

test("cockpit view model keeps the next action operator-first and routes explicit fallbacks", () => {
  const cockpitProjection = buildSampleCockpitProjection();
  const viewModel = buildCockpitSurfaceViewModel(cockpitProjection);
  const galleryTile = viewModel.coverageTiles.find((tile) => tile.entityType === ENTITY_TYPES.GALLERY);

  assert.deepEqual(viewModel.stateEntries.map((entry) => entry.key), [
    "blocked",
    "missing",
    "needs_proof",
    "ready"
  ]);
  assert.equal(viewModel.primaryAction.entityType, ENTITY_TYPES.SERVICE);
  assert.equal(viewModel.primaryAction.actionLabel, "Исправить");
  assert.equal(viewModel.primaryAction.routeTarget.href, "/admin/entities/service/service-1");
  assert.equal(viewModel.primaryAction.routeTarget.isFallback, false);
  assert.equal(viewModel.nextActions[1].entityType, ENTITY_TYPES.CASE);
  assert.equal(viewModel.nextActions[1].status, "needs_proof");
  assert.equal(viewModel.nextActions[2].entityType, ENTITY_TYPES.PAGE);
  assert.equal(viewModel.nextActions[2].status, "partial");
  assert.match(viewModel.stateNote, /не считайте покрытие готовым/);
  assert.equal(galleryTile.status, "missing");
  assert.equal(galleryTile.routeTarget.href, "/admin/entities/gallery/new");
  assert.equal(galleryTile.routeTarget.isFallback, true);
  assert.equal(galleryTile.routeHint.includes("Резервный переход"), true);
});

test("cockpit route targets stay explicit for singleton and workspace fallbacks", () => {
  const globalSettingsTarget = getLaunchCoreRouteTarget(ENTITY_TYPES.GLOBAL_SETTINGS, null);
  const mediaTarget = getLaunchCoreRouteTarget(ENTITY_TYPES.MEDIA_ASSET, null);
  const galleryTarget = getLaunchCoreRouteTarget(ENTITY_TYPES.GALLERY, null);

  assert.deepEqual(globalSettingsTarget, {
    href: "/admin/entities/global_settings",
    label: "Настроить глобальные настройки",
    isFallback: true
  });
  assert.deepEqual(mediaTarget, {
    href: "/admin/entities/media_asset/new",
    label: "Загрузить медиафайл",
    isFallback: true
  });
  assert.deepEqual(galleryTarget, {
    href: "/admin/entities/gallery/new",
    label: "Создать коллекцию",
    isFallback: true
  });
});

test("empty cockpit view model still surfaces a concrete next step", () => {
  const viewModel = buildCockpitSurfaceViewModel({
    summary: {
      ready: 0,
      blocked: 0,
      needsProof: 0,
      partial: 0,
      missing: 6,
      total: 6
    },
    coverage: [
      {
        entityType: ENTITY_TYPES.GLOBAL_SETTINGS,
        label: "Глобальные настройки",
        status: "missing",
        total: 0,
        readyCount: 0,
        blockedCount: 0,
        needsProofCount: 0,
        partialCount: 0,
        missingRowCount: 0,
        isCoverageEmpty: true,
        reason: "Coverage has not been established yet.",
        rows: []
      }
    ],
    rows: []
  });

  assert.equal(viewModel.primaryAction.entityType, ENTITY_TYPES.GLOBAL_SETTINGS);
  assert.equal(viewModel.primaryAction.actionLabel, "Создать");
  assert.equal(viewModel.primaryAction.routeTarget.href, "/admin/entities/global_settings");
  assert.equal(viewModel.coverageTiles[0].isCoverageEmpty, true);
  assert.equal(viewModel.coverageTiles[0].routeTarget.isFallback, true);
  assert.match(viewModel.coverageNote, /не считается готовым/);
});
