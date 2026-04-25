import { ENTITY_TYPES } from "../content-core/content-types.js";

export const ENTITY_OPS_KINDS = Object.freeze({
  ENTITY: "entity",
  MEDIA: "media",
  DISPLAY_MODE: "display_mode",
  REMOVAL: "removal"
});

const SUPPORTED_ENTITY_MODES = new Set(["create", "update", "upsert", "delete"]);
const SUPPORTED_MEDIA_MODES = new Set(["create", "update", "upsert"]);
const SUPPORTED_DISPLAY_MODE_MODES = new Set(["set"]);
const SUPPORTED_REMOVAL_MODES = new Set(["mark", "unmark", "purge"]);
const SUPPORTED_ENTITY_TYPES = new Set(Object.values(ENTITY_TYPES));
const MULTILINE_LIST_FIELDS = new Set(["keySpecs", "usageScenarios", "equipmentSpecs"]);
const SEO_FIELD_KEYS = new Set([
  "metaTitle",
  "metaDescription",
  "canonicalIntent",
  "indexationFlag",
  "openGraphTitle",
  "openGraphDescription",
  "openGraphImageAssetId"
]);
const RESERVED_KEYS = new Set([
  "kind",
  "entityType",
  "mode",
  "match",
  "fields",
  "changeIntent",
  "creationOrigin",
  "label",
  "entityId",
  "filePath",
  "collectionIds",
  "collectionsTouched",
  "displayMode",
  "reason",
  "confirmPublishedOnly",
  "removalNote"
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.trim().toLowerCase() === "true";
  }

  return false;
}

