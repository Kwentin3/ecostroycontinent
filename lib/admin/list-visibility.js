import { buildEvidenceProjection } from "./content-ops-evidence.js";
import { buildListBadgeProjection } from "./list-badges.js";
import { appendAdminReturnTo } from "./relation-navigation.js";
import { getEntityTypeLabel, getRevisionStateLabel } from "../ui-copy.js";

const SIGNAL_META = Object.freeze({
  ready: {
    label: "Готово",
    tone: "healthy",
    actionLabel: "Открыть"
  },
  blocked: {
    label: "Заблокировано",
    tone: "danger",
    actionLabel: "Исправить"
  },
  proof_gap: {
    label: "Нужны доказательства",
    tone: "warning",
    actionLabel: "Добавить доказательства"
  },
  partial: {
    label: "Частично",
    tone: "warning",
    actionLabel: "Досмотреть"
  },
  missing: {
    label: "Нет версии",
    tone: "warning",
    actionLabel: "Открыть"
  },
  inactive: {
    label: "Вне live",
    tone: "warning",
    actionLabel: "Открыть"
  },
  neutral: {
    label: "Проверить",
    tone: "unknown",
    actionLabel: "Открыть"
  }
});

const SIGNAL_REASON_COPY = Object.freeze({
  "No blocking gaps projected.": "Блокирующих gaps не видно.",
  "Readiness projection is unavailable.": "Готовность ещё не посчитана.",
  "Proof evidence is still missing.": "Доказательства ещё не собраны.",
  "Projection is incomplete.": "Проверка ещё не завершена.",
  "Entity snapshot is missing.": "Снимок сущности ещё не собран.",
  "Coverage has not been established yet.": "Покрытие ещё не собрано.",
  "No evidence gaps detected.": "Пробелов в доказательствах не видно.",
  "Evidence not fully available yet.": "Доказательства ещё не собраны полностью.",
  "Projection is incomplete or unavailable.": "Сигнал ещё не собран полностью."
});

const SIGNAL_PRIORITY = Object.freeze({
  blocked: 0,
  proof_gap: 1,
  partial: 2,
  missing: 3,
  inactive: 4,
  ready: 5,
  neutral: 6
});

function labelFromPayload(payload = {}) {
  return (
    payload?.title ||
    payload?.h1 ||
    payload?.publicBrandName ||
    payload?.slug ||
    payload?.originalFilename ||
    null
  );
}

function getSignalMeta(state) {
  return SIGNAL_META[state] || SIGNAL_META.neutral;
}

function localizeReason(reason) {
  if (!reason) {
    return "Сигнал не удалось вычислить честно.";
  }

  return SIGNAL_REASON_COPY[reason] || reason;
}

function buildRowKey(card, entityType) {
  return `${entityType}:${card?.entity?.id || "missing"}`;
}

function buildMissingVersionRow({ card, entityType, listHref }) {
  const signalMeta = SIGNAL_META.missing;
  const actionHref = appendAdminReturnTo(`/admin/entities/${entityType}/${card.entity.id}`, listHref);
  const reason = "Версий пока нет. Откройте карточку, чтобы начать работу.";

  return {
    key: buildRowKey(card, entityType),
    entityType,
    entityTypeLabel: getEntityTypeLabel(entityType),
    entityId: card.entity.id,
    isTestData: false,
    entityLabel: labelFromPayload(card.latestRevision?.payload) || card.entity.id,
    versionLabel: "Версий пока нет",
    versionStateLabel: "Пусто",
    signalState: "missing",
    signalLabel: signalMeta.label,
    signalTone: signalMeta.tone,
    signalReason: reason,
    signalCounts: {
      blocking: 0,
      warning: 0,
      info: 0,
      total: 0,
      evidence: 0,
      proofGap: 0
    },
    actionHref,
    actionLabel: signalMeta.actionLabel,
    priority: SIGNAL_PRIORITY.missing,
    updatedAtTs: Date.parse(card?.entity?.updatedAt || "") || 0,
    hasLatestRevision: false,
    badge: {
      state: "missing",
      label: signalMeta.label,
      tone: signalMeta.tone,
      reason,
      counts: {
        blocking: 0,
        warning: 0,
        info: 0,
        total: 0,
        evidence: 0,
        proofGap: 0
      }
    }
  };
}

