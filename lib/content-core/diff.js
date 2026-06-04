import { getTopLevelFieldsForEntityType } from "./schemas.js";
import { FIELD_LABELS, getBlockTypeLabel } from "../ui-copy.js";

const EMPTY_VALUE = "—";
const INSERTION_MARK = "∅";
const OBJECT_ARRAY_FIELDS = new Set(["blocks", "sections"]);
const MEDIA_FIELDS = new Set(["primaryMediaAssetId", "primaryAssetId", "mediaAssetId", "storageKey", "openGraphImageAssetId"]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringifyComparable(value) {
  return JSON.stringify(value ?? null);
}

function getFieldLabel(field) {
  return FIELD_LABELS[field] || field;
}

function getDiffFields(entityType, previousPayload, nextPayload) {
  const fields = [...getTopLevelFieldsForEntityType(entityType)];

  if ((previousPayload?.seo || nextPayload?.seo) && !fields.includes("seo")) {
    fields.push("seo");
  }

  return fields;
}

function summarizeBlock(block, index = 0) {
  if (!block) {
    return `Блок ${index + 1}`;
  }

  const label = getBlockTypeLabel(block.type) || block.type || "Блок";
  const title = block.title || block.h1 || block.body || "";

  return title ? `${label}: ${String(title).slice(0, 80)}` : `${label} ${index + 1}`;
}

function summarizeValue(field, value) {
  if (value === null || value === undefined || value === "") {
    return EMPTY_VALUE;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return EMPTY_VALUE;
    }

    if (OBJECT_ARRAY_FIELDS.has(field)) {
      return value.map((item, index) => summarizeBlock(item, index)).join("\n");
    }

    return value.join(", ");
  }

  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort()
      .map((key) => `${getFieldLabel(key)}: ${summarizeValue(key, value[key])}`)
      .join("\n");
  }

  return String(value);
}

function buildTextParts(beforeValue, afterValue) {
  const before = String(beforeValue ?? "");
  const after = String(afterValue ?? "");
  let start = 0;

  while (start < before.length && start < after.length && before[start] === after[start]) {
    start += 1;
  }

  let beforeEnd = before.length;
  let afterEnd = after.length;

  while (beforeEnd > start && afterEnd > start && before[beforeEnd - 1] === after[afterEnd - 1]) {
    beforeEnd -= 1;
    afterEnd -= 1;
  }

  const contextSize = 56;
  const beforeContextStart = Math.max(0, start - contextSize);
  const afterContextStart = Math.max(0, start - contextSize);
  const beforeContextEnd = Math.min(before.length, beforeEnd + contextSize);
  const afterContextEnd = Math.min(after.length, afterEnd + contextSize);

  return {
    before: {
      prefix: `${beforeContextStart > 0 ? "…" : ""}${before.slice(beforeContextStart, start)}`,
      change: before.slice(start, beforeEnd) || INSERTION_MARK,
      suffix: `${before.slice(beforeEnd, beforeContextEnd)}${beforeContextEnd < before.length ? "…" : ""}`
    },
    after: {
      prefix: `${afterContextStart > 0 ? "…" : ""}${after.slice(afterContextStart, start)}`,
      change: after.slice(start, afterEnd) || INSERTION_MARK,
      suffix: `${after.slice(afterEnd, afterContextEnd)}${afterContextEnd < after.length ? "…" : ""}`
    }
  };
}

function buildListDetails(beforeValue, afterValue) {
  const before = Array.isArray(beforeValue) ? beforeValue.map(String) : [];
  const after = Array.isArray(afterValue) ? afterValue.map(String) : [];
  const beforeSet = new Set(before);
  const afterSet = new Set(after);
  const added = after.filter((item) => !beforeSet.has(item));
  const removed = before.filter((item) => !afterSet.has(item));
  const details = [];

  if (added.length > 0) {
    details.push(`Добавлено: ${added.join(", ")}`);
  }

  if (removed.length > 0) {
    details.push(`Удалено: ${removed.join(", ")}`);
  }

  return details;
}

