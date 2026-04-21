import { ENTITY_TYPES } from "../content-core/content-types.js";
import {
  COLLECTION_USAGE_SOURCE_TYPES,
  ENTITY_GRAPH_SOURCE_TYPES,
  buildEntityReferenceIndexFromCards,
  collectReferenceEntriesForTargetType
} from "../content-core/entity-graph.js";
import { getEntityEditorState, listEntityCards, listPublishedCards } from "../content-core/service.js";
import { isAgentTestCreationOrigin } from "./entity-origin.js";
import { getEntityAdminHref } from "./entity-links.js";
import { getRevisionStateLabel } from "../ui-copy.js";
import { getMediaDeliveryUrl, hasMediaFile } from "../media/storage.js";
import { getReviewWorkflowStatusModel } from "./review-workflow-status.js";

const MEDIA_USAGE_REFERENCE_TYPES = ENTITY_GRAPH_SOURCE_TYPES;

const COLLECTION_USAGE_REFERENCE_TYPES = COLLECTION_USAGE_SOURCE_TYPES;

const ENTITY_LABELS = {
  [ENTITY_TYPES.MEDIA_ASSET]: "Медиа",
  [ENTITY_TYPES.GALLERY]: "Коллекция",
  [ENTITY_TYPES.SERVICE]: "Услуга",
  [ENTITY_TYPES.CASE]: "Кейс",
  [ENTITY_TYPES.PAGE]: "Страница"
};

function labelFromPayload(payload = {}) {
  return payload?.title || payload?.h1 || payload?.publicBrandName || payload?.originalFilename || payload?.slug || "Без названия";
}

