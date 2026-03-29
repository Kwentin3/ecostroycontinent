import { ENTITY_TYPE_LABELS, ENTITY_TYPES } from "../content-core/content-types.js";

const COVERAGE_STATUS_LABELS = Object.freeze({
  ready: "Готово",
  blocked: "Заблокировано",
  needs_proof: "Нужны доказательства",
  partial: "Частично",
  missing: "Не заведено"
});

const COVERAGE_STATUS_TONES = Object.freeze({
  ready: "healthy",
  blocked: "danger",
  needs_proof: "warning",
  partial: "warning",
  missing: "warning"
});

const ACTION_VERBS = Object.freeze({
  ready: "Открыть",
  blocked: "Исправить",
  needs_proof: "Добавить доказательства",
  partial: "Досмотреть",
  missing: "Создать"
});

const STATE_TONE = Object.freeze({
  ready: "healthy",
  blocked: "danger",
  needsProof: "warning",
  partial: "warning",
  missing: "warning"
});

const FIRST_SLICE_ORDER = Object.freeze([
  ENTITY_TYPES.GLOBAL_SETTINGS,
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.CASE,
  ENTITY_TYPES.PAGE,
  ENTITY_TYPES.MEDIA_ASSET,
  ENTITY_TYPES.GALLERY
]);

function getEntityTypeLabel(entityType) {
  return ENTITY_TYPE_LABELS[entityType] ?? entityType;
}

function getRouteSpec(entityType) {
  switch (entityType) {
    case ENTITY_TYPES.GLOBAL_SETTINGS:
      return {
        exactHref: "/admin/entities/global_settings",
        exactLabel: "Открыть глобальные настройки",
        fallbackHref: "/admin/entities/global_settings",
        fallbackLabel: "Настроить глобальные настройки"
      };
    case ENTITY_TYPES.SERVICE:
      return {
        exactHref: (entityId) => `/admin/entities/service/${entityId}`,
        exactLabel: "Открыть услугу",
        fallbackHref: "/admin/entities/service/new",
        fallbackLabel: "Создать услугу"
      };
    case ENTITY_TYPES.CASE:
      return {
        exactHref: (entityId) => `/admin/entities/case/${entityId}`,
        exactLabel: "Открыть кейс",
        fallbackHref: "/admin/entities/case/new",
        fallbackLabel: "Создать кейс"
      };
    case ENTITY_TYPES.PAGE:
      return {
        exactHref: (entityId) => `/admin/entities/page/${entityId}`,
        exactLabel: "Открыть страницу",
        fallbackHref: "/admin/entities/page/new",
        fallbackLabel: "Создать страницу"
      };
    case ENTITY_TYPES.MEDIA_ASSET:
      return {
        exactHref: (entityId) => `/admin/entities/media_asset/${entityId}`,
        exactLabel: "Открыть медиафайл",
        fallbackHref: "/admin/entities/media_asset/new",
        fallbackLabel: "Загрузить медиафайл"
      };
    case ENTITY_TYPES.GALLERY:
      return {
        exactHref: (entityId) => `/admin/entities/gallery/${entityId}`,
        exactLabel: "Открыть коллекцию",
        fallbackHref: "/admin/entities/gallery/new",
        fallbackLabel: "Создать коллекцию"
      };
    default:
      return {
        exactHref: (entityId) => `/admin/entities/${entityType}/${entityId}`,
        exactLabel: `Открыть ${getEntityTypeLabel(entityType).toLowerCase()}`,
        fallbackHref: `/admin/entities/${entityType}`,
        fallbackLabel: `Создать ${getEntityTypeLabel(entityType).toLowerCase()}`
      };
  }
}

export function getLaunchCoreRouteTarget(entityType, entityId = null) {
  const routeSpec = getRouteSpec(entityType);

  if (entityId) {
    return {
      href: typeof routeSpec.exactHref === "function" ? routeSpec.exactHref(entityId) : routeSpec.exactHref,
      label: routeSpec.exactLabel,
      isFallback: false
    };
  }

  return {
    href: routeSpec.fallbackHref,
    label: routeSpec.fallbackLabel,
    isFallback: true
  };
}

function getStatusLabel(status) {
  return COVERAGE_STATUS_LABELS[status] ?? "Неизвестно";
}

