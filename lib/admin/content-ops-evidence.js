import { getEditorFieldAnchor } from "./editor-anchors.js";

export const EVIDENCE_CATEGORIES = Object.freeze({
  MISSING_PROOF: "missing proof",
  MISSING_MEDIA: "missing media",
  INVALID_REFS: "invalid refs",
  PUBLISH_OBLIGATIONS: "publish obligations",
  CONTACT_TRUTH_GAP: "contact truth gap",
  UNKNOWN: "unknown"
});

const PROOF_GAP_CODES = new Set([
  "missing_proof",
  "missing_proof_path",
  "missing_visual_proof",
  "empty_gallery"
]);

const MEDIA_GAP_CODES = new Set([
  "missing_storage_key",
  "missing_primary_media_ref",
  "missing_primary_asset_ref",
  "invalid_primary_media_ref",
  "invalid_primary_asset_ref",
  "unpublished_primary_media_ref",
  "unpublished_primary_asset_ref",
  "missing_alt",
  "missing_ownership_note"
]);

const INVALID_REF_CODES = new Set([
  "invalid_asset_refs",
  "invalid_case_refs",
  "invalid_gallery_refs",
  "invalid_service_refs",
  "unpublished_asset_refs",
  "unpublished_case_refs",
  "unpublished_gallery_refs",
  "unpublished_service_refs",
  "slug_collision",
  "page_type_collision"
]);

const CONTACT_TRUTH_CODES = new Set([
  "contact_truth_unconfirmed",
  "contacts_truth_unconfirmed",
  "contacts_missing_phone",
  "contacts_missing_service_area",
  "missing_primary_phone",
  "missing_service_area"
]);

const PUBLISH_OBLIGATION_CODES = new Set([
  "missing_brand_name",
  "missing_legal_name",
  "missing_slug",
  "missing_service_minimum",
  "missing_case_minimum",
  "missing_page_basics",
  "missing_cta",
  "open_publish_obligations",
  "about_slug_fixed",
  "contacts_slug_fixed"
]);

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function countBy(items, selector) {
  return items.reduce((counts, item) => {
    const key = selector(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function classifyReadinessCode(code) {
  if (!hasText(code)) {
    return EVIDENCE_CATEGORIES.UNKNOWN;
  }

  if (PROOF_GAP_CODES.has(code)) {
    return EVIDENCE_CATEGORIES.MISSING_PROOF;
  }

  if (MEDIA_GAP_CODES.has(code) || code.includes("media") || code.includes("asset")) {
    return EVIDENCE_CATEGORIES.MISSING_MEDIA;
  }

  if (INVALID_REF_CODES.has(code) || code.includes("collision") || code.includes("invalid_") || code.includes("unpublished_")) {
    return EVIDENCE_CATEGORIES.INVALID_REFS;
  }

  if (CONTACT_TRUTH_CODES.has(code)) {
    return EVIDENCE_CATEGORIES.CONTACT_TRUTH_GAP;
  }

  if (PUBLISH_OBLIGATION_CODES.has(code)) {
    return EVIDENCE_CATEGORIES.PUBLISH_OBLIGATIONS;
  }

  return EVIDENCE_CATEGORIES.PUBLISH_OBLIGATIONS;
}

function buildReadinessEvidenceItem({ entityType, entityId, result }) {
  const anchor = getEditorFieldAnchor(entityType, result?.field ?? null);

  return {
    entityId: entityId ?? null,
    entityType,
    code: result?.code ?? "unknown",
    severity: result?.severity ?? "info",
    field: result?.field ?? null,
    reason: result?.message ?? "",
    category: classifyReadinessCode(result?.code),
    source: "readiness",
    anchor,
    isFallbackAnchor: anchor.isFallback
  };
}

function buildObligationEvidenceItem({ entityType, entityId, obligation }) {
  const anchor = getEditorFieldAnchor(entityType, null);
  const status = obligation?.status ?? "open";

  return {
    entityId: entityId ?? null,
    entityType,
    code: obligation?.obligationType ? `publish_obligation:${obligation.obligationType}` : "publish_obligation:unknown",
    severity: status === "completed" ? "info" : "blocking",
    field: null,
    reason: obligation?.payload?.reason || `Открытое обязательство публикации: ${obligation?.obligationType ?? "unknown"}`,
    category: EVIDENCE_CATEGORIES.PUBLISH_OBLIGATIONS,
    source: "obligation",
    anchor,
    isFallbackAnchor: true,
    obligationType: obligation?.obligationType ?? null,
    status
  };
}

function determineEvidenceState(items, hasReadinessProjection) {
  if (!hasReadinessProjection && items.length === 0) {
    return "missing";
  }

  if (!hasReadinessProjection && items.length === 1 && items[0]?.source === "projection") {
    return "missing";
  }

  if (items.some((item) => item.severity === "blocking")) {
    return "blocked";
  }

  if (items.length > 0) {
    return "partial";
  }

  return "ready";
}

export function isProofGapCategory(category) {
  return category === EVIDENCE_CATEGORIES.MISSING_PROOF || category === EVIDENCE_CATEGORIES.MISSING_MEDIA;
}

export function buildEvidenceProjection({ entityType, entityId = null, readiness = null, obligations = [] } = {}) {
  const readinessResults = Array.isArray(readiness?.results) ? readiness.results : [];
  const evidenceItems = readinessResults.map((result) =>
    buildReadinessEvidenceItem({ entityType, entityId, result })
  );
  const openObligations = Array.isArray(obligations) ? obligations.filter((obligation) => obligation?.status !== "completed") : [];

  for (const obligation of openObligations) {
    evidenceItems.push(buildObligationEvidenceItem({ entityType, entityId, obligation }));
  }

  if (!readiness && evidenceItems.length === 0) {
    const anchor = getEditorFieldAnchor(entityType, null);
    evidenceItems.push({
      entityId,
      entityType,
      code: "missing_readiness_projection",
      severity: "info",
      field: null,
      reason: "Проекция готовности недоступна.",
      category: EVIDENCE_CATEGORIES.UNKNOWN,
      source: "projection",
      anchor,
      isFallbackAnchor: true
    });
  }

  const counts = {
    severity: countBy(evidenceItems, (item) => item.severity),
    category: countBy(evidenceItems, (item) => item.category)
  };

  return {
    entityId,
    entityType,
    state: determineEvidenceState(evidenceItems, Boolean(readiness)),
    summary: evidenceItems[0]?.reason || "Пробелов в доказательствах не найдено.",
    items: evidenceItems,
    counts
  };
}
