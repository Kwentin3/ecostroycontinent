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

function normalizeMediaAsset(asset, fallbackAlt = "") {
  const previewUrl = cleanText(asset?.previewUrl);

  if (!previewUrl) {
    return null;
  }

  return {
    entityId: cleanText(asset?.entityId) || cleanText(asset?.id) || previewUrl,
    previewUrl,
    alt: cleanText(asset?.alt) || cleanText(asset?.title) || fallbackAlt
  };
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

export function buildListCardMediaAssets({
  item,
  resolveMedia,
  resolveGallery,
  resolveEquipment,
  resolveCase,
  limit = null
} = {}) {
  const fallbackAlt = cleanText(item?.title);
  const assets = [];

  const pushMediaById = (mediaId, alt = fallbackAlt) => {
    const normalizedMediaId = cleanText(mediaId);

    if (normalizedMediaId && typeof resolveMedia === "function") {
      assets.push(normalizeMediaAsset(resolveMedia(normalizedMediaId), alt));
    }
  };

  const pushGalleryAssets = (galleryIds, alt = fallbackAlt) => {
    if (typeof resolveGallery !== "function") {
      return;
    }

    for (const galleryId of cleanList(galleryIds)) {
      const gallery = resolveGallery(galleryId);
      const galleryAssets = Array.isArray(gallery?.assets) ? gallery.assets : [];

      for (const asset of galleryAssets) {
        assets.push(normalizeMediaAsset(asset, alt));
      }
    }
  };

  pushMediaById(item?.primaryMediaAssetId);
  pushGalleryAssets(item?.galleryIds);

  if (typeof resolveEquipment === "function") {
    for (const equipmentId of cleanList(item?.equipmentIds)) {
      const equipment = resolveEquipment(equipmentId);
      const equipmentAlt = cleanText(equipment?.title) || fallbackAlt;

      pushMediaById(equipment?.primaryMediaAssetId, equipmentAlt);
      pushGalleryAssets(equipment?.galleryIds, equipmentAlt);
    }
  }

  if (typeof resolveCase === "function") {
    for (const caseId of cleanList(item?.relatedCaseIds)) {
      const relatedCase = resolveCase(caseId);
      const caseAlt = cleanText(relatedCase?.title) || fallbackAlt;

      pushMediaById(relatedCase?.primaryMediaAssetId, caseAlt);
      pushGalleryAssets(relatedCase?.galleryIds, caseAlt);
    }
  }

  const uniqueAssets = uniqueBy(
    assets.filter(Boolean),
    (asset) => asset.entityId || asset.previewUrl
  );

  return Number.isInteger(limit) && limit > 0
    ? uniqueAssets.slice(0, limit)
    : uniqueAssets;
}
