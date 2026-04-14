import { ENTITY_TYPES } from "../content-core/content-types.js";

const SUPPORTED_MODES = new Set(["create", "update", "upsert"]);
const SUPPORTED_ENTITY_TYPES = new Set(Object.values(ENTITY_TYPES));
const RESERVED_KEYS = new Set([
  "entityType",
  "mode",
  "match",
  "fields",
  "changeIntent",
  "creationOrigin",
  "label",
  "entityId"
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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

function normalizeMatch(entityType, mode, rawMatch = {}, fields = {}, topLevelEntityId = "") {
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

function deriveLabel(entityType, fields = {}, match = {}, index = 0) {
  return String(
    fields.title
    || fields.slug
    || match.slug
    || match.pageType
    || match.entityId
    || `${entityType}-${index + 1}`
  ).trim();
}

export function normalizeEntityOperation(rawItem, index, options = {}) {
  if (!isPlainObject(rawItem)) {
    throw new Error(`Entity operation at index ${index} must be an object.`);
  }

  const entityType = String(rawItem.entityType ?? options.defaultEntityType ?? "").trim();
  const mode = String(rawItem.mode ?? options.defaultMode ?? "upsert").trim().toLowerCase();
  const fields = extractFields(rawItem);

  if (!SUPPORTED_ENTITY_TYPES.has(entityType)) {
    throw new Error(`Unsupported entityType at index ${index}: ${entityType || "<empty>"}.`);
  }

  if (!SUPPORTED_MODES.has(mode)) {
    throw new Error(`Unsupported mode at index ${index}: ${mode || "<empty>"}.`);
  }

  const match = normalizeMatch(entityType, mode, rawItem.match, fields, rawItem.entityId);

  if (mode !== "create" && !match.entityId && !match.slug && !match.pageType) {
    throw new Error(`Operation at index ${index} needs match.entityId, match.slug or match.pageType.`);
  }

  return {
    entityType,
    mode,
    match,
    fields,
    changeIntent: String(rawItem.changeIntent ?? options.defaultChangeIntent ?? "").trim(),
    creationOrigin: String(rawItem.creationOrigin ?? options.defaultCreationOrigin ?? "").trim(),
    label: String(rawItem.label ?? deriveLabel(entityType, fields, match, index)).trim()
  };
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

export function buildFieldPreviewDiff(currentPayload = {}, nextFields = {}) {
  return Object.entries(nextFields).reduce((acc, [key, value]) => {
    const before = normalizeComparable(currentPayload?.[key]);
    const after = normalizeComparable(value);

    if (JSON.stringify(before) === JSON.stringify(after)) {
      return acc;
    }

    acc[key] = { before, after };
    return acc;
  }, {});
}
