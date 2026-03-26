import { getTopLevelFieldsForEntityType } from "./schemas.js";
import { FIELD_LABELS, getBlockTypeLabel } from "../ui-copy.js";

function summarizeBlock(block) {
  if (!block) {
    return "—";
  }

  const pieces = [getBlockTypeLabel(block.type) || block.type];

  if (block.title) {
    pieces.push(block.title);
  }

  if (block.body && block.type !== "rich_text") {
    pieces.push(block.body);
  }

  if (block.ctaLabel) {
    pieces.push(`Кнопка: ${block.ctaLabel}`);
  }

  return pieces.join(" | ");
}

function summarizeValue(field, value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "—";
    }

    if (field === "blocks") {
      return value.map(summarizeBlock).join(" • ");
    }

    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

export function buildHumanReadableDiff(entityType, previousPayload, nextPayload, resolveTarget = null) {
  return getTopLevelFieldsForEntityType(entityType)
    .filter((field) => JSON.stringify(previousPayload?.[field] ?? null) !== JSON.stringify(nextPayload?.[field] ?? null))
    .map((field) => ({
      field,
      label: FIELD_LABELS[field] || field,
      before: summarizeValue(field, previousPayload?.[field] ?? null),
      after: summarizeValue(field, nextPayload?.[field] ?? null),
      previewTarget: typeof resolveTarget === "function" ? resolveTarget(field) : null
    }));
}
