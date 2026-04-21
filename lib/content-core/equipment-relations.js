import { ENTITY_TYPES } from "./content-types.js";

function normalizeId(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeIds(values = []) {
  return Array.from(new Set((values ?? []).map((value) => normalizeId(value)).filter(Boolean)));
}

function unwrapPayload(record) {
  if (!record || typeof record !== "object") {
    return {};
  }

  if (record.latestRevision?.payload && typeof record.latestRevision.payload === "object") {
    return record.latestRevision.payload;
  }

  return record;
}

function getRecordId(record) {
  return normalizeId(record?.entity?.id ?? record?.entityId ?? record?.id);
}

function hasLinkedId(ids = [], targetId = "") {
  const normalizedTargetId = normalizeId(targetId);

  if (!normalizedTargetId) {
    return false;
  }

  return normalizeIds(ids).includes(normalizedTargetId);
}

function hasExplicitEquipmentIds(payload = {}) {
  return Object.prototype.hasOwnProperty.call(payload || {}, "equipmentIds") && Array.isArray(payload?.equipmentIds);
}

export function equipmentLinksToEntity(record, entityType, entityId) {
  const payload = unwrapPayload(record);

  switch (entityType) {
    case ENTITY_TYPES.SERVICE:
      return hasLinkedId(payload.serviceIds, entityId);
    case ENTITY_TYPES.CASE:
      return hasLinkedId(payload.relatedCaseIds ?? payload.caseIds, entityId);
    default:
      return false;
  }
}

export function listLegacyEquipmentLinkedToEntity(records = [], entityType, entityId) {
  return (records ?? []).filter((record) => equipmentLinksToEntity(record, entityType, entityId));
}

export function resolveEquipmentIdsForEntity({
  payload = {},
  equipmentRecords = [],
  entityType,
  entityId = ""
} = {}) {
  if (hasExplicitEquipmentIds(payload)) {
    return normalizeIds(payload.equipmentIds);
  }

  return listLegacyEquipmentLinkedToEntity(equipmentRecords, entityType, entityId)
    .map((record) => getRecordId(record))
    .filter(Boolean);
}

export function resolveEquipmentRecordsForEntity({
  payload = {},
  equipmentRecords = [],
  entityType,
  entityId = ""
} = {}) {
  const equipmentIds = resolveEquipmentIdsForEntity({
    payload,
    equipmentRecords,
    entityType,
    entityId
  });
  const recordMap = new Map(
    (equipmentRecords ?? [])
      .map((record) => [getRecordId(record), record])
      .filter(([id]) => Boolean(id))
  );

  return equipmentIds
    .map((equipmentId) => recordMap.get(equipmentId))
    .filter(Boolean);
}

export function listEntitiesReferencingEquipment(records = [], equipmentId = "") {
  const normalizedEquipmentId = normalizeId(equipmentId);

  if (!normalizedEquipmentId) {
    return [];
  }

  return (records ?? []).filter((record) => {
    const payload = unwrapPayload(record);
    return hasLinkedId(payload.equipmentIds, normalizedEquipmentId);
  });
}
