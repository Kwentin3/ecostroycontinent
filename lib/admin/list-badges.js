import { isProofGapCategory } from "./content-ops-evidence.js";

const BADGE_LABELS = Object.freeze({
  ready: "Готово",
  blocked: "Заблокировано",
  proof_gap: "Нужны доказательства",
  partial: "Частично",
  missing: "Нет версии"
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
      reason: "Снимок сущности ещё не собран.",
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
      reason: firstReason(readiness, evidenceProjection, "Есть блокирующие замечания."),
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
      reason: firstReason(readiness, evidenceProjection, "Доказательства ещё не собраны."),
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
      reason: "Проверка готовности ещё не считана.",
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
      reason: firstReason(readiness, evidenceProjection, "Проверка ещё не завершена."),
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
    reason: "Блокирующих пробелов не видно.",
    counts: {
      ...readinessCounts,
      evidence: evidenceItems.length,
      proofGap: proofGapCount
    }
  };
}
