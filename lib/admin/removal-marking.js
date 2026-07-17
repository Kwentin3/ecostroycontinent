import { withTransaction } from "../db/client.js";
import { recordAuditEvent } from "../content-ops/audit.js";
import { AUDIT_EVENT_KEYS, ENTITY_TYPES } from "../content-core/content-types.js";
import { findEntityById, markEntityForRemoval } from "../content-core/repository.js";
import { isRemovalQuarantineEntityTypeSupported } from "./removal-quarantine.js";

const defaultDeps = {
  withTransaction,
  findEntityById,
  markEntityForRemoval,
  recordAuditEvent
};

export function normalizeRemovalEntityIds(values = []) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

export async function markEntityForRemovalWithAudit(input, deps = defaultDeps) {
  const resolvedDeps = { ...defaultDeps, ...deps };
  const entityType = String(input.entityType ?? "").trim();
  const entityId = String(input.entityId ?? "").trim();
  const actorUserId = String(input.actorUserId ?? "").trim();
  const removalNote = String(input.removalNote ?? "").trim() || null;

  if (!isRemovalQuarantineEntityTypeSupported(entityType)) {
    throw new Error("Этот тип сущности пока не поддерживает пометку удаления.");
  }

  if (!entityId) {
    throw new Error("Нужно указать объект для пометки удаления.");
  }

  if (!actorUserId) {
    throw new Error("Не удалось определить пользователя для пометки удаления.");
  }

  return resolvedDeps.withTransaction(async (db) => {
    const entity = await resolvedDeps.findEntityById(entityId, db);

    if (!entity || entity.entityType !== entityType) {
      throw new Error("Сущность не найдена.");
    }

    if (entity.markedForRemovalAt) {
      return {
        status: "already_marked",
        entity
      };
    }

    const markedEntity = await resolvedDeps.markEntityForRemoval(entityId, actorUserId, removalNote, db);

    if (!markedEntity) {
      const currentEntity = await resolvedDeps.findEntityById(entityId, db);

      if (currentEntity?.entityType === entityType && currentEntity.markedForRemovalAt) {
        return {
          status: "already_marked",
          entity: currentEntity
        };
      }

      throw new Error("Не удалось зафиксировать пометку удаления.");
    }

    await resolvedDeps.recordAuditEvent({
      entityId,
      actorUserId,
      eventKey: AUDIT_EVENT_KEYS.REMOVAL_MARKED,
      summary: "Объект помечен на удаление.",
      details: {
        entityType,
        entityId,
        removalNote
      }
    }, { db });

    return {
      status: "marked",
      entity: markedEntity
    };
  });
}

export async function markMediaAssetsForRemoval(input, deps = defaultDeps) {
  const requestedIds = normalizeRemovalEntityIds(input.assetIds);
  const markedIds = [];
  const alreadyMarkedIds = [];
  const marks = [];
  const failed = [];

  for (const entityId of requestedIds) {
    try {
      const result = await markEntityForRemovalWithAudit({
        entityType: ENTITY_TYPES.MEDIA_ASSET,
        entityId,
        actorUserId: input.actorUserId,
        removalNote: input.removalNote
      }, deps);
      const mark = {
        id: entityId,
        markedForRemovalAt: result.entity?.markedForRemovalAt ?? null
      };

      marks.push(mark);

      if (result.status === "already_marked") {
        alreadyMarkedIds.push(entityId);
      } else {
        markedIds.push(entityId);
      }
    } catch (error) {
      failed.push({
        id: entityId,
        reason: error?.message || "Не удалось пометить медиафайл на удаление."
      });
    }
  }

  return {
    requestedIds,
    markedIds,
    alreadyMarkedIds,
    marks,
    failed,
    markedCount: markedIds.length,
    alreadyMarkedCount: alreadyMarkedIds.length,
    failedCount: failed.length
  };
}