function buildScalarRow({ field, label, beforeValue, afterValue, previewTarget }) {
  const before = summarizeValue(field, beforeValue);
  const after = summarizeValue(field, afterValue);
  const row = {
    field,
    label,
    before,
    after,
    previewTarget,
    summary: MEDIA_FIELDS.has(field) ? "Изображение или файл изменены." : "Изменено содержимое поля.",
    details: []
  };

  if (typeof beforeValue === "string" || typeof afterValue === "string") {
    const parts = buildTextParts(beforeValue ?? "", afterValue ?? "");
    row.beforeParts = parts.before;
    row.afterParts = parts.after;
    row.summary = "Изменен текст.";
  }

  if (Array.isArray(beforeValue) || Array.isArray(afterValue)) {
    row.details = buildListDetails(beforeValue, afterValue);
    row.summary = "Изменен список.";
  }

  return row;
}

function buildObjectRows({ field, beforeValue, afterValue, resolveTarget }) {
  const before = isPlainObject(beforeValue) ? beforeValue : {};
  const after = isPlainObject(afterValue) ? afterValue : {};
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  const fieldLabel = getFieldLabel(field);

  return keys
    .filter((key) => stringifyComparable(before[key]) !== stringifyComparable(after[key]))
    .map((key) => buildScalarRow({
      field: `${field}.${key}`,
      label: field === "seo" ? `SEO: ${getFieldLabel(key)}` : `${fieldLabel}: ${getFieldLabel(key)}`,
      beforeValue: before[key],
      afterValue: after[key],
      previewTarget: typeof resolveTarget === "function" ? resolveTarget(field) : null
    }));
}

function buildObjectArrayRows({ field, beforeValue, afterValue, resolveTarget }) {
  const before = Array.isArray(beforeValue) ? beforeValue : [];
  const after = Array.isArray(afterValue) ? afterValue : [];
  const length = Math.max(before.length, after.length);
  const rows = [];

  for (let index = 0; index < length; index += 1) {
    const beforeItem = before[index] ?? null;
    const afterItem = after[index] ?? null;
    const itemLabel = summarizeBlock(afterItem || beforeItem, index);
    const previewTarget = typeof resolveTarget === "function" ? resolveTarget(field) : null;

    if (!beforeItem || !afterItem) {
      rows.push({
        field: `${field}[${index}]`,
        label: `${getFieldLabel(field)}: ${itemLabel}`,
        before: summarizeValue(field, beforeItem),
        after: summarizeValue(field, afterItem),
        previewTarget,
        summary: beforeItem ? "Удален блок." : "Добавлен блок.",
        details: []
      });
      continue;
    }

    if (stringifyComparable(beforeItem) === stringifyComparable(afterItem)) {
      continue;
    }

    const keys = [...new Set([...Object.keys(beforeItem), ...Object.keys(afterItem)])]
      .filter((key) => key !== "order")
      .sort();

    for (const key of keys) {
      if (stringifyComparable(beforeItem[key]) === stringifyComparable(afterItem[key])) {
        continue;
      }

      rows.push(buildScalarRow({
        field: `${field}[${index}].${key}`,
        label: `${getFieldLabel(field)}: ${itemLabel} / ${getFieldLabel(key)}`,
        beforeValue: beforeItem[key],
        afterValue: afterItem[key],
        previewTarget
      }));
    }
  }

  return rows;
}

export function buildHumanReadableDiff(entityType, previousPayload, nextPayload, resolveTarget = null) {
  return getDiffFields(entityType, previousPayload, nextPayload)
    .flatMap((field) => {
      const beforeValue = previousPayload?.[field] ?? null;
      const afterValue = nextPayload?.[field] ?? null;

      if (stringifyComparable(beforeValue) === stringifyComparable(afterValue)) {
        return [];
      }

      if (OBJECT_ARRAY_FIELDS.has(field)) {
        return buildObjectArrayRows({ field, beforeValue, afterValue, resolveTarget });
      }

      if (isPlainObject(beforeValue) || isPlainObject(afterValue)) {
        return buildObjectRows({ field, beforeValue, afterValue, resolveTarget });
      }

      return [buildScalarRow({
        field,
        label: getFieldLabel(field),
        beforeValue,
        afterValue,
        previewTarget: typeof resolveTarget === "function" ? resolveTarget(field) : null
      })];
    });
}
