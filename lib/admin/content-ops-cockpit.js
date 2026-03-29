import { ENTITY_TYPE_LABELS, ENTITY_TYPES } from "../content-core/content-types.js";
import { buildEvidenceProjection } from "./content-ops-evidence.js";
import { getEditorFieldAnchor } from "./editor-anchors.js";
import { buildListBadgeProjection } from "./list-badges.js";

export const FIRST_SLICE_ENTITY_TYPES = Object.freeze([
  ENTITY_TYPES.GLOBAL_SETTINGS,
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.CASE,
  ENTITY_TYPES.PAGE,
  ENTITY_TYPES.MEDIA_ASSET,
  ENTITY_TYPES.GALLERY
]);

function normalizeSnapshotList(input = {}) {
  if (Array.isArray(input.entities)) {
    return input.entities.filter(Boolean);
  }

  const snapshots = [];

  const addOne = (value) => {
    if (value) {
      snapshots.push(value);
    }
  };

  const addMany = (value) => {
    if (Array.isArray(value)) {
      snapshots.push(...value.filter(Boolean));
    } else if (value) {
      snapshots.push(value);
    }
  };

  addOne(input.globalSettings);
  addOne(input.global_settings);
  addMany(input.services ?? input.service);
  addMany(input.cases ?? input.case);
  addMany(input.pages ?? input.page);
  addMany(input.mediaAssets ?? input.media_asset ?? input.mediaAsset);
  addMany(input.galleries ?? input.gallery);

  return snapshots;
}

function getSnapshotLabel(snapshot) {
  return snapshot?.label || snapshot?.title || snapshot?.h1 || snapshot?.publicBrandName || snapshot?.slug || snapshot?.entityId || "Untitled";
}

function mapCoverageStatus(badgeState) {
  if (badgeState === "proof_gap") {
    return "needs_proof";
  }

  return badgeState;
}

function selectPrimaryActionAnchor(evidenceProjection, entityType) {
  const actionableItem = evidenceProjection.items.find((item) => item.field) ?? evidenceProjection.items[0] ?? null;

  if (actionableItem?.anchor) {
    return actionableItem.anchor;
  }

  return getEditorFieldAnchor(entityType, null);
}

export function buildContentOpsEntityProjection(snapshot = {}) {
  const entityType = snapshot.entityType ?? null;
  const entityId = snapshot.entityId ?? snapshot.id ?? null;
  const entityExists = snapshot.entityExists ?? Boolean(entityId);
  const readiness = snapshot.readiness ?? null;
  const obligations = Array.isArray(snapshot.obligations) ? snapshot.obligations : [];
  const evidence = buildEvidenceProjection({
    entityType,
    entityId,
    readiness,
    obligations
  });
  const badge = buildListBadgeProjection({
    entityExists,
    readiness,
    evidenceProjection: evidence
  });
  const primaryActionAnchor = selectPrimaryActionAnchor(evidence, entityType);

  return {
    entityType,
    entityId,
    label: getSnapshotLabel(snapshot),
    status: mapCoverageStatus(badge.state),
    badge,
    evidence,
    primaryActionAnchor,
    fallbackAnchorUsed: Boolean(primaryActionAnchor?.isFallback),
    hasDraftRevision: Boolean(snapshot.hasDraftRevision ?? snapshot.latestRevision ?? snapshot.currentRevision),
    hasPublishedRevision: Boolean(snapshot.hasPublishedRevision ?? snapshot.activePublishedRevision ?? snapshot.activePublishedRevisionId),
    isSingleton: Boolean(snapshot.isSingleton)
  };
}

function buildCoverageGroup(entityType, rows) {
  const readyCount = rows.filter((row) => row.status === "ready").length;
  const blockedCount = rows.filter((row) => row.status === "blocked").length;
  const needsProofCount = rows.filter((row) => row.status === "needs_proof").length;
  const partialCount = rows.filter((row) => row.status === "partial").length;
  const missingRowCount = rows.filter((row) => row.status === "missing").length;
  const isCoverageEmpty = rows.length === 0;

  let status = "ready";

  if (isCoverageEmpty) {
    status = "missing";
  } else if (blockedCount > 0) {
    status = "blocked";
  } else if (needsProofCount > 0) {
    status = "needs_proof";
  } else if (partialCount > 0 || missingRowCount > 0) {
    status = "partial";
  }

  const reason = isCoverageEmpty
    ? "Coverage has not been established yet."
    : rows.find((row) => row.status !== "ready")?.badge?.reason || "No blocking gaps projected.";

  return {
    entityType,
    label: ENTITY_TYPE_LABELS[entityType] ?? entityType,
    status,
    total: rows.length,
    readyCount,
    blockedCount,
    needsProofCount,
    partialCount,
    missingRowCount,
    isCoverageEmpty,
    reason,
    rows
  };
}

function buildSummary(coverage) {
  return {
    ready: coverage.filter((group) => group.status === "ready").length,
    blocked: coverage.filter((group) => group.status === "blocked").length,
    needsProof: coverage.filter((group) => group.status === "needs_proof").length,
    partial: coverage.filter((group) => group.status === "partial").length,
    missing: coverage.filter((group) => group.status === "missing").length,
    total: coverage.length
  };
}

export function buildContentOpsCockpitProjection(input = {}) {
  const snapshots = normalizeSnapshotList(input);
  const supportedRows = [];
  const unsupportedRows = [];

  for (const snapshot of snapshots) {
    const row = buildContentOpsEntityProjection(snapshot);

    if (FIRST_SLICE_ENTITY_TYPES.includes(row.entityType)) {
      supportedRows.push(row);
    } else {
      unsupportedRows.push(row);
    }
  }

  const coverage = FIRST_SLICE_ENTITY_TYPES.map((entityType) => {
    const rows = supportedRows.filter((row) => row.entityType === entityType);
    return buildCoverageGroup(entityType, rows);
  });

  return {
    summary: buildSummary(coverage),
    coverage,
    rows: supportedRows,
    unsupportedRows
  };
}

export { buildEvidenceProjection } from "./content-ops-evidence.js";
export { buildListBadgeProjection } from "./list-badges.js";
