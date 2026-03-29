import { ENTITY_TYPES } from "../content-core/content-types.js";
import { buildEvidenceProjection } from "./content-ops-evidence.js";
import { getEditorFieldAnchor } from "./editor-anchors.js";
import { FIELD_LABELS, getEntityTypeLabel } from "../ui-copy.js";

const ENTITY_ORDER = Object.freeze([
  ENTITY_TYPES.GLOBAL_SETTINGS,
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.CASE,
  ENTITY_TYPES.PAGE,
  ENTITY_TYPES.MEDIA_ASSET,
  ENTITY_TYPES.GALLERY
]);

const CATEGORY_LABELS = Object.freeze({
  "missing proof": "Нужны доказательства",
  "missing media": "Не хватает медиа",
  "invalid refs": "Сломаны ссылки",
  "publish obligations": "Публикационные обязательства",
  "contact truth gap": "Contact truth gap",
  unknown: "Неизвестно"
});

const SEVERITY_LABELS = Object.freeze({
  blocking: "Блокер",
  warning: "Предупреждение",
  info: "Инфо"
});

const STATE_LABELS = Object.freeze({
  blocked: "Есть блокеры",
  partial: "Частично",
  ready: "Готово",
  missing: "Данные ещё не собраны"
});

const STATE_NOTES = Object.freeze({
  blocked: "Blocking proof spots are visible below.",
  partial: "Evidence exists, but some proof spots are still open.",
  ready: "No evidence gaps detected.",
  missing: "Evidence not fully available yet."
});

const SEVERITY_ORDER = Object.freeze({
  blocking: 0,
  warning: 1,
  info: 2
});

function normalizeText(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getEntityOrder(entityType) {
  const index = ENTITY_ORDER.indexOf(entityType);
  return index === -1 ? ENTITY_ORDER.length : index;
}

function getFieldLabel(field) {
  return FIELD_LABELS[field] || field || "section";
}

function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category || "unknown";
}

function getSeverityLabel(severity) {
  return SEVERITY_LABELS[severity] || severity || "info";
}

function getEntityEditorHref(entityType, entityId = null) {
  switch (entityType) {
    case ENTITY_TYPES.GLOBAL_SETTINGS:
      return "/admin/entities/global_settings";
    case ENTITY_TYPES.SERVICE:
    case ENTITY_TYPES.CASE:
    case ENTITY_TYPES.PAGE:
    case ENTITY_TYPES.MEDIA_ASSET:
    case ENTITY_TYPES.GALLERY:
      return entityId ? `/admin/entities/${entityType}/${entityId}` : `/admin/entities/${entityType}/new`;
    default:
      return entityId ? `/admin/entities/${entityType}/${entityId}` : `/admin/entities/${entityType}`;
  }
}

function getScopeLabel(scope) {
  return scope === "editor" ? "Current entity" : "Working set";
}

function getTargetLabel({ scope, anchor, fieldLabel }) {
  if (anchor.isFallback) {
    return "Open fallback section";
  }

  return scope === "editor" ? `Go to ${fieldLabel}` : `Open ${fieldLabel}`;
}

function buildTarget({ scope, entityType, entityId, anchor, fieldLabel }) {
  const baseHref = scope === "editor" ? "" : getEntityEditorHref(entityType, entityId);

  return {
    href: scope === "editor" ? `#${anchor.anchorId}` : `${baseHref}#${anchor.anchorId}`,
    label: getTargetLabel({ scope, anchor, fieldLabel }),
    targetLabel: anchor.isFallback ? "Fallback section" : fieldLabel,
    anchorId: anchor.anchorId,
    anchorKind: anchor.anchorKind,
    isFallback: anchor.isFallback
  };
}

function compareRows(left, right) {
  const severityDelta = (SEVERITY_ORDER[left.severity] ?? 99) - (SEVERITY_ORDER[right.severity] ?? 99);

  if (severityDelta !== 0) {
    return severityDelta;
  }

  const entityDelta = getEntityOrder(left.entityType) - getEntityOrder(right.entityType);

  if (entityDelta !== 0) {
    return entityDelta;
  }

  const leftLabel = normalizeText(left.entityLabel) || normalizeText(left.entityTypeLabel) || "";
  const rightLabel = normalizeText(right.entityLabel) || normalizeText(right.entityTypeLabel) || "";

  return leftLabel.localeCompare(rightLabel, "ru");
}