function getStatusTone(status) {
  return COVERAGE_STATUS_TONES[status] ?? "unknown";
}

function getActionVerb(status) {
  return ACTION_VERBS[status] ?? "Открыть";
}

function getStateTone(summary) {
  if ((summary?.blocked ?? 0) > 0) {
    return STATE_TONE.blocked;
  }

  if ((summary?.missing ?? 0) > 0) {
    return STATE_TONE.missing;
  }

  if ((summary?.needsProof ?? 0) > 0) {
    return STATE_TONE.needsProof;
  }

  if ((summary?.partial ?? 0) > 0) {
    return STATE_TONE.partial;
  }

  if ((summary?.ready ?? 0) > 0) {
    return STATE_TONE.ready;
  }

  return "unknown";
}

function buildStateNote(summary) {
  if ((summary?.blocked ?? 0) > 0) {
    return "Есть блокирующие пробелы. Начните со следующего действия и не считайте покрытие готовым.";
  }

  if ((summary?.missing ?? 0) > 0 || (summary?.needsProof ?? 0) > 0 || (summary?.partial ?? 0) > 0) {
    return "Покрытие неполное. Пустые и частичные состояния показаны честно, без маскировки под готовое.";
  }

  if ((summary?.ready ?? 0) > 0) {
    return "Ядро запуска покрыто. Продолжайте с ближайшей карточки.";
  }

  return "Покрытие ещё не собрано. Начните с глобальных настроек.";
}

function buildStateEntries(summary) {
  return [
    {
      key: "blocked",
      label: "Заблокировано",
      count: summary?.blocked ?? 0,
      tone: "danger",
      description: "Сначала исправляем блокирующие пробелы."
    },
    {
      key: "missing",
      label: "Не заведено",
      count: summary?.missing ?? 0,
      tone: "unknown",
      description: "Эти типы ещё не заведены как рабочее покрытие."
    },
    {
      key: "needs_proof",
      label: "Нужны доказательства",
      count: summary?.needsProof ?? 0,
      tone: "warning",
      description: "Есть контент, но не хватает доказательств."
    },
    {
      key: "ready",
      label: "Готово",
      count: summary?.ready ?? 0,
      tone: "healthy",
      description: "Эти rows не требуют немедленного исправления."
    }
  ];
}

function getActionPriority(status) {
  switch (status) {
    case "blocked":
      return 0;
    case "needs_proof":
      return 1;
    case "partial":
      return 2;
    case "missing":
      return 3;
    case "ready":
      return 4;
    default:
      return 5;
  }
}

function toActionItem(row) {
  const routeTarget = getLaunchCoreRouteTarget(row.entityType, row.entityId);

  return {
    key: `${row.entityType}:${row.entityId ?? row.label ?? "missing"}`,
    entityType: row.entityType,
    entityTypeLabel: getEntityTypeLabel(row.entityType),
    entityId: row.entityId,
    label: row.label,
    status: row.status,
    statusLabel: getStatusLabel(row.status),
    tone: getStatusTone(row.status),
    reason: row.badge?.reason || row.evidence?.summary || "Проверка ещё не завершена.",
    actionLabel: getActionVerb(row.status),
    routeTarget,
    routeHint: routeTarget.isFallback ? `Резервный переход: ${routeTarget.label}` : routeTarget.label,
    fallbackRoute: routeTarget.isFallback
  };
}

function chooseCoverageRow(group) {
  return group.rows.find((row) => row.status !== "ready") ?? group.rows[0] ?? null;
}

function buildCoverageCounts(group) {
  const badges = [];

  if (group.readyCount > 0) {
    badges.push({
      key: "ready",
      label: `Готово ${group.readyCount}`,
      tone: "healthy"
    });
  }

  if (group.blockedCount > 0) {
    badges.push({
      key: "blocked",
      label: `Заблокировано ${group.blockedCount}`,
      tone: "danger"
    });
  }

  if (group.needsProofCount > 0) {
    badges.push({
      key: "needs_proof",
      label: `Доказательства ${group.needsProofCount}`,
      tone: "warning"
    });
  }

  if (group.partialCount > 0) {
    badges.push({
      key: "partial",
      label: `Частично ${group.partialCount}`,
      tone: "warning"
    });
  }

  if (group.missingRowCount > 0) {
    badges.push({
      key: "missing",
      label: `Не заведено ${group.missingRowCount}`,
      tone: "warning"
    });
  }

  return badges;
}