function toTimestamp(value) {
  const timestamp = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function buildStateSummary(state) {
  return getRevisionStateLabel(state || "draft");
}

function createReferenceEntry({ entityType, entityId, revision, relationLabel, statusKey }) {
  const href =
    entityType === ENTITY_TYPES.GALLERY
      ? `/admin/entities/media_asset?compose=collections&collection=${entityId}`
      : `/admin/entities/${entityType}/${entityId}`;

  return {
    key: `${entityId}:${revision.id}:${relationLabel}`,
    entityId,
    entityType,
    entityLabel: ENTITY_LABELS[entityType] || entityType,
    title: labelFromPayload(revision.payload),
    relationLabel,
    statusKey,
    statusLabel: buildStateSummary(statusKey),
    href
  };
}

function createCollectionMembershipEntry({ entityId, revision, statusKey }) {
  const payload = revision?.payload ?? {};

  return {
    id: entityId,
    key: `${entityId}:${revision.id}:membership`,
    title: labelFromPayload(payload),
    statusKey,
    statusLabel: buildStateSummary(statusKey),
    memberCount: (payload.assetIds ?? []).length,
    href: `/admin/entities/media_asset?compose=collections&collection=${entityId}`
  };
}

function pushUsageEntry(index, referenceId, entry) {
  if (!referenceId) {
    return;
  }

  const bucket = index.get(referenceId) ?? [];

  if (!bucket.some((existing) => existing.key === entry.key)) {
    bucket.push(entry);
    index.set(referenceId, bucket);
  }
}

function pushCollectionMembership(index, assetId, entry) {
  if (!assetId) {
    return;
  }

  const bucket = index.get(assetId) ?? [];

  if (!bucket.some((existing) => existing.id === entry.id)) {
    bucket.push(entry);
    index.set(assetId, bucket);
  }
}

function buildUsageEntryFromGraphEntry(entry) {
  return {
    key: entry.key,
    entityId: entry.sourceEntityId,
    entityType: entry.sourceEntityType,
    entityLabel: ENTITY_LABELS[entry.sourceEntityType] || entry.sourceEntityType,
    title: entry.sourceLabel,
    relationLabel: entry.relationLabel,
    statusKey: entry.sourceState,
    statusLabel: buildStateSummary(entry.sourceState),
    href: getEntityAdminHref(entry.sourceEntityType, entry.sourceEntityId)
  };
}

function collectMediaUsageFromRevision(index, entityType, entityId, revision, statusKey) {
  const payload = revision?.payload ?? {};

  switch (entityType) {
    case ENTITY_TYPES.GALLERY: {
      if (payload.primaryAssetId) {
        pushUsageEntry(
          index,
          payload.primaryAssetId,
          createReferenceEntry({
            entityType,
            entityId,
            revision,
            relationLabel: "Главный кадр коллекции",
            statusKey
          })
        );
      }

      for (const assetId of payload.assetIds ?? []) {
        pushUsageEntry(
          index,
          assetId,
          createReferenceEntry({
            entityType,
            entityId,
            revision,
            relationLabel: "Состав коллекции",
            statusKey
          })
        );
      }
      break;
    }
    case ENTITY_TYPES.SERVICE:
      if (payload.primaryMediaAssetId) {
        pushUsageEntry(
          index,
          payload.primaryMediaAssetId,
          createReferenceEntry({
            entityType,
            entityId,
            revision,
            relationLabel: "Основное медиа услуги",
            statusKey
          })
        );
      }
      break;
    case ENTITY_TYPES.CASE:
      if (payload.primaryMediaAssetId) {
        pushUsageEntry(
          index,
          payload.primaryMediaAssetId,
          createReferenceEntry({
            entityType,
            entityId,
            revision,
            relationLabel: "Основное медиа кейса",
            statusKey
          })
        );
      }
      break;
    case ENTITY_TYPES.PAGE:
      if (payload.primaryMediaAssetId) {
        pushUsageEntry(
          index,
          payload.primaryMediaAssetId,
          createReferenceEntry({
            entityType,
            entityId,
            revision,
            relationLabel: "Основное медиа страницы",
            statusKey
          })
        );
      }
      break;
    default:
      break;
  }
}

function collectCollectionUsageFromRevision(index, entityType, entityId, revision, statusKey) {
  const payload = revision?.payload ?? {};

  switch (entityType) {
    case ENTITY_TYPES.SERVICE:
      for (const galleryId of payload.galleryIds ?? []) {
        pushUsageEntry(
          index,
          galleryId,
          createReferenceEntry({
            entityType,
            entityId,
            revision,
            relationLabel: "Коллекция услуги",
            statusKey
          })
        );
      }
      break;
    case ENTITY_TYPES.CASE:
      for (const galleryId of payload.galleryIds ?? []) {
        pushUsageEntry(
          index,
          galleryId,
          createReferenceEntry({
            entityType,
            entityId,
            revision,
            relationLabel: "Коллекция кейса",
            statusKey
          })
        );
      }
      break;
    case ENTITY_TYPES.PAGE:
      for (const block of payload.blocks ?? []) {
        if (block?.type !== "gallery") {
          continue;
        }

        for (const galleryId of block.galleryIds ?? []) {
          pushUsageEntry(
            index,
            galleryId,
            createReferenceEntry({
            entityType,
            entityId,
            revision,
            relationLabel: block.title ? `Блок страницы: ${block.title}` : "Блок коллекции страницы",
            statusKey
          })
        );
        }
      }
      break;
    default:
      break;
  }
}

function deriveUsageSummary(entries) {
  const publishedUsageCount = entries.filter((entry) => entry.statusKey === "published").length;
  const draftUsageCount = entries.length - publishedUsageCount;
  const byEntityType = entries.reduce((acc, entry) => {
    acc[entry.entityType] = (acc[entry.entityType] ?? 0) + 1;
    return acc;
  }, {});

  return {
    entries,
    usageCount: entries.length,
    publishedUsageCount,
    draftUsageCount,
    byEntityType,
    whereUsedLabel: entries.length ? `Используется: ${entries.length}` : "Пока не используется",
    archiveBlocked: entries.length > 0
  };
}

function buildUsageSummaryItems(usage) {
  const items = [
    { key: "all", label: "Всего связей", value: usage.usageCount },
    { key: "published", label: "Опубликовано", value: usage.publishedUsageCount },
    { key: "draft", label: "Черновики", value: usage.draftUsageCount },
    { key: ENTITY_TYPES.GALLERY, label: "Коллекции", value: usage.byEntityType?.[ENTITY_TYPES.GALLERY] ?? 0 },
    { key: ENTITY_TYPES.SERVICE, label: "Услуги", value: usage.byEntityType?.[ENTITY_TYPES.SERVICE] ?? 0 },
    { key: ENTITY_TYPES.CASE, label: "Кейсы", value: usage.byEntityType?.[ENTITY_TYPES.CASE] ?? 0 },
    { key: ENTITY_TYPES.PAGE, label: "Страницы", value: usage.byEntityType?.[ENTITY_TYPES.PAGE] ?? 0 }
  ];

  return items.filter((item) => item.key === "all" || item.value > 0);
}

function buildWarnings(payload, binaryHealthy) {
  const warnings = [];

  if (!payload.storageKey) {
    warnings.push("Файл ещё не привязан к хранилищу");
  } else if (!binaryHealthy) {
    warnings.push("Бинарник недоступен для admin preview");
  }

  if (!payload.alt) {
    warnings.push("Нужно описание изображения");
  }

  if (!payload.ownershipNote) {
    warnings.push("Нет заметки о правах");
  }

  return warnings;
}

function sortUsageEntries(entries) {
  return [...entries].sort((left, right) => {
    const leftRank = left.statusKey === "published" ? 0 : 1;
    const rightRank = right.statusKey === "published" ? 0 : 1;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return left.title.localeCompare(right.title, "ru");
  });
}

function buildCollectionMembershipIndex(latestCollectionCards) {
  const index = new Map();

  for (const card of latestCollectionCards) {
    if (!card.latestRevision) {
      continue;
    }

    const entry = createCollectionMembershipEntry({
      entityId: card.entity.id,
      revision: card.latestRevision,
      statusKey: card.latestRevision.state
    });

    for (const assetId of card.latestRevision.payload?.assetIds ?? []) {
      pushCollectionMembership(index, assetId, entry);
    }
  }

  return index;
}

export function summarizeCollectionMembership(entries) {
  if (entries.length === 0) {
    return {
      label: "Сирота",
      shortLabel: "Сирота",
      tone: "warning"
    };
  }

  if (entries.length === 1) {
    return {
      label: entries[0].title,
      shortLabel: "1 коллекция",
      tone: "success"
    };
  }

  return {
    label: `Коллекций: ${entries.length}`,
    shortLabel: `${entries.length} коллекции`,
    tone: "muted"
  };
}

function buildMediaCardDto({ card, publishedRevision, usageEntries, collectionEntries, binaryHealthy }) {
  const latestRevision = card.latestRevision;
  const payload = latestRevision?.payload ?? {};
  const usage = deriveUsageSummary(usageEntries);
  const statusKey = latestRevision?.state ?? "draft";
  const reviewWorkflowStatus = statusKey === "review" ? getReviewWorkflowStatusModel(latestRevision ?? {}) : null;
  const updatedAt = latestRevision?.updatedAt || card.entity.updatedAt || payload.uploadedAt || "";
  const uploadedAt = payload.uploadedAt || updatedAt || "";
  const warnings = buildWarnings(payload, binaryHealthy);
  const sortedCollectionEntries = [...collectionEntries].sort((left, right) => left.title.localeCompare(right.title, "ru"));
  const membership = summarizeCollectionMembership(sortedCollectionEntries);
  const lifecycleState = payload.lifecycleState || "active";
  const archived = lifecycleState === "archived";
  const archiveReason = archived
    ? "Карточка уже находится в архиве. При необходимости её можно вернуть в активный список."
    : usage.archiveBlocked
      ? "Архив недоступен, пока у ассета есть хотя бы одна ссылка в коллекциях, услугах, кейсах или страницах."
      : "Ассет пока нигде не используется. Его можно безопасно перевести в архив.";

  return {
    id: card.entity.id,
    currentRevisionId: latestRevision?.id ?? null,
    ownerReviewRequired: Boolean(latestRevision?.ownerReviewRequired),
    ownerApprovalStatus: latestRevision?.ownerApprovalStatus ?? "not_required",
    creationOrigin: card.entity.creationOrigin ?? null,
    markedForRemovalAt: card.entity.markedForRemovalAt ?? null,
    isTestData: isAgentTestCreationOrigin(card.entity.creationOrigin),
    title: labelFromPayload(payload),
    alt: payload.alt || "",
    caption: payload.caption || "",
    sourceNote: payload.sourceNote || "",
    ownershipNote: payload.ownershipNote || "",
    storageKey: payload.storageKey || "",
    mimeType: payload.mimeType || "",
    originalFilename: payload.originalFilename || "",
    uploadedBy: payload.uploadedBy || "",
    uploadedAt,
    sizeBytes: Number(payload.sizeBytes || 0),
    previewUrl: payload.storageKey ? `/api/admin/media/${card.entity.id}/preview` : "",
    deliveryUrl: payload.storageKey ? getMediaDeliveryUrl({ entityId: card.entity.id, storageKey: payload.storageKey }) : "",
    statusKey,
    statusLabel: reviewWorkflowStatus?.label || buildStateSummary(statusKey),
    statusTone: reviewWorkflowStatus?.tone || "",
    payloadStatus: payload.status || "draft_asset",
    payloadStatusLabel: payload.status === "ready" ? "Метаданные собраны" : "Черновик ассета",
    lifecycleState,
    lifecycleLabel: archived ? "В архиве" : "Активен",
    archived,
    missingAlt: !payload.alt,
    brokenBinary: payload.storageKey ? !binaryHealthy : true,
    hasPreview: Boolean(payload.storageKey) && binaryHealthy,
    warnings,
    warningCount: warnings.length,
    updatedAt,
    updatedAtTs: toTimestamp(updatedAt),
    recent: toTimestamp(uploadedAt) >= Date.now() - 1000 * 60 * 60 * 24 * 7,
    usageCount: usage.usageCount,
    publishedUsageCount: usage.publishedUsageCount,
    draftUsageCount: usage.draftUsageCount,
    usageSummaryItems: buildUsageSummaryItems(usage),
    whereUsedLabel: usage.whereUsedLabel,
    usageEntries: sortUsageEntries(usage.entries),
    archiveBlocked: usage.archiveBlocked,
    archiveReason,
    canArchive: !archived && !usage.archiveBlocked,
    canRestore: archived,
    collectionEntries: sortedCollectionEntries,
    collectionCount: sortedCollectionEntries.length,
    collectionLabel: membership.label,
    collectionShortLabel: membership.shortLabel,
    orphaned: sortedCollectionEntries.length === 0,
    publishedRevisionNumber: publishedRevision?.revisionNumber ?? null
  };
}

function buildCollectionCardDto({ card, usageEntries }) {
  const latestRevision = card.latestRevision;
  const payload = latestRevision?.payload ?? {};
  const usage = deriveUsageSummary(usageEntries);
  const statusKey = latestRevision?.state ?? "draft";
  const updatedAt = latestRevision?.updatedAt || card.entity.updatedAt || "";

  return {
    id: card.entity.id,
    markedForRemovalAt: card.entity.markedForRemovalAt ?? null,
    title: labelFromPayload(payload),
    caption: payload.caption || "",
    assetIds: payload.assetIds ?? [],
    primaryAssetId: payload.primaryAssetId || "",
    relatedEntityIds: payload.relatedEntityIds ?? [],
    seo: payload.seo ?? {},
    memberCount: (payload.assetIds ?? []).length,
    statusKey,
    statusLabel: buildStateSummary(statusKey),
    updatedAt,
    updatedAtTs: toTimestamp(updatedAt),
    usageCount: usage.usageCount,
    whereUsedLabel: usage.whereUsedLabel,
    usageEntries: sortUsageEntries(usage.entries),
    archiveBlocked: usage.archiveBlocked,
    href: `/admin/entities/media_asset?compose=collections&collection=${card.entity.id}`
  };
}

async function buildReferenceIndex(entityTypes, collector) {
  const index = new Map();

  for (const entityType of entityTypes) {
    const latestCards = await listEntityCards(entityType);
    const publishedCards = await listPublishedCards(entityType);
    const seenRevisionIds = new Set();

    for (const card of latestCards) {
      if (!card.latestRevision) {
        continue;
      }

      seenRevisionIds.add(card.latestRevision.id);
      collector(index, entityType, card.entity.id, card.latestRevision, card.latestRevision.state);
    }

    for (const published of publishedCards) {
      if (!published.revision || seenRevisionIds.has(published.revision.id)) {
        continue;
      }

      collector(index, entityType, published.entityId, published.revision, "published");
    }
  }

  return index;
}

async function buildMediaUsageIndex() {
  const latestByType = {};
  const publishedByType = {};

  for (const entityType of MEDIA_USAGE_REFERENCE_TYPES) {
    latestByType[entityType] = await listEntityCards(entityType);
    publishedByType[entityType] = await listPublishedCards(entityType);
  }

  const referenceIndex = buildEntityReferenceIndexFromCards({
    sourceEntityTypes: MEDIA_USAGE_REFERENCE_TYPES,
    latestByType,
    publishedByType
  });
  const grouped = collectReferenceEntriesForTargetType(referenceIndex, ENTITY_TYPES.MEDIA_ASSET);

  return new Map(
    [...grouped.entries()].map(([targetId, entries]) => [
      targetId,
      entries.map(buildUsageEntryFromGraphEntry)
    ])
  );
}

async function buildCollectionUsageIndex() {
  const latestByType = {};
  const publishedByType = {};

  for (const entityType of COLLECTION_USAGE_REFERENCE_TYPES) {
    latestByType[entityType] = await listEntityCards(entityType);
    publishedByType[entityType] = await listPublishedCards(entityType);
  }

  const referenceIndex = buildEntityReferenceIndexFromCards({
    sourceEntityTypes: COLLECTION_USAGE_REFERENCE_TYPES,
    latestByType,
    publishedByType
  });
  const grouped = collectReferenceEntriesForTargetType(referenceIndex, ENTITY_TYPES.GALLERY);

  return new Map(
    [...grouped.entries()].map(([targetId, entries]) => [
      targetId,
      entries.map(buildUsageEntryFromGraphEntry)
    ])
  );
}

async function buildPublishedMediaMap() {
  const publishedCards = await listPublishedCards(ENTITY_TYPES.MEDIA_ASSET);
  return new Map(publishedCards.map((card) => [card.entityId, card.revision]));
}

export async function listMediaLibraryCards({ includeBinaryProbe = true } = {}) {
  const cards = await listEntityCards(ENTITY_TYPES.MEDIA_ASSET);
  const latestCollectionCards = await listEntityCards(ENTITY_TYPES.GALLERY);
  const usageIndex = await buildMediaUsageIndex();
  const publishedMap = await buildPublishedMediaMap();
  const collectionMembershipIndex = buildCollectionMembershipIndex(latestCollectionCards);

  return Promise.all(
    cards.map(async (card) => {
      const payload = card.latestRevision?.payload ?? {};
      const binaryHealthy = payload.storageKey
        ? (includeBinaryProbe ? await hasMediaFile(payload.storageKey) : true)
        : false;

      return buildMediaCardDto({
        card,
        publishedRevision: publishedMap.get(card.entity.id) ?? null,
        usageEntries: usageIndex.get(card.entity.id) ?? [],
        collectionEntries: collectionMembershipIndex.get(card.entity.id) ?? [],
        binaryHealthy
      });
    })
  );
}

export async function getMediaLibraryCard(entityId) {
  const state = await getEntityEditorState(entityId);

  if (!state?.entity || state.entity.entityType !== ENTITY_TYPES.MEDIA_ASSET) {
    return null;
  }

  const latestRevision = state.revisions[0] ?? state.activePublishedRevision ?? null;

  if (!latestRevision) {
    return null;
  }

  const usageIndex = await buildMediaUsageIndex();
  const publishedMap = await buildPublishedMediaMap();
  const latestCollectionCards = await listEntityCards(ENTITY_TYPES.GALLERY);
  const collectionMembershipIndex = buildCollectionMembershipIndex(latestCollectionCards);
  const payload = latestRevision.payload ?? {};
  const binaryHealthy = payload.storageKey ? await hasMediaFile(payload.storageKey) : false;

  return buildMediaCardDto({
    card: {
      entity: state.entity,
      latestRevision: {
        id: latestRevision.id,
        revisionNumber: latestRevision.revisionNumber,
        state: latestRevision.state,
        payload: latestRevision.payload,
        ownerReviewRequired: latestRevision.ownerReviewRequired,
        ownerApprovalStatus: latestRevision.ownerApprovalStatus,
        previewStatus: latestRevision.previewStatus,
        updatedAt: latestRevision.updatedAt
      }
    },
    publishedRevision: publishedMap.get(entityId) ?? null,
    usageEntries: usageIndex.get(entityId) ?? [],
    collectionEntries: collectionMembershipIndex.get(entityId) ?? [],
    binaryHealthy
  });
}

export async function getMediaLibraryCardsByIds(entityIds) {
  const uniqueIds = [...new Set((entityIds ?? []).filter(Boolean))];
  const items = await Promise.all(uniqueIds.map((entityId) => getMediaLibraryCard(entityId)));
  return items.filter(Boolean);
}

export async function listCollectionLibraryCards() {
  const cards = await listEntityCards(ENTITY_TYPES.GALLERY);
  const usageIndex = await buildCollectionUsageIndex();

  return cards
    .filter((card) => card.latestRevision)
    .map((card) =>
      buildCollectionCardDto({
        card,
        usageEntries: usageIndex.get(card.entity.id) ?? []
      })
    )
    .sort((left, right) => right.updatedAtTs - left.updatedAtTs);
}

export async function getCollectionLibraryCard(entityId) {
  const state = await getEntityEditorState(entityId);

  if (!state?.entity || state.entity.entityType !== ENTITY_TYPES.GALLERY) {
    return null;
  }

  const latestRevision = state.revisions[0] ?? state.activePublishedRevision ?? null;

  if (!latestRevision) {
    return null;
  }

  const usageIndex = await buildCollectionUsageIndex();

  return buildCollectionCardDto({
    card: {
      entity: state.entity,
      latestRevision: {
        id: latestRevision.id,
        revisionNumber: latestRevision.revisionNumber,
        state: latestRevision.state,
        payload: latestRevision.payload,
        updatedAt: latestRevision.updatedAt
      }
    },
    usageEntries: usageIndex.get(entityId) ?? []
  });
}

export async function listMediaPickerOptions() {
  const items = await listMediaLibraryCards({ includeBinaryProbe: false });

  return items
    .filter((item) => !item.archived && !item.markedForRemovalAt)
    .map((item) => ({
    id: item.id,
    title: item.title,
    alt: item.alt,
    originalFilename: item.originalFilename,
    whereUsedLabel: item.whereUsedLabel,
    previewUrl: item.previewUrl
    }));
}

export function summarizeMediaLibrary(items, currentUser) {
  return {
    total: items.length,
    missingAltCount: items.filter((item) => item.missingAlt).length,
    usedCount: items.filter((item) => item.usageCount > 0).length,
    brokenCount: items.filter((item) => item.brokenBinary).length,
    orphanCount: items.filter((item) => item.orphaned).length,
    archivedCount: items.filter((item) => item.archived).length,
    mineCount: items.filter((item) => item.uploadedBy && item.uploadedBy === currentUser?.username).length
  };
}
