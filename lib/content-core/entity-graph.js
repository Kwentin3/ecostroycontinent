import { ENTITY_TYPES, ENTITY_TYPE_LABELS } from "./content-types.js";
import { collectEntityReferenceRecords } from "./entity-references.js";

export const ENTITY_GRAPH_SOURCE_TYPES = Object.freeze([
  ENTITY_TYPES.GALLERY,
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.EQUIPMENT,
  ENTITY_TYPES.CASE,
  ENTITY_TYPES.PAGE
]);

export const COLLECTION_USAGE_SOURCE_TYPES = Object.freeze([
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.EQUIPMENT,
  ENTITY_TYPES.CASE,
  ENTITY_TYPES.PAGE
]);

function normalizeId(value) {
  return String(value ?? "").trim();
}

function dedupeBy(items = [], keyBuilder) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = keyBuilder(item);

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

function getEntityLabelLower(entityType) {
  return (ENTITY_TYPE_LABELS[entityType] || entityType).toLowerCase();
}

export function getEntityGraphLabel(payload = {}, entityType, entityId = "") {
  return payload?.title
    || payload?.h1
    || payload?.publicBrandName
    || payload?.originalFilename
    || payload?.slug
    || `${ENTITY_TYPE_LABELS[entityType] || entityType} ${entityId}`.trim();
}

export function getReferenceRelationLabel(sourceEntityType, ref = {}) {
  const field = String(ref.field ?? "").trim();

  switch (field) {
    case "primaryAssetId":
      return "Главный кадр коллекции";
    case "assetIds":
      return "Состав коллекции";
    case "relatedEntityIds":
      return "Связанная сущность коллекции";
    case "primaryMediaAssetId":
      if (sourceEntityType === ENTITY_TYPES.SERVICE) {
        return "Основное медиа услуги";
      }

      if (sourceEntityType === ENTITY_TYPES.EQUIPMENT) {
        return "Основное медиа техники";
      }

      if (sourceEntityType === ENTITY_TYPES.CASE) {
        return "Основное медиа кейса";
      }

      if (sourceEntityType === ENTITY_TYPES.PAGE) {
        return "Основное медиа страницы";
      }

      return "Основное медиа";
    case "relatedCaseIds":
      return sourceEntityType === ENTITY_TYPES.EQUIPMENT
        ? "Связанные кейсы техники"
        : "Связанные кейсы";
    case "galleryIds":
      if (sourceEntityType === ENTITY_TYPES.SERVICE) {
        return "Коллекции услуги";
      }

      if (sourceEntityType === ENTITY_TYPES.EQUIPMENT) {
        return "Коллекции техники";
      }

      if (sourceEntityType === ENTITY_TYPES.CASE) {
        return "Коллекции кейса";
      }

      return "Коллекции";
    case "serviceIds":
      if (sourceEntityType === ENTITY_TYPES.CASE) {
        return "Связанные услуги кейса";
      }

      if (sourceEntityType === ENTITY_TYPES.EQUIPMENT) {
        return "Связанные услуги техники";
      }

      if (sourceEntityType === ENTITY_TYPES.PAGE) {
        return "Связанные услуги страницы";
      }

      return "Связанные услуги";
    case "sourceRefs.primaryServiceId":
      return "Главная услуга-источник";
    case "sourceRefs.primaryEquipmentId":
      return "Главная техника-источник";
    case "sourceRefs.caseIds":
      return "Кейсы-источники";
    case "sourceRefs.galleryIds":
      return "Коллекции-источники";
    case "blocks.mediaAssetId":
      return "Медиа в блоке страницы";
    case "blocks.mediaAssetIds":
      return "Набор медиа в блоке страницы";
    case "blocks.serviceIds":
      return "Услуги в блоке страницы";
    case "blocks.caseIds":
      return "Кейсы в блоке страницы";
    case "blocks.galleryIds":
      return "Коллекция в блоке страницы";
    case "pageRefs":
      return "Связи страницы";
    default:
      return `${getEntityLabelLower(sourceEntityType)}: ${field || "связь"}`;
  }
}

export function buildReferenceLookupKey(targetEntityType, targetId) {
  return `${targetEntityType ?? "any"}:${normalizeId(targetId)}`;
}

