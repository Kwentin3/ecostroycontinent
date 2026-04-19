import {
  insertDestructiveForensicEvent,
  listDestructiveForensicEvents,
  listDestructiveForensicEventsForEntity
} from "../content-core/repository.js";
import { createId } from "../utils/id.js";
import { recordAuditEvent } from "./audit.js";

function normalizeString(value) {
  return String(value ?? "").trim();
}

function normalizeSnapshot(snapshot = {}) {
  return {
    entityId: normalizeString(snapshot.entityId) || null,
    entityType: normalizeString(snapshot.entityType) || null,
    label: normalizeString(snapshot.label) || null
  };
}

function normalizeAffectedEntityIds(root, target, affectedEntities = []) {
  const values = new Set();

  for (const entityId of [
    root.entityId,
    target.entityId,
    ...affectedEntities
      .map((item) => normalizeString(item?.entityId ?? item))
      .filter(Boolean)
  ]) {
    if (entityId) {
      values.add(entityId);
    }
  }

  return [...values];
}

export function createDestructiveCorrelationId() {
  return createId("destructive_op");
}

export async function recordDestructiveEvent(input, options = {}) {
  const root = normalizeSnapshot(input.root);
  const target = normalizeSnapshot(input.target);
  const correlationId = normalizeString(input.correlationId) || createDestructiveCorrelationId();
  const operationKind = normalizeString(input.operationKind) || "destructive_operation";
  const outcome = normalizeString(input.outcome) || "recorded";
  const summary = normalizeString(input.summary) || "Destructive operation recorded.";
  const actorUserId = normalizeString(input.actorUserId) || null;
  const revisionId = normalizeString(input.revisionId) || null;
  const affectedEntityIds = normalizeAffectedEntityIds(root, target, input.affectedEntities ?? []);
  const details = input.details ?? {};

  if (input.auditEventKey) {
    await recordAuditEvent({
      entityId: target.entityId,
      revisionId,
      actorUserId,
      eventKey: input.auditEventKey,
      summary,
      details: {
        correlationId,
        operationKind,
        outcome,
        ...details
      }
    }, { db: options.db ?? null });
  }

  await insertDestructiveForensicEvent({
    id: createId("forensic"),
    correlationId,
    operationKind,
    outcome,
    actorUserId,
    rootEntityId: root.entityId,
    rootEntityType: root.entityType,
    rootEntityLabel: root.label,
    targetEntityId: target.entityId,
    targetEntityType: target.entityType,
    targetEntityLabel: target.label,
    affectedEntityIds,
    summary,
    details
  }, options.db ?? null);

  return correlationId;
}

export async function listRecentDestructiveEvents(options = {}) {
  return listDestructiveForensicEvents(options, options.db ?? null);
}

export async function listDestructiveEventsForEntity(entityId, options = {}) {
  return listDestructiveForensicEventsForEntity(entityId, options, options.db ?? null);
}