export function buildListRowProjection({
  card,
  entityType,
  readiness = null,
  obligations = [],
  listHref = ""
} = {}) {
  if (!card?.entity) {
    return null;
  }

  if (!card.latestRevision) {
    return buildMissingVersionRow({ card, entityType, listHref });
  }

  const entityLabel = labelFromPayload(card.latestRevision.payload) || card.entity.id;
  const inactiveLiveTruth = card.latestRevision.state === "published" && !card.entity.activePublishedRevisionId;
  const evidenceProjection = buildEvidenceProjection({
    entityType,
    entityId: card.entity.id,
    readiness,
    obligations
  });
  const badge = buildListBadgeProjection({
    entityExists: true,
    readiness,
    evidenceProjection
  });
  const signalMeta = inactiveLiveTruth ? SIGNAL_META.inactive : getSignalMeta(badge.state);
  const actionHref = appendAdminReturnTo(`/admin/entities/${entityType}/${card.entity.id}`, listHref);
  const reason = inactiveLiveTruth
    ? "Опубликованная версия сохранена в истории, но active live pointer уже снят."
    : localizeReason(badge.reason);

  return {
    key: buildRowKey(card, entityType),
    entityType,
    entityTypeLabel: getEntityTypeLabel(entityType),
    entityId: card.entity.id,
    isTestData: card.entity.creationOrigin === "agent_test",
    entityLabel,
    versionLabel: `#${card.latestRevision.revisionNumber}`,
    versionStateLabel: inactiveLiveTruth ? "Вне live" : getRevisionStateLabel(card.latestRevision.state),
    signalState: inactiveLiveTruth ? "inactive" : badge.state,
    signalLabel: signalMeta.label,
    signalTone: signalMeta.tone,
    signalReason: reason,
    signalCounts: badge.counts,
    actionHref,
    actionLabel: signalMeta.actionLabel,
    priority: inactiveLiveTruth ? SIGNAL_PRIORITY.inactive : (SIGNAL_PRIORITY[badge.state] ?? SIGNAL_PRIORITY.neutral),
    updatedAtTs: Date.parse(card.latestRevision.updatedAt || card.entity.updatedAt || "") || 0,
    hasLatestRevision: true,
    badge: {
      ...badge,
      reason
    }
  };
}

export function buildListSurfaceViewModel(rows = []) {
  const sortedRows = [...rows].sort((left, right) => {
    const priorityDelta = (left.priority ?? SIGNAL_PRIORITY.neutral) - (right.priority ?? SIGNAL_PRIORITY.neutral);

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    const updatedDelta = (right.updatedAtTs ?? 0) - (left.updatedAtTs ?? 0);

    if (updatedDelta !== 0) {
      return updatedDelta;
    }

    return String(left.entityLabel || left.entityId || "").localeCompare(String(right.entityLabel || right.entityId || ""), "ru");
  });

  const summary = sortedRows.reduce(
    (accumulator, row) => {
      accumulator.total += 1;
      accumulator[row.signalState] = (accumulator[row.signalState] ?? 0) + 1;
      return accumulator;
    },
    {
      total: 0,
      ready: 0,
      blocked: 0,
      proof_gap: 0,
      partial: 0,
      missing: 0
    }
  );

  const bullets = [
    `Всего записей: ${summary.total}`,
    `Заблокировано: ${summary.blocked}`,
    `Нужны доказательства: ${summary.proof_gap}`,
    `Частично: ${summary.partial}`,
    `Готово: ${summary.ready}`,
    `Нет версии: ${summary.missing}`
  ];

  const summaryNote =
    summary.blocked > 0 || summary.proof_gap > 0
      ? "Сначала открывайте блокирующие строки и строки с доказательствами; сигнал уже виден прямо в списке."
      : summary.partial > 0 || summary.missing > 0
        ? "Список выглядит неполным: подробности откройте в карточке."
        : "Сигналы показаны прямо в строках; готовые строки можно открывать последними.";

  return {
    rows: sortedRows,
    summary,
    bullets,
    summaryNote
  };
}
