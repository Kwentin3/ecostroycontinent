import test from "node:test";
import assert from "node:assert/strict";

import { ENTITY_TYPES } from "../../lib/content-core/content-types.js";
import {
  buildListRowProjection,
  buildListSurfaceViewModel
} from "../../lib/admin/list-visibility.js";

function buildCard(entityType, entityId, revisionNumber = 1, state = "draft", payload = {}, updatedAt = "2026-03-29T10:00:00Z") {
  return {
    entity: {
      id: entityId,
      entityType,
      creationOrigin: null,
      updatedAt
    },
    latestRevision: {
      revisionNumber,
      state,
      payload,
      updatedAt
    }
  };
}

test("list row projections surface blocked, proof gap, partial and missing states honestly", () => {
  const blockedRow = buildListRowProjection({
    card: buildCard(
      ENTITY_TYPES.SERVICE,
      "service-1",
      3,
      "draft",
      {
        title: "Drainage",
        h1: "Drainage",
        summary: "Короткое описание",
        serviceScope: "Scope",
        ctaVariant: "call",
        relatedCaseIds: []
      }
    ),
    entityType: ENTITY_TYPES.SERVICE,
    readiness: {
      summary: "Есть блокеры.",
      hasBlocking: true,
      results: [
        {
          severity: "blocking",
          code: "missing_service_minimum",
          message: "Service needs title and H1.",
          field: "title"
        }
      ]
    },
    obligations: [],
    listHref: "/admin/entities/service"
  });

  const proofGapRow = buildListRowProjection({
    card: buildCard(
      ENTITY_TYPES.CASE,
      "case-1",
      2,
      "draft",
      {
        title: "Дом в Сочи",
        location: "Сочи",
        task: "Ремонт",
        workScope: "Полный",
        result: "Готово"
      }
    ),
    entityType: ENTITY_TYPES.CASE,
    readiness: {
      summary: "Есть замечания.",
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
    obligations: [],
    listHref: "/admin/entities/case"
  });

  const partialRow = buildListRowProjection({
    card: buildCard(
      ENTITY_TYPES.PAGE,
      "page-1",
      1,
      "draft",
      {
        title: "О нас",
        h1: "О нас",
        blocks: [{ type: "rich_text", body: "Текст" }]
      }
    ),
    entityType: ENTITY_TYPES.PAGE,
    readiness: null,
    obligations: [],
    listHref: "/admin/entities/page"
  });

  const missingRow = buildListRowProjection({
    card: {
      entity: {
        id: "page-2",
        entityType: ENTITY_TYPES.PAGE,
        updatedAt: "2026-03-29T10:00:00Z"
      },
      latestRevision: null
    },
    entityType: ENTITY_TYPES.PAGE,
    listHref: "/admin/entities/page"
  });

  assert.equal(blockedRow.signalState, "blocked");
  assert.equal(blockedRow.isTestData, false);
  assert.equal(blockedRow.signalLabel, "Заблокировано");
  assert.equal(blockedRow.actionLabel, "Исправить");
  assert.equal(blockedRow.actionHref, "/admin/entities/service/service-1?returnTo=%2Fadmin%2Fentities%2Fservice");

  assert.equal(proofGapRow.signalState, "proof_gap");
  assert.equal(proofGapRow.signalLabel, "Нужны доказательства");
  assert.equal(proofGapRow.actionLabel, "Добавить доказательства");

  assert.equal(partialRow.signalState, "partial");
  assert.equal(partialRow.signalLabel, "Частично");
  assert.equal(partialRow.signalReason, "Проверка готовности ещё не считана.");

  assert.equal(missingRow.signalState, "missing");
  assert.equal(missingRow.versionLabel, "Версий пока нет");
  assert.equal(missingRow.actionLabel, "Открыть");
});

test("list surface view model prioritizes blockers and keeps row summaries compact", () => {
  const viewModel = buildListSurfaceViewModel([
    buildListRowProjection({
      card: buildCard(
        ENTITY_TYPES.MEDIA_ASSET,
        "media-1",
        4,
        "draft",
        {
          title: "Facade photo",
          storageKey: "assets/facade.jpg",
          alt: "Фасад",
          ownershipNote: "Source note"
        }
      ),
      entityType: ENTITY_TYPES.MEDIA_ASSET,
      readiness: {
        summary: "Готово.",
        hasBlocking: false,
        results: []
      },
      obligations: [],
      listHref: "/admin/entities/media_asset"
    }),
    buildListRowProjection({
      card: buildCard(
        ENTITY_TYPES.SERVICE,
        "service-2",
        2,
        "draft",
        {
          title: "Facade cleaning",
          h1: "Facade cleaning",
          summary: "Service summary",
          serviceScope: "Scope",
          ctaVariant: "call",
          relatedCaseIds: []
        }
      ),
      entityType: ENTITY_TYPES.SERVICE,
      readiness: {
        summary: "Есть блокеры.",
        hasBlocking: true,
        results: [
          {
            severity: "blocking",
            code: "missing_service_minimum",
            message: "Service needs title and H1.",
            field: "title"
          }
        ]
      },
      obligations: [],
      listHref: "/admin/entities/service"
    }),
    buildListRowProjection({
      card: buildCard(
        ENTITY_TYPES.CASE,
        "case-2",
        2,
        "draft",
        {
          title: "Case two",
          location: "Москва",
          task: "Ремонт",
          workScope: "Partial",
          result: "Prepared"
        }
      ),
      entityType: ENTITY_TYPES.CASE,
      readiness: {
        summary: "Есть замечания.",
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
      obligations: [],
      listHref: "/admin/entities/case"
    }),
    buildListRowProjection({
      card: {
        entity: {
          id: "page-inactive",
          entityType: ENTITY_TYPES.PAGE,
          creationOrigin: null,
          activePublishedRevisionId: null,
          updatedAt: "2026-03-30T10:00:00Z"
        },
        latestRevision: {
          revisionNumber: 5,
          state: "published",
          payload: {
            title: "Contacts",
            h1: "Contacts",
            pageType: "contacts",
            blocks: [{ type: "rich_text", body: "Contacts body" }]
          },
          updatedAt: "2026-03-30T10:00:00Z"
        }
      },
      entityType: ENTITY_TYPES.PAGE,
      readiness: {
        summary: "Готово.",
        hasBlocking: false,
        results: []
      },
      obligations: [],
      listHref: "/admin/entities/page"
    })
  ]);

  assert.equal(viewModel.summary.total, 4);
  assert.equal(viewModel.summary.blocked, 1);
  assert.equal(viewModel.summary.proof_gap, 1);
  assert.equal(viewModel.summary.ready, 1);
  assert.equal(viewModel.summary.inactive, 1);
  assert.deepEqual(viewModel.rows.map((row) => row.signalState), [
    "blocked",
    "proof_gap",
    "inactive",
    "ready"
  ]);
  assert.deepEqual(viewModel.bullets, [
    "Всего записей: 4",
    "Заблокировано: 1",
    "Нужны доказательства: 1",
    "Частично: 0",
    "Готово: 1",
    "Нет версии: 0",
    "Снято с публикации: 1"
  ]);
  assert.match(viewModel.summaryNote, /блокирующие строки и строки с доказательствами/);
});

test("list row projection marks agent-created test rows", () => {
  const row = buildListRowProjection({
    card: {
      ...buildCard(
        ENTITY_TYPES.SERVICE,
        "service-test",
        1,
        "draft",
        {
          title: "Test service",
          h1: "Test service",
          summary: "Summary",
          serviceScope: "Scope",
          ctaVariant: "call"
        }
      ),
      entity: {
        id: "service-test",
        entityType: ENTITY_TYPES.SERVICE,
        creationOrigin: "agent_test",
        updatedAt: "2026-03-29T10:00:00Z"
      }
    },
    entityType: ENTITY_TYPES.SERVICE,
    readiness: {
      summary: "Готово.",
      hasBlocking: false,
      results: []
    },
    obligations: [],
    listHref: "/admin/entities/service?testOnly=1"
  });

  assert.equal(row.isTestData, true);
});
