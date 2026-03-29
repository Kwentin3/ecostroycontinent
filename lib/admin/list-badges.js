import { isProofGapCategory } from "./content-ops-evidence.js";

const BADGE_LABELS = Object.freeze({
  ready: "Ready",
  blocked: "Blocked",
  proof_gap: "Proof gap",
  partial: "Partial",
  missing: "Missing"
});

const BADGE_TONES = Object.freeze({
  ready: "success",
  blocked: "danger",
  proof_gap: "warning",
  partial: "neutral",
  missing: "muted"
});

function countReadiness(readiness) {
  const results = Array.isArray(readiness?.results) ? readiness.results : [];

  return {
    blocking: results.filter((result) => result.severity === "blocking").length,
    warning: results.filter((result) => result.severity === "warning").length,
    info: results.filter((result) => result.severity === "info").length,
    total: results.length
  };
}

function firstReason(readiness, evidenceProjection, fallbackReason) {
  if (Array.isArray(readiness?.results)) {
    const blocking = readiness.results.find((result) => result.severity === "blocking");
    if (blocking?.message) {
      return blocking.message;
    }

    const warning = readiness.results.find((result) => result.severity === "warning");
    if (warning?.message) {
      return warning.message;
    }

    const info = readiness.results.find((result) => result.severity === "info");
    if (info?.message) {
      return info.message;
    }
  }

  const evidenceReason = evidenceProjection?.items?.[0]?.reason;

  return evidenceReason || fallbackReason;
}

export function buildListBadgeProjection({
  entityExists = true,
  readiness = null,
  evidenceProjection = null
} = {}) {
  const readinessCounts = countReadiness(readiness);
  const evidenceItems = Array.isArray(evidenceProjection?.items) ? evidenceProjection.items : [];
  const proofGapCount = evidenceItems.filter((item) => isProofGapCategory(item.category)).length;

  if (!entityExists) {
    return {
      state: "missing",
      label: BADGE_LABELS.missing,
      tone: BADGE_TONES.missing,
      reason: "Entity snapshot is missing.",
      counts: {
        ...readinessCounts,
        evidence: evidenceItems.length,
        proofGap: proofGapCount
      }
    };
  }

  if (readinessCounts.blocking > 0) {
    return {
      state: "blocked",
      label: BADGE_LABELS.blocked,
      tone: BADGE_TONES.blocked,
      reason: firstReason(readiness, evidenceProjection, "Blocking readiness items exist."),
      counts: {
        ...readinessCounts,
        evidence: evidenceItems.length,
        proofGap: proofGapCount
      }
    };
  }

  if (proofGapCount > 0) {
    return {
      state: "proof_gap",
      label: BADGE_LABELS.proof_gap,
      tone: BADGE_TONES.proof_gap,
      reason: firstReason(readiness, evidenceProjection, "Proof evidence is still missing."),
      counts: {
        ...readinessCounts,
        evidence: evidenceItems.length,
        proofGap: proofGapCount
      }
    };
  }

  if (!readiness) {
    return {
      state: "partial",
      label: BADGE_LABELS.partial,
      tone: BADGE_TONES.partial,
      reason: "Readiness projection is unavailable.",
      counts: {
        ...readinessCounts,
        evidence: evidenceItems.length,
        proofGap: proofGapCount
      }
    };
  }

  if (readinessCounts.warning > 0 || readinessCounts.info > 0 || evidenceItems.length > 0) {
    return {
      state: "partial",
      label: BADGE_LABELS.partial,
      tone: BADGE_TONES.partial,
      reason: firstReason(readiness, evidenceProjection, "Projection is incomplete."),
      counts: {
        ...readinessCounts,
        evidence: evidenceItems.length,
        proofGap: proofGapCount
      }
    };
  }

  return {
    state: "ready",
    label: BADGE_LABELS.ready,
    tone: BADGE_TONES.ready,
    reason: "No blocking gaps projected.",
    counts: {
      ...readinessCounts,
      evidence: evidenceItems.length,
      proofGap: proofGapCount
    }
  };
}

