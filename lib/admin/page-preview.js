import { buildPageWorkspaceLookupResolvers } from "./page-workspace.js";

function inferEntityId(record = {}) {
  if (typeof record?.entityId === "string" && record.entityId.length > 0) {
    return record.entityId;
  }

  if (typeof record?.id === "string" && record.id.length > 0) {
    return record.id;
  }

  return "";
}

function normalizeEntityRecord(input = null) {
  if (!input || typeof input !== "object") {
    return null;
  }

  if (input.entity?.id && input.latestRevision?.payload) {
    return {
      entityId: input.entity.id,
      revisionId: input.latestRevision.id,
      ...input.latestRevision.payload
    };
  }

  const entityId = inferEntityId(input);

  if (!entityId) {
    return null;
  }

  return {
    ...input,
    entityId
  };
}

function normalizeMediaRecord(input = null) {
  if (!input || typeof input !== "object") {
    return null;
  }

  if (input.entity?.id && input.latestRevision?.payload) {
    const payload = input.latestRevision.payload || {};

    return {
      entityId: input.entity.id,
      revisionId: input.latestRevision.id,
      ...payload,
      previewUrl: input.previewUrl || (payload.storageKey ? `/api/admin/media/${input.entity.id}/preview` : payload.previewUrl || "")
    };
  }

  if (typeof input.id === "string" && (Object.hasOwn(input, "previewUrl") || Object.hasOwn(input, "alt") || Object.hasOwn(input, "originalFilename"))) {
    return {
      entityId: input.id,
      id: input.id,
      title: input.title || "",
      alt: input.alt || "",
      caption: input.caption || "",
      originalFilename: input.originalFilename || "",
      previewUrl: input.previewUrl || ""
    };
  }

  const entityId = inferEntityId(input);

  if (!entityId) {
    return null;
  }

  return {
    ...input,
    entityId
  };
}

function collectRecordMap(source, normalizer) {
  const map = new Map();

  if (source instanceof Map) {
    for (const [key, value] of source.entries()) {
      const record = normalizer(value);
      const entityId = inferEntityId(record) || key;

      if (entityId && record) {
        map.set(entityId, { ...record, entityId });
      }
    }

    return map;
  }

  if (Array.isArray(source)) {
    for (const item of source) {
      const record = normalizer(item);
      const entityId = inferEntityId(record);

      if (entityId && record) {
        map.set(entityId, record);
      }
    }

    return map;
  }

  if (source && typeof source === "object") {
    for (const [key, value] of Object.entries(source)) {
      const record = normalizer(value);
      const entityId = inferEntityId(record) || key;

      if (entityId && record) {
        map.set(entityId, { ...record, entityId });
      }
    }
  }

  return map;
}

function mergeMaps(baseMap, overlayMap) {
  const next = new Map(baseMap);

  for (const [entityId, record] of overlayMap.entries()) {
    if (entityId) {
      next.set(entityId, record);
    }
  }

  return next;
}

function normalizeGalleryRecord(input, mediaMap) {
  const record = normalizeEntityRecord(input);

  if (!record) {
    return null;
  }

  const assets = Array.isArray(record.assets) && record.assets.length > 0
    ? record.assets.map((asset) => normalizeMediaRecord(asset)).filter(Boolean)
    : (record.assetIds || []).map((assetId) => mediaMap.get(assetId)).filter(Boolean);

  return {
    ...record,
    assets
  };
}

function mapToObject(map) {
  return Object.fromEntries([...map.entries()]);
}

export function buildPagePreviewLookupRecords({
  publishedLookupRecords = {},
  services = [],
  equipment = [],
  cases = [],
  galleries = [],
  media = []
} = {}) {
  const serviceMap = mergeMaps(
    collectRecordMap(publishedLookupRecords.serviceMap ?? publishedLookupRecords.services, normalizeEntityRecord),
    collectRecordMap(services, normalizeEntityRecord)
  );
  const equipmentMap = mergeMaps(
    collectRecordMap(publishedLookupRecords.equipmentMap ?? publishedLookupRecords.equipment, normalizeEntityRecord),
    collectRecordMap(equipment, normalizeEntityRecord)
  );
  const caseMap = mergeMaps(
    collectRecordMap(publishedLookupRecords.caseMap ?? publishedLookupRecords.cases, normalizeEntityRecord),
    collectRecordMap(cases, normalizeEntityRecord)
  );
  const mediaMap = mergeMaps(
    collectRecordMap(publishedLookupRecords.mediaMap ?? publishedLookupRecords.mediaAssets ?? publishedLookupRecords.media, normalizeMediaRecord),
    collectRecordMap(media, normalizeMediaRecord)
  );
  const rawGalleryMap = mergeMaps(
    collectRecordMap(publishedLookupRecords.galleryMap ?? publishedLookupRecords.galleries, normalizeEntityRecord),
    collectRecordMap(galleries, normalizeEntityRecord)
  );
  const galleryMap = new Map(
    [...rawGalleryMap.entries()]
      .map(([entityId, record]) => [entityId, normalizeGalleryRecord(record, mediaMap)])
      .filter(([, record]) => Boolean(record))
  );

  return {
    services: [...serviceMap.values()],
    equipment: [...equipmentMap.values()],
    cases: [...caseMap.values()],
    galleries: [...galleryMap.values()],
    media: [...mediaMap.values()],
    serviceMap,
    equipmentMap,
    caseMap,
    galleryMap,
    mediaMap
  };
}

export function serializePagePreviewLookupRecords(input = {}) {
  const records = buildPagePreviewLookupRecords(input);

  return {
    services: mapToObject(records.serviceMap),
    equipment: mapToObject(records.equipmentMap),
    cases: mapToObject(records.caseMap),
    galleries: mapToObject(records.galleryMap),
    media: mapToObject(records.mediaMap)
  };
}

export function buildPagePreviewContext({ globalSettings = null, previewLookupRecords = {} } = {}) {
  const records = buildPagePreviewLookupRecords(previewLookupRecords);

  return {
    globalSettings,
    previewLookupRecords: records,
    lookupResolvers: buildPageWorkspaceLookupResolvers(records)
  };
}