function buildCoverageSummary(group) {
  if (group.isCoverageEmpty) {
    return "Покрытие ещё не заведено.";
  }

  if (group.status === "blocked") {
    return `${group.blockedCount} блокирующих пробела из ${group.total}.`;
  }

  if (group.status === "needs_proof") {
    return `${group.needsProofCount} строк(и) ждут доказательств из ${group.total}.`;
  }

  if (group.status === "partial") {
    return `${group.partialCount} строк(и) частично готовы из ${group.total}.`;
  }

  if (group.status === "missing") {
    return "Покрытие отсутствует.";
  }

  return `${group.readyCount}/${group.total} готово.`;
}

function toCoverageTile(group) {
  const chosenRow = chooseCoverageRow(group);
  const routeTarget = getLaunchCoreRouteTarget(group.entityType, chosenRow?.entityId ?? null);

  return {
    key: group.entityType,
    entityType: group.entityType,
    label: getEntityTypeLabel(group.entityType),
    status: group.status,
    statusLabel: getStatusLabel(group.status),
    tone: getStatusTone(group.status),
    summary: buildCoverageSummary(group),
    reason: group.reason,
    routeTarget,
    routeHint: routeTarget.isFallback ? `Резервный переход: ${routeTarget.label}` : routeTarget.label,
    countBadges: buildCoverageCounts(group),
    total: group.total,
    readyCount: group.readyCount,
    blockedCount: group.blockedCount,
    needsProofCount: group.needsProofCount,
    partialCount: group.partialCount,
    missingRowCount: group.missingRowCount,
    isCoverageEmpty: group.isCoverageEmpty
  };
}

export function buildCockpitSurfaceViewModel(cockpitProjection = {}) {
  const summary = cockpitProjection.summary ?? {
    ready: 0,
    blocked: 0,
    needsProof: 0,
    partial: 0,
    missing: 0,
    total: 0
  };
  const stateEntries = buildStateEntries(summary);
  const rows = Array.isArray(cockpitProjection.rows) ? cockpitProjection.rows : [];
  const coverage = Array.isArray(cockpitProjection.coverage) ? cockpitProjection.coverage : [];
  const nextActions = rows
    .slice()
    .sort((left, right) => {
      const statusDelta = getActionPriority(left.status) - getActionPriority(right.status);

      if (statusDelta !== 0) {
        return statusDelta;
      }

      const typeDelta = FIRST_SLICE_ORDER.indexOf(left.entityType) - FIRST_SLICE_ORDER.indexOf(right.entityType);

      if (typeDelta !== 0) {
        return typeDelta;
      }

      return String(left.label).localeCompare(String(right.label), "ru");
    })
    .map(toActionItem);

  if (nextActions.length === 0) {
    nextActions.push({
      key: "fallback:global_settings",
      entityType: ENTITY_TYPES.GLOBAL_SETTINGS,
      entityId: null,
      label: getEntityTypeLabel(ENTITY_TYPES.GLOBAL_SETTINGS),
      status: "missing",
      statusLabel: getStatusLabel("missing"),
      tone: getStatusTone("missing"),
      reason: "Покрытие ещё не заведено.",
      actionLabel: getActionVerb("missing"),
      routeTarget: getLaunchCoreRouteTarget(ENTITY_TYPES.GLOBAL_SETTINGS, null),
      routeHint: "Резервный переход: Настроить глобальные настройки",
      fallbackRoute: true
    });
  }

  const coverageTiles = coverage.map(toCoverageTile);
  const primaryAction = nextActions[0] ?? null;
  const secondaryActions = nextActions.slice(1, 4);

  return {
    summary,
    stateEntries,
    stateTone: getStateTone(summary),
    stateNote: buildStateNote(summary),
    nextActions,
    primaryAction,
    secondaryActions,
    coverageTiles,
    coverageNote:
      summary.missing > 0 || summary.partial > 0 || summary.blocked > 0 || summary.needsProof > 0
        ? "Пустые и частичные состояния показаны честно. Ни одно пустое покрытие не считается готовым."
        : "Покрытие не скрывает пробелов и не пересчитывает источник истины."
  };
}
