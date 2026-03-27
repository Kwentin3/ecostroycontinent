import { ENTITY_TYPES } from "../content-core/content-types.js";
import { getEntityEditorState, listEntityCards, listPublishedCards } from "../content-core/service.js";
import { getRevisionStateLabel } from "../ui-copy.js";
import { getMediaDeliveryUrl, hasMediaFile } from "../media/storage.js";

const REFERENCE_TYPES = [
  ENTITY_TYPES.GALLERY,
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.CASE,
  ENTITY_TYPES.PAGE
];

const ENTITY_LABELS = {
  [ENTITY_TYPES.MEDIA_ASSET]: "Медиа",
  [ENTITY_TYPES.GALLERY]: "Галерея",
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
  return {
    key: `${entityId}:${revision.id}:${relationLabel}`,
    entityId,
    entityType,
    entityLabel: ENTITY_LABELS[entityType] || entityType,
    title: labelFromPayload(revision.payload),
    relationLabel,
    statusKey,
    statusLabel: buildStateSummary(statusKey),
    href: `/admin/entities/${entityType}/${entityId}`
  };
}

function pushUsageEntry(index, assetId, entry) {
  if (!assetId) {
    return;
  }

  const bucket = index.get(assetId) ?? [];

  if (!bucket.some((existing) => existing.key === entry.key)) {
    bucket.push(entry);
    index.set(assetId, bucket);
  }
}

function collectUsageFromRevision(index, entityType, entityId, revision, statusKey) {
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
            relationLabel: "Главный кадр галереи",
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
            relationLabel: "Состав галереи",
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

function deriveUsageSummary(entries) {
  const publishedUsageCount = entries.filter((entry) => entry.statusKey === "published").length;
  const draftUsageCount = entries.length - publishedUsageCount;

  return {
    entries,
    usageCount: entries.length,
    publishedUsageCount,
    draftUsageCount,
    whereUsedLabel: entries.length ? `Используется: ${entries.length}` : "Пока не используется",
    archiveBlocked: entries.length > 0
  };
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

function buildMediaCardDto({ card, publishedRevision, usageEntries, binaryHealthy }) {
  const latestRevision = card.latestRevision;
  const payload = latestRevision?.payload ?? {};
  const usage = deriveUsageSummary(usageEntries);
  const statusKey = latestRevision?.state ?? "draft";
  const updatedAt = latestRevision?.updatedAt || card.entity.updatedAt || payload.uploadedAt || "";
  const uploadedAt = payload.uploadedAt || updatedAt || "";
  const warnings = buildWarnings(payload, binaryHealthy);

  return {
    id: card.entity.id,
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
    statusLabel: buildStateSummary(statusKey),
    payloadStatus: payload.status || "draft_asset",
    payloadStatusLabel: payload.status === "ready" ? "Метаданные собраны" : "Черновик ассета",
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
    whereUsedLabel: usage.whereUsedLabel,
    usageEntries: usage.entries.sort((left, right) => {
      const leftRank = left.statusKey === "published" ? 0 : 1;
      const rightRank = right.statusKey === "published" ? 0 : 1;

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return left.title.localeCompare(right.title, "ru");
    }),
    archiveBlocked: usage.archiveBlocked,
    publishedRevisionNumber: publishedRevision?.revisionNumber ?? null
  };
}

async function buildUsageIndex() {
  const index = new Map();

  for (const entityType of REFERENCE_TYPES) {
    const latestCards = await listEntityCards(entityType);
    const publishedCards = await listPublishedCards(entityType);
    const seenRevisionIds = new Set();

    for (const card of latestCards) {
      if (!card.latestRevision) {
        continue;
      }

      seenRevisionIds.add(card.latestRevision.id);
      collectUsageFromRevision(index, entityType, card.entity.id, card.latestRevision, card.latestRevision.state);
    }

    for (const published of publishedCards) {
      if (!published.revision || seenRevisionIds.has(published.revision.id)) {
        continue;
      }

      collectUsageFromRevision(index, entityType, published.entityId, published.revision, "published");
    }
  }

  return index;
}

async function buildPublishedMediaMap() {
  const publishedCards = await listPublishedCards(ENTITY_TYPES.MEDIA_ASSET);
  return new Map(publishedCards.map((card) => [card.entityId, card.revision]));
}

export async function listMediaLibraryCards({ includeBinaryProbe = true } = {}) {
  const cards = await listEntityCards(ENTITY_TYPES.MEDIA_ASSET);
  const usageIndex = await buildUsageIndex();
  const publishedMap = await buildPublishedMediaMap();

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

  const usageIndex = await buildUsageIndex();
  const publishedMap = await buildPublishedMediaMap();
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
    binaryHealthy
  });
}

export async function listMediaPickerOptions() {
  const items = await listMediaLibraryCards({ includeBinaryProbe: false });

  return items.map((item) => ({
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
    mineCount: items.filter((item) => item.uploadedBy && item.uploadedBy === currentUser?.username).length
  };
}
