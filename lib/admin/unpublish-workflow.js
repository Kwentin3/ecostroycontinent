import { withTransaction } from "../db/client.js";
import { recordDestructiveEvent } from "../content-ops/destructive-forensics.js";
import { AUDIT_EVENT_KEYS } from "../content-core/content-types.js";
import { clearEntityActivePublishedRevision } from "../content-core/repository.js";
import {
  PUBLICATION_ACTIVE_REVISION_CHANGED_BLOCKER,
  buildPublicationForensicDetails,
  collectPublicationImpact,
  dedupeStrings,
  isPublicationEntityTypeSupported
} from "./publication-impact.js";

export function isUnpublishEntityTypeSupported(entityType) {
  return isPublicationEntityTypeSupported(entityType);
}

export function getUnpublishHref(entityType, entityId) {
  return `/admin/entities/${entityType}/${entityId}/unpublish`;
}

function buildUnpublishWarnings(impact) {
  const warnings = [
    ...impact.warnings,
    ...(impact.publishedIncomingRefs ?? []).map((item) => item.reason),
    ...(impact.draftIncomingRefs ?? []).map((item) => item.reason),
    ...(impact.reviewResidue ?? []).map((item) => item.reason),
    ...(impact.openObligations ?? []).map((item) => item.reason)
  ];

  if (impact.root?.isTestData) {
    warnings.push("Объект помечен как тестовый. Снятие с публикации не удалит тестовый граф.");
  }

  return dedupeStrings(warnings);
}

export async function evaluateUnpublish(input, deps = {}) {
  const impact = await collectPublicationImpact(input, deps);
  const blockers = [];

  if (!impact.supported || !impact.exists) {
    return {
      ...impact,
      operation: "unpublish",
      allowed: false,
      blockers: impact.blockers ?? [],
      warnings: []
    };
  }

  if (!impact.root?.activePublishedRevisionId) {
    blockers.push("Сущность уже снята с публикации.");
  }

  if (!impact.routeEffects && impact.unsupportedRouteEffectReason) {
    blockers.push(impact.unsupportedRouteEffectReason);
  }

  return {
    ...impact,
    operation: "unpublish",
    allowed: blockers.length === 0,
    blockers: dedupeStrings(blockers),
    warnings: buildUnpublishWarnings(impact)
  };
}

export async function executeUnpublish(input, deps = {}) {
  const resolvedDeps = {
    withTransaction,
    evaluateUnpublish,
    clearEntityActivePublishedRevision,
    recordDestructiveEvent,
    ...deps
  };

  return resolvedDeps.withTransaction(async (db) => {
    const evaluation = await resolvedDeps.evaluateUnpublish(input, { ...deps, db });
    const rootSnapshot = {
      entityId: evaluation.root?.entityId ?? input.entityId,
      entityType: evaluation.root?.entityType ?? input.entityType,
      label: evaluation.root?.label ?? input.entityId
    };

    if (!evaluation.allowed) {
      await resolvedDeps.recordDestructiveEvent({
        auditEventKey: AUDIT_EVENT_KEYS.UNPUBLISH_BLOCKED,
        operationKind: "unpublish",
        outcome: "blocked",
        actorUserId: input.actorUserId ?? null,
        root: rootSnapshot,
        target: rootSnapshot,
        summary: "Снятие с публикации отклонено контрактом unpublish.",
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
        auditEventKey: AUDIT_EVENT_KEYS.UNPUBLISH_BLOCKED,
        operationKind: "unpublish",
        outcome: "blocked",
        actorUserId: input.actorUserId ?? null,
        revisionId: evaluation.root?.activePublishedRevisionId ?? null,
        root: rootSnapshot,
        target: rootSnapshot,
        summary: "Снятие с публикации остановлено: live-версия изменилась во время операции.",
        details: buildPublicationForensicDetails(blockedEvaluation)
      }, { db });

      return {
        executed: false,
        evaluation: blockedEvaluation,
        revalidationPaths: []
      };
    }

    await resolvedDeps.recordDestructiveEvent({
      auditEventKey: AUDIT_EVENT_KEYS.UNPUBLISHED,
      operationKind: "unpublish",
      outcome: "executed",
      actorUserId: input.actorUserId ?? null,
      revisionId: evaluation.root?.activePublishedRevisionId ?? null,
      root: rootSnapshot,
      target: rootSnapshot,
      summary: "Сущность снята с публикации.",
      affectedEntities: [
        {
          entityId: input.entityId,
          entityType: input.entityType
        }
      ],
      details: buildPublicationForensicDetails(evaluation)
    }, { db });

    return {
      executed: true,
      evaluation,
      revalidationPaths: evaluation.routeEffects?.revalidationPaths ?? []
    };
  });
}