function normalizeStringArray(values = []) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function parseJsonLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSONL entry on line ${index + 1}: ${error.message}`);
      }
    });
}

export function parseEntityOpsDocument(text, filePath = "") {
  const source = String(text ?? "").trim();

  if (!source) {
    throw new Error("Input file is empty.");
  }

  try {
    return JSON.parse(source);
  } catch (jsonError) {
    const looksLikeJsonl = filePath.toLowerCase().endsWith(".jsonl") || source.includes("\n");

    if (!looksLikeJsonl) {
      throw new Error(`Invalid JSON input: ${jsonError.message}`);
    }

    return parseJsonLines(source);
  }
}

function extractFields(rawItem) {
  if (isPlainObject(rawItem.fields)) {
    return { ...rawItem.fields };
  }

  return Object.fromEntries(
    Object.entries(rawItem).filter(([key]) => !RESERVED_KEYS.has(key))
  );
}

function normalizeEntityMatch(entityType, mode, rawMatch = {}, fields = {}, topLevelEntityId = "") {
  const explicitMatch = isPlainObject(rawMatch) ? rawMatch : {};
  const match = {
    entityId: String(explicitMatch.entityId ?? topLevelEntityId ?? "").trim(),
    slug: String(explicitMatch.slug ?? "").trim(),
    pageType: String(explicitMatch.pageType ?? "").trim()
  };

  if (!match.entityId && mode !== "create") {
    const derivedSlug = String(fields.slug ?? "").trim();
    const derivedPageType = entityType === ENTITY_TYPES.PAGE
      ? String(fields.pageType ?? "").trim()
      : "";

    if (derivedSlug) {
      match.slug = match.slug || derivedSlug;
    } else if (derivedPageType) {
      match.pageType = match.pageType || derivedPageType;
    }
  }

  if (match.entityId) {
    return { entityId: match.entityId };
  }

  if (match.slug) {
    return { slug: match.slug };
  }

  if (match.pageType) {
    return { pageType: match.pageType };
  }

  return {};
}

function normalizeMediaMatch(rawMatch = {}, topLevelEntityId = "") {
  const explicitMatch = isPlainObject(rawMatch) ? rawMatch : {};
  const entityId = String(explicitMatch.entityId ?? topLevelEntityId ?? "").trim();

  return entityId ? { entityId } : {};
}

function deriveLabel(kind, entityType, fields = {}, match = {}, rawItem = {}, index = 0) {
  if (kind === ENTITY_OPS_KINDS.DISPLAY_MODE) {
    return String(
      rawItem.label
      || rawItem.displayMode
      || `display-mode-${index + 1}`
    ).trim();
  }

  if (kind === ENTITY_OPS_KINDS.MEDIA) {
    return String(
      rawItem.label
      || fields.title
      || match.entityId
      || rawItem.filePath
      || `media-${index + 1}`
    ).trim();
  }

  return String(
    rawItem.label
    || fields.title
    || fields.slug
    || match.slug
    || match.pageType
    || match.entityId
    || `${entityType || kind}-${index + 1}`
  ).trim();
}

function normalizeEntityMutation(rawItem, index, options = {}) {
  const entityType = String(rawItem.entityType ?? options.defaultEntityType ?? "").trim();
  const mode = String(rawItem.mode ?? options.defaultMode ?? "upsert").trim().toLowerCase();
  const fields = extractFields(rawItem);

  if (!SUPPORTED_ENTITY_TYPES.has(entityType)) {
    throw new Error(`Unsupported entityType at index ${index}: ${entityType || "<empty>"}.`);
  }

  if (!SUPPORTED_ENTITY_MODES.has(mode)) {
    throw new Error(`Unsupported mode at index ${index}: ${mode || "<empty>"}.`);
  }

  const match = normalizeEntityMatch(entityType, mode, rawItem.match, fields, rawItem.entityId);

  if (mode !== "create" && !match.entityId && !match.slug && !match.pageType) {
    throw new Error(`Operation at index ${index} needs match.entityId, match.slug or match.pageType.`);
  }

  return {
    kind: ENTITY_OPS_KINDS.ENTITY,
    entityType,
    mode,
    match,
    fields,
    changeIntent: String(rawItem.changeIntent ?? options.defaultChangeIntent ?? "").trim(),
    creationOrigin: String(rawItem.creationOrigin ?? options.defaultCreationOrigin ?? "").trim(),
    label: deriveLabel(ENTITY_OPS_KINDS.ENTITY, entityType, fields, match, rawItem, index)
  };
}

function normalizeMediaOperation(rawItem, index, options = {}) {
  const mode = String(rawItem.mode ?? options.defaultMode ?? "upsert").trim().toLowerCase();
  const fields = extractFields(rawItem);
  const fieldCollectionIds = normalizeStringArray(fields.collectionIds);
  const fieldCollectionsTouched = normalizeBoolean(fields.collectionsTouched);

  delete fields.collectionIds;
  delete fields.collectionsTouched;

  if (!SUPPORTED_MEDIA_MODES.has(mode)) {
    throw new Error(`Unsupported media mode at index ${index}: ${mode || "<empty>"}.`);
  }

  const match = normalizeMediaMatch(rawItem.match, rawItem.entityId);
  const collectionIds = normalizeStringArray(rawItem.collectionIds).length > 0
    ? normalizeStringArray(rawItem.collectionIds)
    : fieldCollectionIds;
  const collectionsTouched = normalizeBoolean(rawItem.collectionsTouched) || fieldCollectionsTouched || collectionIds.length > 0;
  const filePath = String(rawItem.filePath ?? "").trim();

  if (mode !== "create" && !match.entityId) {
    throw new Error(`Media operation at index ${index} needs match.entityId or entityId.`);
  }

  return {
    kind: ENTITY_OPS_KINDS.MEDIA,
    entityType: ENTITY_TYPES.MEDIA_ASSET,
    mode,
    match,
    fields,
    filePath,
    collectionIds,
    collectionsTouched,
    changeIntent: String(rawItem.changeIntent ?? options.defaultChangeIntent ?? "").trim(),
    creationOrigin: String(rawItem.creationOrigin ?? options.defaultCreationOrigin ?? "").trim(),
    label: deriveLabel(ENTITY_OPS_KINDS.MEDIA, ENTITY_TYPES.MEDIA_ASSET, fields, match, rawItem, index)
  };
}

function normalizeDisplayModeOperation(rawItem, index) {
  const mode = String(rawItem.mode ?? "set").trim().toLowerCase();

  if (!SUPPORTED_DISPLAY_MODE_MODES.has(mode)) {
    throw new Error(`Unsupported display mode operation at index ${index}: ${mode || "<empty>"}.`);
  }

  const displayMode = String(rawItem.displayMode ?? "").trim();

  if (!displayMode) {
    throw new Error(`Display mode operation at index ${index} needs displayMode.`);
  }

  return {
    kind: ENTITY_OPS_KINDS.DISPLAY_MODE,
    entityType: "",
    mode,
    displayMode,
    reason: String(rawItem.reason ?? "").trim(),
    confirmPublishedOnly: normalizeBoolean(rawItem.confirmPublishedOnly),
    label: deriveLabel(ENTITY_OPS_KINDS.DISPLAY_MODE, "", {}, {}, rawItem, index)
  };
}

function normalizeRemovalOperation(rawItem, index, options = {}) {
  const entityType = String(rawItem.entityType ?? options.defaultEntityType ?? "").trim();
  const mode = String(rawItem.mode ?? options.defaultMode ?? "").trim().toLowerCase();

  if (!SUPPORTED_ENTITY_TYPES.has(entityType)) {
    throw new Error(`Unsupported entityType at index ${index}: ${entityType || "<empty>"}.`);
  }

  if (!SUPPORTED_REMOVAL_MODES.has(mode)) {
    throw new Error(`Unsupported removal mode at index ${index}: ${mode || "<empty>"}.`);
  }

  const match = normalizeEntityMatch(entityType, "update", rawItem.match, {}, rawItem.entityId);

  if (!match.entityId && !match.slug && !match.pageType) {
    throw new Error(`Removal operation at index ${index} needs match.entityId, match.slug or match.pageType.`);
  }

  return {
    kind: ENTITY_OPS_KINDS.REMOVAL,
    entityType,
    mode,
    match,
    removalNote: String(rawItem.removalNote ?? "").trim(),
    label: deriveLabel(ENTITY_OPS_KINDS.REMOVAL, entityType, {}, match, rawItem, index)
  };
}

export function normalizeEntityOperation(rawItem, index, options = {}) {
  if (!isPlainObject(rawItem)) {
    throw new Error(`Entity operation at index ${index} must be an object.`);
  }

  const kind = String(rawItem.kind ?? options.defaultKind ?? ENTITY_OPS_KINDS.ENTITY).trim().toLowerCase();

  if (kind === ENTITY_OPS_KINDS.ENTITY) {
    return normalizeEntityMutation(rawItem, index, options);
  }

  if (kind === ENTITY_OPS_KINDS.MEDIA) {
    return normalizeMediaOperation(rawItem, index, options);
  }

  if (kind === ENTITY_OPS_KINDS.DISPLAY_MODE) {
    return normalizeDisplayModeOperation(rawItem, index, options);
  }

  if (kind === ENTITY_OPS_KINDS.REMOVAL) {
    return normalizeRemovalOperation(rawItem, index, options);
  }

  throw new Error(`Unsupported operation kind at index ${index}: ${kind || "<empty>"}.`);
}

export function normalizeEntityOperations(rawDocument, options = {}) {
  const entries = Array.isArray(rawDocument)
    ? rawDocument
    : Array.isArray(rawDocument?.entities)
      ? rawDocument.entities
      : [rawDocument];

  return entries.map((entry, index) => normalizeEntityOperation(entry, index, options));
}

function appendScalar(formData, key, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (typeof value === "boolean") {
    formData.append(key, value ? "true" : "false");
    return;
  }

  if (typeof value === "number") {
    formData.append(key, String(value));
    return;
  }

  if (typeof value === "string") {
    formData.append(key, value);
    return;
  }

  throw new Error(`Field "${key}" must be a scalar or array of scalars.`);
}

export function buildEntitySaveFormData(operation, options = {}) {
  const formData = new FormData();

  formData.set("responseMode", "json");

  if (options.entityId) {
    formData.set("entityId", options.entityId);
  }

  if (operation.changeIntent) {
    formData.set("changeIntent", operation.changeIntent);
  }

  if (operation.creationOrigin) {
    formData.set("creationOrigin", operation.creationOrigin);
  }

  for (const [key, value] of Object.entries(operation.fields)) {
    if (Array.isArray(value)) {
      if (MULTILINE_LIST_FIELDS.has(key)) {
        appendScalar(formData, key, value.map((item) => String(item ?? "").trim()).filter(Boolean).join("\n"));
        continue;
      }

      for (const item of value) {
        appendScalar(formData, key, item);
      }
      continue;
    }

    if (isPlainObject(value)) {
      throw new Error(`Field "${key}" must be flattened before sending to the admin save route.`);
    }

    appendScalar(formData, key, value);
  }

  return formData;
}

export function buildMediaCreateFormData(operation, options = {}) {
  const formData = new FormData();

  if (options.file) {
    formData.set("file", options.file);
  }

  if (operation.changeIntent) {
    formData.set("changeIntent", operation.changeIntent);
  }

  if (operation.creationOrigin) {
    formData.set("creationOrigin", operation.creationOrigin);
  }

  for (const [key, value] of Object.entries(operation.fields)) {
    if (Array.isArray(value) || isPlainObject(value)) {
      throw new Error(`Media create field "${key}" must be a scalar value.`);
    }

    appendScalar(formData, key, value);
  }

  return formData;
}

export function buildMediaUpdateFormData(operation, options = {}) {
  const formData = new FormData();

  if (options.binaryFile) {
    formData.set("binary", options.binaryFile);
  }

  if (operation.changeIntent) {
    formData.set("changeIntent", operation.changeIntent);
  }

  for (const [key, value] of Object.entries(operation.fields)) {
    if (Array.isArray(value) || isPlainObject(value)) {
      throw new Error(`Media update field "${key}" must be a scalar value.`);
    }

    appendScalar(formData, key, value);
  }

  if (operation.collectionsTouched || operation.collectionIds.length > 0) {
    formData.set("collectionsTouched", "true");

    for (const collectionId of operation.collectionIds) {
      appendScalar(formData, "collectionIds", collectionId);
    }
  }

  return formData;
}

export function buildEntityDeleteFormData(operation) {
  const formData = new FormData();

  formData.set("responseMode", "json");

  if (operation.match.entityId) {
    formData.append("entityId", operation.match.entityId);
    return formData;
  }

  throw new Error("Delete mode requires an entityId-resolved match.");
}

export function buildDisplayModeFormData(operation, options = {}) {
  const formData = new FormData();

  formData.set("redirectTo", options.redirectTo || "/admin");
  formData.set("mode", operation.displayMode);
  formData.set("reason", operation.reason);

  if (operation.confirmPublishedOnly) {
    formData.set("confirmPublishedOnly", "true");
  }

  return formData;
}

export function buildRemovalActionFormData(operation, options = {}) {
  const formData = new FormData();

  formData.set("redirectTo", options.redirectTo || "/admin");
  formData.set("failureRedirectTo", options.failureRedirectTo || options.redirectTo || "/admin");

  if (operation.mode === "mark" && operation.removalNote) {
    formData.set("removalNote", operation.removalNote);
  }

  return formData;
}

export function buildRemovalPurgeFormData(operation) {
  if (!operation.match.entityId) {
    throw new Error("Removal purge requires an entityId-resolved match.");
  }

  const formData = new FormData();
  formData.set("responseMode", "json");
  formData.set("entityType", operation.entityType);
  formData.set("entityId", operation.match.entityId);
  return formData;
}

function normalizeComparable(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === undefined || value === null) {
    return "";
  }

  return String(value);
}

function getComparableCurrentValue(currentPayload = {}, key) {
  if (SEO_FIELD_KEYS.has(key)) {
    return currentPayload?.seo?.[key] ?? currentPayload?.[key];
  }

  return currentPayload?.[key];
}

export function buildFieldPreviewDiff(currentPayload = {}, nextFields = {}) {
  return Object.entries(nextFields).reduce((acc, [key, value]) => {
    const before = normalizeComparable(getComparableCurrentValue(currentPayload, key));
    const after = normalizeComparable(value);

    if (JSON.stringify(before) === JSON.stringify(after)) {
      return acc;
    }

    acc[key] = { before, after };
    return acc;
  }, {});
}
