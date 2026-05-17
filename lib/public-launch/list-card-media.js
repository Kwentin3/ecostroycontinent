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
  limit = 3
} = {}) {
  const maxItems = Number.isInteger(limit) && limit > 0 ? limit : 3;
  const fallbackAlt = cleanText(item?.title);
  const assets = [];
  const primaryMediaAssetId = cleanText(item?.primaryMediaAssetId);

  if (primaryMediaAssetId && typeof resolveMedia === "function") {
    assets.push(normalizeMediaAsset(resolveMedia(primaryMediaAssetId), fallbackAlt));
  }

  if (typeof resolveGallery === "function") {
    for (const galleryId of cleanList(item?.galleryIds)) {
      const gallery = resolveGallery(galleryId);
      const galleryAssets = Array.isArray(gallery?.assets) ? gallery.assets : [];

      for (const asset of galleryAssets) {
        assets.push(normalizeMediaAsset(asset, fallbackAlt));
      }
    }
  }

  if (typeof resolveEquipment === "function" && typeof resolveMedia === "function") {
    for (const equipmentId of cleanList(item?.equipmentIds)) {
      const equipment = resolveEquipment(equipmentId);
      const equipmentMediaId = cleanText(equipment?.primaryMediaAssetId);

      if (equipmentMediaId) {
        assets.push(normalizeMediaAsset(resolveMedia(equipmentMediaId), fallbackAlt));
      }
    }
  }

  return uniqueBy(
    assets.filter(Boolean),
    (asset) => asset.entityId || asset.previewUrl
  ).slice(0, maxItems);
}
