function cleanText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function cleanList(value) {
  if (!Array.isArray(value)) {
    const singleValue = cleanText(value);
    return singleValue ? [singleValue] : [];
  }

  return value
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function uniqueBy(items, getKey) {
  const seen = new Set();
  const list = [];

  for (const item of items) {
    const key = getKey(item);

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    list.push(item);
  }

  return list;
}

function normalizeMediaAsset(asset, fallbackAlt = "") {
  const previewUrl = cleanText(asset?.previewUrl);

  if (!previewUrl) {
    return null;
  }

  return {
    entityId: cleanText(asset?.entityId) || cleanText(asset?.id) || previewUrl,
    previewUrl,
    alt: cleanText(asset?.alt) || cleanText(asset?.title) || fallbackAlt,
    caption: cleanText(asset?.caption) || cleanText(asset?.title) || cleanText(asset?.originalFilename)
  };
}

function resolvePrimaryMedia(equipment, resolveMedia, fallbackAlt) {
  const primaryMediaAssetId = cleanText(equipment?.primaryMediaAssetId);

  if (!primaryMediaAssetId || typeof resolveMedia !== "function") {
    return null;
  }

  return normalizeMediaAsset(resolveMedia(primaryMediaAssetId), fallbackAlt);
}

function resolveGalleryMedia(equipment, resolveGallery, fallbackAlt) {
  const galleryIds = cleanList(equipment?.galleryIds);

  if (galleryIds.length === 0 || typeof resolveGallery !== "function") {
    return [];
  }

  const assets = galleryIds.flatMap((galleryId) => {
    const gallery = resolveGallery(galleryId);
    return Array.isArray(gallery?.assets) ? gallery.assets : [];
  });

  return uniqueBy(
    assets.map((asset) => normalizeMediaAsset(asset, fallbackAlt)).filter(Boolean),
    (asset) => asset.entityId || asset.previewUrl
  );
}

function resolveAction({ ctaAction, ctaLabel }) {
  const href = cleanText(ctaAction?.href);
  const label = cleanText(ctaLabel) || cleanText(ctaAction?.label);

  if (!href || !label) {
    return null;
  }

  return {
    ...ctaAction,
    href,
    label
  };
}

export function buildEquipmentCardModel({
  equipment,
  resolveMedia,
  resolveGallery,
  ctaAction,
  ctaLabel
} = {}) {
  const title = cleanText(equipment?.title);
  const equipmentType = cleanText(equipment?.equipmentType);
  const capabilitySummary = cleanText(equipment?.capabilitySummary);
  const shortSummary = cleanText(equipment?.shortSummary);
  const summary = capabilitySummary || shortSummary || equipmentType;
  const keySpecs = cleanList(equipment?.keySpecs);
  const usageScenarios = cleanList(equipment?.usageScenarios);
  const operatorMode = cleanText(equipment?.operatorMode);
  const fallbackAlt = title || equipmentType;

  if (!title && !summary) {
    return null;
  }

  const primaryMedia = resolvePrimaryMedia(equipment, resolveMedia, fallbackAlt);
  const galleryAssets = resolveGalleryMedia(equipment, resolveGallery, fallbackAlt)
    .filter((asset) => asset.previewUrl !== primaryMedia?.previewUrl);
  const action = resolveAction({ ctaAction, ctaLabel });

  return {
    key: cleanText(equipment?.entityId) || cleanText(equipment?.slug) || title || equipmentType,
    title,
    equipmentType,
    summary,
    operatorMode,
    keySpecs,
    usageScenarios,
    primaryMedia,
    galleryAssets,
    action,
    hasDetails: keySpecs.length > 0 || usageScenarios.length > 0 || Boolean(operatorMode)
  };
}

export function buildEquipmentCardsSectionModel({
  equipmentRecords = [],
  resolveMedia,
  resolveGallery,
  ctaAction,
  ctaLabel
} = {}) {
  if (!Array.isArray(equipmentRecords) || equipmentRecords.length === 0) {
    return null;
  }

  const cards = equipmentRecords
    .map((equipment) => buildEquipmentCardModel({
      equipment,
      resolveMedia,
      resolveGallery,
      ctaAction,
      ctaLabel
    }))
    .filter(Boolean);

  return cards.length > 0 ? { cards } : null;
}