function projectEvidenceItems({
  scope,
  entityType,
  entityId,
  entityLabel,
  items
}) {
  return items.map((item, index) => {
    const anchor = item.anchor?.anchorId
      ? item.anchor
      : getEditorFieldAnchor(entityType, item.field ?? null);
    const fieldLabel = getFieldLabel(anchor.field || item.field);
    const target = buildTarget({
      scope,
      entityType,
      entityId,
      anchor,
      fieldLabel
    });

    return {
      key: `${entityType || "unknown"}:${entityId || "missing"}:${item.code || "unknown"}:${index}`,
      entityType,
      entityTypeLabel: getEntityTypeLabel(entityType),
      entityId: entityId ?? null,
      entityLabel: normalizeText(entityLabel) || getEntityTypeLabel(entityType) || "Untitled",
      field: item.field ?? null,
      fieldLabel,
      reason: normalizeText(item.reason) || "No reason provided.",
      category: item.category || "unknown",
      categoryLabel: getCategoryLabel(item.category),
      severity: item.severity || "info",
      severityLabel: getSeverityLabel(item.severity),
      source: item.source || "readiness",
      target,
      order: index,
      isProjectionPlaceholder: item.source === "projection"
    };
  });
}

function buildCockpitRows(cockpit) {
  const rows = [];
  const sourceRows = Array.isArray(cockpit?.rows) ? cockpit.rows : [];

  for (const row of sourceRows) {
    const evidenceItems = Array.isArray(row?.evidence?.items) ? row.evidence.items : [];
    const entityLabel = normalizeText(row?.label) || getEntityTypeLabel(row?.entityType) || "Untitled";

    for (const evidenceItem of evidenceItems) {
      rows.push(
        ...projectEvidenceItems({
          scope: "cockpit",
          entityType: row.entityType,
          entityId: row.entityId,
          entityLabel,
          items: [evidenceItem]
        })
      );
    }
  }

  return rows.sort(compareRows);
}

function buildEntityRows({ entityType, entityId, entityLabel, readiness, obligations }) {
  const projection = buildEvidenceProjection({
    entityType,
    entityId,
    readiness,
    obligations
  });

  return {
    projection,
    rows: projectEvidenceItems({
      scope: "editor",
      entityType,
      entityId,
      entityLabel,
      items: projection.items
    }).sort(compareRows)
  };
}

function buildState({ rows, hasProjection, projection }) {
  if (!hasProjection) {
    return {
      key: "missing",
      label: STATE_LABELS.missing,
      tone: "unknown",
      note: STATE_NOTES.missing
    };
  }

  if (rows.some((row) => row.severity === "blocking")) {
    return {
      key: "blocked",
      label: STATE_LABELS.blocked,
      tone: "danger",
      note: STATE_NOTES.blocked
    };
  }

  if (rows.length === 0) {
    return {
      key: "ready",
      label: STATE_LABELS.ready,
      tone: "healthy",
      note: STATE_NOTES.ready
    };
  }

  if (rows.some((row) => row.isProjectionPlaceholder) || projection?.state === "missing") {
    return {
      key: "missing",
      label: STATE_LABELS.missing,
      tone: "unknown",
      note: STATE_NOTES.missing
    };
  }

  return {
    key: "partial",
    label: STATE_LABELS.partial,
    tone: "warning",
    note: STATE_NOTES.partial
  };
}

function buildCounts(rows) {
  return rows.reduce(
    (counts, row) => {
      counts.total += 1;
      counts[row.severity] = (counts[row.severity] ?? 0) + 1;

      if (row.category) {
        counts.category[row.category] = (counts.category[row.category] ?? 0) + 1;
      }

      if (row.isProjectionPlaceholder) {
        counts.projectionUnavailable += 1;
      }

      return counts;
    },
    {
      blocking: 0,
      warning: 0,
      info: 0,
      total: 0,
      projectionUnavailable: 0,
      category: {}
    }
  );
}

export function buildEvidenceRegisterViewModel({
  cockpit = null,
  entityType = null,
  entityId = null,
  entityLabel = null,
  readiness = null,
  obligations = [],
  scope = null
} = {}) {
  const resolvedScope = scope || (cockpit ? "cockpit" : "editor");
  const hasCockpitProjection = Boolean(cockpit && Array.isArray(cockpit.rows));
  const hasEntityProjection = Boolean(readiness || (Array.isArray(obligations) && obligations.length > 0));

  let rows = [];
  let projection = null;

  if (hasCockpitProjection && resolvedScope === "cockpit") {
    rows = buildCockpitRows(cockpit);
    projection = { state: cockpit?.summary?.blocked > 0 ? "blocked" : cockpit?.summary?.missing > 0 ? "missing" : "ready" };
  } else {
    const entityView = buildEntityRows({
      entityType,
      entityId,
      entityLabel,
      readiness,
      obligations
    });

    rows = entityView.rows;
    projection = entityView.projection;
  }

  const counts = buildCounts(rows);
  const state = buildState({
    rows,
    hasProjection: resolvedScope === "cockpit" ? hasCockpitProjection : hasEntityProjection,
    projection
  });

  return {
    scope: resolvedScope,
    scopeLabel: getScopeLabel(resolvedScope),
    state,
    counts,
    rows,
    isEmpty: rows.length === 0
  };
}

