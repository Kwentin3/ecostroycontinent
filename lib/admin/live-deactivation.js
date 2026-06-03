import { withTransaction } from "../db/client.js";
import { recordDestructiveEvent } from "../content-ops/destructive-forensics.js";
import { AUDIT_EVENT_KEYS } from "../content-core/content-types.js";
import { clearEntityActivePublishedRevision } from "../content-core/repository.js";
import {
  PUBLICATION_ACTIVE_REVISION_CHANGED_BLOCKER,
  PUBLICATION_ENTITY_TYPES,
  buildPublicationForensicDetails,
  collectPublicationImpact,
  dedupeStrings,
  isPublicationEntityTypeSupported
} from "./publication-impact.js";

export const LIVE_DEACTIVATION_ENTITY_TYPES = PUBLICATION_ENTITY_TYPES;

export function isLiveDeactivationEntityTypeSupported(entityType) {
  return isPublicationEntityTypeSupported(entityType);
}

export function getLiveDeactivationHref(entityType, entityId) {
  return `/admin/entities/${entityType}/${entityId}/live-deactivation`;
}

export async function evaluateLiveDeactivation(input, deps = {}) {
  const impact = await collectPublicationImpact(input, deps);

  if (!impact.supported || !impact.exists) {
    return {
      ...impact,
      allowed: false
    };
  }

  const blockers = [];

  if (impact.root?.isTestData) {
    blockers.push("Тестовый опубликованный объект нужно убирать через удаление тестового графа.");
  }

  if (!impact.root?.activePublishedRevisionId) {
    blockers.push("Сущность уже выведена из живого контура.");
  }

  blockers.push(...impact.reviewResidue.map((item) => item.reason));
  blockers.push(...impact.openObligations.map((item) => item.reason));

  if (!impact.routeEffects && impact.unsupportedRouteEffectReason) {
    blockers.push(impact.unsupportedRouteEffectReason);
  }

  blockers.push(...(impact.incomingBlockers ?? []));

  return {
    ...impact,
    allowed: blockers.length === 0,
    blockers: dedupeStrings(blockers),
    warnings: dedupeStrings(impact.warnings)
  };
}

export async function executeLiveDeactivation(input, deps = {}) {
  const resolvedDeps = {
    withTransaction,
    evaluateLiveDeactivation,
    clearEntityActivePublishedRevision,
    recordDestructiveEvent,
    ...deps
  };

  return resolvedDeps.withTransaction(async (db) => {
    const evaluation = await resolvedDeps.evaluateLiveDeactivation(input, { ...deps, db });
    const rootSnapshot = {
      entityId: evaluation.root?.entityId ?? input.entityId,
      entityType: evaluation.root?.entityType ?? input.entityType,
      label: evaluation.root?.label ?? input.entityId
    };

    if (!evaluation.allowed) {
      await resolvedDeps.recordDestructiveEvent({
        auditEventKey: AUDIT_EVENT_KEYS.LIVE_DEACTIVATION_BLOCKED,
        operationKind: "live_deactivation",
        outcome: "blocked",
        actorUserId: input.actorUserId ?? null,
        root: rootSnapshot,
        target: rootSnapshot,
        summary: "Снятие из живого контура отклонено правилами безопасности.",
        details: buildPublicationForensicDetails(evaluation)
      }, { db });

      return {
        executed: false,
        evaluation,
        revalidationPaths: []
      };
    }

    const clearedEntity = await resolvedDeps.clearEntityActivePublishedRevision(input.entityId, input.actorUserId, db, {
      expectedActivePublishedRevisionId: evaluation.root?.activePublishedRevisionId ?? null
    });

    if (!clearedEntity) {
      const blockedEvaluation = {
        ...evaluation,
        allowed: false,
        blockers: dedupeStrings([
          ...(evaluation.blockers ?? []),
          PUBLICATION_ACTIVE_REVISION_CHANGED_BLOCKER
        ])
      };

      await resolvedDeps.recordDestructiveEvent({
        auditEventKey: AUDIT_EVENT_KEYS.LIVE_DEACTIVATION_BLOCKED,
        operationKind: "live_deactivation",
        outcome: "blocked",
        actorUserId: input.actorUserId ?? null,
        revisionId: evaluation.root?.activePublishedRevisionId ?? null,
        root: rootSnapshot,
        target: rootSnapshot,
        summary: "Снятие из живого контура остановлено: live-версия изменилась во время операции.",
        details: buildPublicationForensicDetails(blockedEvaluation)
      }, { db });

      return {
        executed: false,
        evaluation: blockedEvaluation,
        revalidationPaths: []
      };
    }

    await resolvedDeps.recordDestructiveEvent({
      auditEventKey: AUDIT_EVENT_KEYS.LIVE_DEACTIVATED,
      operationKind: "live_deactivation",
      outcome: "executed",
      actorUserId: input.actorUserId ?? null,
      revisionId: evaluation.root?.activePublishedRevisionId ?? null,
      root: rootSnapshot,
      target: rootSnapshot,
      summary: "Сущность выведена из живого контура.",
      affectedEntities: [
        {
          entityId: input.entityId,
          entityType: input.entityType
        }
      ],
      details: {
        entityType: input.entityType,
        routePath: evaluation.routeEffects?.routePath ?? null,
        routeOutcome: evaluation.routeEffects?.routeOutcome ?? null,
        listImpact: evaluation.routeEffects?.listImpact ?? null,
        sitemapImpact: evaluation.routeEffects?.sitemapImpact ?? null,
        revalidationPaths: evaluation.routeEffects?.revalidationPaths ?? []
      }
    }, { db });

    return {
      executed: true,
      evaluation,
      revalidationPaths: evaluation.routeEffects?.revalidationPaths ?? []
    };
  });
}
