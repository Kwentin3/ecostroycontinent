import test from "node:test";
import assert from "node:assert/strict";

import { buildSafeRemovalPlan } from "../../lib/admin/safe-removal-plan.js";
import { ENTITY_TYPES } from "../../lib/content-core/content-types.js";

function makeDeleteEvaluation({
  entityType,
  entityId,
  allowed = false,
  reasons = [],
  publishedIncomingRefs = [],
  draftIncomingRefs = [],
  stateBlockers = [],
  rootOverrides = {}
}) {
  return {
    exists: true,
    allowed,
    reasons,
    publishedIncomingRefs,
    draftIncomingRefs,
    stateBlockers,
    root: {
      entityId,
      entityType,
      label: `${entityType}:${entityId}`,
      published: false,
      hasReviewRevision: false,
      isTestData: false,
      openObligationsCount: 0,
      ...rootOverrides
    }
  };
}

function makeInput(entityType, entityId) {
  return {
    entityType,
    entityId,
    currentHref: `/admin/entities/${entityType}/${entityId}/delete`,
    redirectTo: `/admin/entities/${entityType}`,
    failureRedirectTo: `/admin/entities/${entityType}/${entityId}/delete`
  };
}

test("safe removal planner exposes direct delete when the object is already clear", async () => {
  const plan = await buildSafeRemovalPlan(
    makeInput(ENTITY_TYPES.MEDIA_ASSET, "media_1"),
    {
      assessEntityDelete: async () => makeDeleteEvaluation({
        entityType: ENTITY_TYPES.MEDIA_ASSET,
        entityId: "media_1",
        allowed: true
      })
    }
  );

  assert.equal(plan.mode, "delete_ready");
  assert.equal(plan.primaryAction.type, "form");
  assert.equal(plan.primaryAction.action, "/api/admin/entities/media_asset/delete");
  assert.equal(plan.steps.at(-1).status, "current");
});

test("safe removal planner pivots to live deactivation before delete", async () => {
  const plan = await buildSafeRemovalPlan(
    makeInput(ENTITY_TYPES.SERVICE, "service_1"),
    {
      assessEntityDelete: async () => makeDeleteEvaluation({
        entityType: ENTITY_TYPES.SERVICE,
        entityId: "service_1",
        reasons: ["У объекта есть действующая опубликованная версия."],
        stateBlockers: [
          {
            kind: "published_truth",
            label: "Собственная опубликованная версия",
            reason: "У объекта есть действующая опубликованная версия."
          }
        ],
        rootOverrides: {
          published: true
        }
      }),
      evaluateLiveDeactivation: async () => ({
        allowed: true,
        blockers: [],
        warnings: [],
        publishedIncomingRefs: [],
        draftIncomingRefs: [],
        reviewResidue: [],
        openObligations: [],
        routeEffects: {
          routePath: "/services/service-1",
          routeOutcome: "Маршрут перестанет быть доступным.",
          listImpact: "Карточка исчезнет из листинга.",
          sitemapImpact: "Адрес будет исключён из sitemap.",
          revalidationPaths: ["/services", "/services/service-1"]
        }
      }),
      evaluateLegacyTestFixtureNormalization: async () => ({
        allowed: false,
        blockers: ["Не применяется."],
        warnings: [],
        publishedIncomingRefs: [],
        draftIncomingRefs: [],
        relatedTargets: [],
        root: null
      })
    }
  );

  assert.equal(plan.mode, "live_deactivation_ready");
  assert.equal(plan.primaryAction.type, "form");
  assert.equal(plan.primaryAction.action, "/api/admin/entities/service/service_1/live-deactivation");
  assert.equal(plan.steps[3].status, "current");
  assert.equal(plan.steps[4].status, "waiting");
});

test("safe removal planner leads operator to the upstream published ref first", async () => {
  const plan = await buildSafeRemovalPlan(
    makeInput(ENTITY_TYPES.CASE, "case_1"),
    {
      assessEntityDelete: async () => makeDeleteEvaluation({
        entityType: ENTITY_TYPES.CASE,
        entityId: "case_1",
        reasons: ["На объект ссылается опубликованная услуга."],
        publishedIncomingRefs: [
          {
            entityType: ENTITY_TYPES.SERVICE,
            entityId: "service_live_1",
            label: "Proof Service",
            href: "/admin/entities/service/service_live_1",
            reason: "На объект ссылается опубликованная услуга.",
            state: "published"
          }
        ]
      }),
      evaluateLegacyTestFixtureNormalization: async () => ({
        allowed: false,
        blockers: ["Не применяется."],
        warnings: [],
        publishedIncomingRefs: [],
        draftIncomingRefs: [],
        relatedTargets: [],
        root: null
      })
    }
  );

  assert.equal(plan.mode, "blocked_by_published_refs");
  assert.equal(plan.primaryAction.type, "link");
  assert.match(plan.primaryAction.href, /\/admin\/entities\/service\/service_live_1\?returnTo=/);
  assert.equal(plan.steps[0].status, "current");
});

test("safe removal planner keeps test graph teardown as the primary path for test data", async () => {
  const plan = await buildSafeRemovalPlan(
    makeInput(ENTITY_TYPES.CASE, "case_test_1"),
    {
      assessEntityDelete: async () => makeDeleteEvaluation({
        entityType: ENTITY_TYPES.CASE,
        entityId: "case_test_1",
        reasons: ["У объекта есть действующая опубликованная версия."],
        rootOverrides: {
          isTestData: true,
          published: true
        }
      }),
      evaluateLiveDeactivation: async () => ({
        allowed: false,
        blockers: ["Тестовый опубликованный объект нужно убирать через удаление тестового графа."],
        warnings: [],
        publishedIncomingRefs: [],
        draftIncomingRefs: [],
        reviewResidue: [],
        openObligations: [],
        routeEffects: null
      }),
      evaluateTestGraphTeardown: async () => ({
        allowed: true,
        blockers: [],
        blockingRefs: [],
        survivingRefs: [],
        members: [
          {
            entityType: ENTITY_TYPES.CASE,
            entityId: "case_test_1",
            label: "Test case",
            href: "/admin/entities/case/case_test_1"
          }
        ],
        deletePlan: [{ entityType: ENTITY_TYPES.CASE, entityId: "case_test_1" }]
      })
    }
  );

  assert.equal(plan.mode, "test_graph_ready");
  assert.equal(plan.primaryAction.type, "form");
  assert.equal(plan.primaryAction.action, "/api/admin/entities/case/case_test_1/test-graph-teardown");
  assert.equal(plan.steps[2].status, "current");
});

test("safe removal planner exposes legacy fixture normalization as a secondary path", async () => {
  const plan = await buildSafeRemovalPlan(
    makeInput(ENTITY_TYPES.SERVICE, "service_legacy_1"),
    {
      assessEntityDelete: async () => makeDeleteEvaluation({
        entityType: ENTITY_TYPES.SERVICE,
        entityId: "service_legacy_1",
        allowed: true
      }),
      evaluateLegacyTestFixtureNormalization: async () => ({
        allowed: true,
        blockers: [],
        warnings: [],
        publishedIncomingRefs: [],
        draftIncomingRefs: [],
        relatedTargets: [],
        root: {
          entityType: ENTITY_TYPES.SERVICE,
          entityId: "service_legacy_1",
          label: "Legacy service"
        }
      })
    }
  );

  assert.equal(plan.mode, "delete_ready");
  assert.ok(plan.secondaryAction);
  assert.equal(plan.secondaryAction.action, "/api/admin/entities/service/service_legacy_1/normalize-test-fixture");
});