function buildReferenceEntry(sourceEntityType, cardLike, revision, state, ref) {
  const entity = cardLike?.entity ?? null;
  const sourceEntityId = entity?.id ?? cardLike?.entityId ?? "";
  const payload = revision?.payload ?? {};

  return {
    key: [
      sourceEntityType,
      sourceEntityId,
      revision?.id ?? "",
      state,
      ref.targetEntityType ?? "any",
      ref.targetId,
      ref.field ?? ""
    ].join(":"),
    sourceEntityType,
    sourceEntityId,
    sourceLabel: getEntityGraphLabel(payload, sourceEntityType, sourceEntityId),
    sourceCreationOrigin: entity?.creationOrigin ?? null,
    sourceMarkedForRemovalAt: entity?.markedForRemovalAt ?? null,
    sourceState: state,
    targetEntityType: ref.targetEntityType ?? null,
    targetId: ref.targetId,
    field: ref.field ?? null,
    relationLabel: getReferenceRelationLabel(sourceEntityType, ref)
  };
}

function pushReferenceEntry(index, entry) {
  const key = buildReferenceLookupKey(entry.targetEntityType, entry.targetId);
  const bucket = index.get(key) ?? [];

  if (!bucket.some((item) => item.key === entry.key)) {
    bucket.push(entry);
    index.set(key, bucket);
  }
}

export function buildEntityReferenceIndexFromCards({
  sourceEntityTypes = ENTITY_GRAPH_SOURCE_TYPES,
  latestByType = {},
  publishedByType = {}
} = {}) {
  const index = new Map();

  for (const sourceEntityType of sourceEntityTypes) {
    const latestCards = latestByType[sourceEntityType] ?? [];
    const publishedCards = publishedByType[sourceEntityType] ?? [];
    const latestCardById = new Map(
      latestCards
        .filter((card) => card?.entity?.id)
        .map((card) => [card.entity.id, card])
    );
    const seenRevisionIds = new Set();

    for (const card of latestCards) {
      if (!card?.latestRevision) {
        continue;
      }

      seenRevisionIds.add(card.latestRevision.id);

      for (const ref of collectEntityReferenceRecords(sourceEntityType, card.latestRevision.payload ?? {})) {
        pushReferenceEntry(
          index,
          buildReferenceEntry(sourceEntityType, card, card.latestRevision, card.latestRevision.state, ref)
        );
      }
    }

    for (const published of publishedCards) {
      if (!published?.revision || seenRevisionIds.has(published.revision.id)) {
        continue;
      }

      const latestCard = latestCardById.get(published.entityId) ?? null;
      const cardLike = latestCard
        ? { ...latestCard, revision: published.revision }
        : {
            entityId: published.entityId,
            entityType: sourceEntityType,
            revision: published.revision
          };

      for (const ref of collectEntityReferenceRecords(sourceEntityType, published.revision.payload ?? {})) {
        pushReferenceEntry(
          index,
          buildReferenceEntry(sourceEntityType, cardLike, published.revision, "published", ref)
        );
      }
    }
  }

  return index;
}

export function lookupEntityReferenceEntries(index, targetEntityType, targetId) {
  const normalizedId = normalizeId(targetId);

  if (!normalizedId) {
    return [];
  }

  return dedupeBy(
    [
      ...(index.get(buildReferenceLookupKey(targetEntityType, normalizedId)) ?? []),
      ...(index.get(buildReferenceLookupKey(null, normalizedId)) ?? [])
    ],
    (entry) => entry.key
  );
}

export function collectReferenceEntriesForTargetType(index, targetEntityType) {
  const grouped = new Map();

  for (const entries of index.values()) {
    for (const entry of entries) {
      if (entry.targetEntityType !== targetEntityType) {
        continue;
      }

      const bucket = grouped.get(entry.targetId) ?? [];

      if (!bucket.some((item) => item.key === entry.key)) {
        bucket.push(entry);
        grouped.set(entry.targetId, bucket);
      }
    }
  }

  return grouped;
}

export function collectEntityGraphOutgoingRefs(entityType, aggregate = {}) {
  const refs = [];
  const latestRevision = aggregate?.revisions?.[0] ?? null;
  const publishedRevision = aggregate?.activePublishedRevision ?? null;

  if (latestRevision?.payload) {
    refs.push(...collectEntityReferenceRecords(entityType, latestRevision.payload));
  }

  if (publishedRevision?.payload) {
    refs.push(...collectEntityReferenceRecords(entityType, publishedRevision.payload));
  }

  return dedupeBy(
    refs,
    (ref) => `${ref.targetEntityType ?? "any"}:${ref.targetId}:${ref.field ?? ""}`
  );
}

export function collectEntityGraphOutgoingTargets(entityType, aggregate = {}) {
  return dedupeBy(
    collectEntityGraphOutgoingRefs(entityType, aggregate)
      .filter((ref) => normalizeId(ref.targetId) && normalizeId(ref.targetEntityType))
      .map((ref) => ({
        entityType: ref.targetEntityType,
        entityId: ref.targetId
      })),
    (ref) => `${ref.entityType}:${ref.entityId}`
  );
}
