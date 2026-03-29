import { getEditorFallbackAnchor, getEditorFieldAnchor, listEditorFieldAnchors } from "./editor-anchors.js";
import { FIELD_LABELS, getEntityTypeLabel } from "../ui-copy.js";

const PREVIEW_TARGETS = Object.freeze({
  service: Object.freeze({
    title: "preview-service-hero",
    h1: "preview-service-hero",
    summary: "preview-service-hero",
    ctaVariant: "preview-service-hero",
    serviceScope: "preview-service-scope",
    problemsSolved: "preview-service-scope",
    methods: "preview-service-scope",
    relatedCaseIds: "preview-service-related-cases",
    galleryIds: "preview-service-gallery",
    primaryMediaAssetId: "preview-service-media"
  }),
  case: Object.freeze({
    title: "preview-case-hero",
    location: "preview-case-hero",
    projectType: "preview-case-hero",
    task: "preview-case-core",
    workScope: "preview-case-core",
    result: "preview-case-core",
    serviceIds: "preview-case-related-services",
    galleryIds: "preview-case-gallery",
    primaryMediaAssetId: "preview-case-media"
  }),
  page: Object.freeze({
    title: "preview-page-hero",
    h1: "preview-page-hero",
    intro: "preview-page-hero",
    primaryMediaAssetId: "preview-page-media",
    blocks: "preview-page-blocks"
  })
});

function getPreviewTargetForField(entityType, field) {
  return PREVIEW_TARGETS[entityType]?.[field] || null;
}

const SEVERITY_ORDER = {
  blocking: 0,
  warning: 1,
  info: 2
};

const STATE_LABELS = {
  blocked: "Есть блокеры",
  partial: "Есть замечания",
  ready: "Готово",
  missing: "Проверка ещё не считана"
};

const STATE_NOTES = {
  blocked: "Сначала откройте проблемные поля и исправьте blockers.",
  partial: "Проверка уже есть, но часть truth слоя ещё не в порядке.",
  ready: "По текущей проверке карточка не содержит blocking issues.",
  missing: "Проверка готовности ещё не запускалась или данные ещё не собраны."
};

function normalizeResults(readiness) {
  return Array.isArray(readiness?.results) ? readiness.results.filter(Boolean) : [];
}

function countBySeverity(items) {
  return items.reduce(
    (counts, item) => {
      const key = item.severity || "info";
      counts[key] = (counts[key] ?? 0) + 1;
      counts.total += 1;
      return counts;
    },
    { blocking: 0, warning: 0, info: 0, total: 0 }
  );
}

function getFieldLabel(field) {
  return FIELD_LABELS[field] || field || "неизвестное поле";
}

function getFallbackLabel(context) {
  return context === "preview" ? "Панель готовности" : "Общий раздел исправления";
}

function resolveNavigationTarget({ entityType, field, context, fallbackAnchorId, fallbackLabel }) {
  if (context === "preview") {
    const previewTarget = getPreviewTargetForField(entityType, field);

    if (previewTarget) {
      return {
        anchorId: previewTarget,
        href: `#${previewTarget}`,
        anchorKind: "field",
        isFallback: false,
        targetLabel: `Показать блок ${getFieldLabel(field)}`
      };
    }

    return {
      anchorId: fallbackAnchorId,
      href: `#${fallbackAnchorId}`,
      anchorKind: "fallback",
      isFallback: true,
      targetLabel: fallbackLabel || getFallbackLabel(context)
    };
  }

  const anchor = getEditorFieldAnchor(entityType, field);

  return {
    anchorId: anchor.anchorId,
    href: `#${anchor.anchorId}`,
    anchorKind: anchor.anchorKind,
    isFallback: anchor.isFallback,
    targetLabel: anchor.isFallback ? (fallbackLabel || getFallbackLabel(context)) : `Перейти к ${getFieldLabel(field)}`
  };
}

function sortBySeverity(items) {
  return [...items].sort((left, right) => {
    const leftOrder = SEVERITY_ORDER[left.severity] ?? SEVERITY_ORDER.info;
    const rightOrder = SEVERITY_ORDER[right.severity] ?? SEVERITY_ORDER.info;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.order - right.order;
  });
}

function getPrimaryTruthAnchor(entityType) {
  const anchors = listEditorFieldAnchors(entityType);
  return anchors[0] ?? null;
}

function getStateProjection({ readiness, counts }) {
  if (!readiness) {
    return {
      key: "missing",
      label: STATE_LABELS.missing,
      tone: "unknown",
      note: STATE_NOTES.missing
    };
  }

  if (counts.blocking > 0) {
    return {
      key: "blocked",
      label: STATE_LABELS.blocked,
      tone: "danger",
      note: readiness.summary || STATE_NOTES.blocked
    };
  }

  if (counts.warning > 0 || counts.info > 0) {
    return {
      key: "partial",
      label: STATE_LABELS.partial,
      tone: "warning",
      note: readiness.summary || STATE_NOTES.partial
    };
  }

  return {
    key: "ready",
    label: STATE_LABELS.ready,
    tone: "healthy",
    note: readiness.summary || STATE_NOTES.ready
  };
}

function buildPrimaryAction({ entityType, problemItems, fallbackAnchorId, fallbackLabel }) {
  const nextProblem = problemItems[0] ?? null;

  if (nextProblem) {
    return {
      entityType,
      href: nextProblem.target.href,
      label: nextProblem.target.isFallback ? (fallbackLabel || getFallbackLabel("editor")) : `Исправить ${nextProblem.fieldLabel}`,
      note: nextProblem.message || nextProblem.reason || "Откройте указанное поле и снимите blocker.",
      isFallback: nextProblem.target.isFallback,
      targetLabel: nextProblem.target.targetLabel,
      anchorId: nextProblem.target.anchorId
    };
  }

  const starterAnchor = getPrimaryTruthAnchor(entityType);

  if (starterAnchor) {
    return {
      entityType,
      href: `#${starterAnchor.anchorId}`,
      label: `Начать с ${getFieldLabel(starterAnchor.field)}`,
      note: "Это первый точный anchor в SEO / truth слое.",
      isFallback: false,
      targetLabel: `Перейти к ${getFieldLabel(starterAnchor.field)}`,
      anchorId: starterAnchor.anchorId
    };
  }

  return {
    entityType,
    href: `#${fallbackAnchorId}`,
    label: fallbackLabel || getFallbackLabel("editor"),
    note: "Точного anchor пока нет, поэтому открывается labelled fallback section.",
    isFallback: true,
    targetLabel: fallbackLabel || getFallbackLabel("editor"),
    anchorId: fallbackAnchorId
  };
}

export function buildReadinessNavigationModel({
  entityType,
  readiness = null,
  context = "editor",
  fallbackAnchorId = null,
  fallbackLabel = null
} = {}) {
  const results = normalizeResults(readiness);
  const resolvedFallbackAnchorId = fallbackAnchorId
    || (context === "editor" ? getEditorFallbackAnchor(entityType) : `${entityType || "readiness"}-fallback`);
  const resolvedFallbackLabel = fallbackLabel || getFallbackLabel(context);

  const items = sortBySeverity(results.map((result, index) => {
    const target = resolveNavigationTarget({
      entityType,
      field: result?.field ?? null,
      context,
      fallbackAnchorId: resolvedFallbackAnchorId,
      fallbackLabel: resolvedFallbackLabel
    });

    return {
      order: index,
      key: result?.code || `${result?.severity || "info"}-${index}`,
      severity: result?.severity || "info",
      code: result?.code || "unknown",
      field: result?.field ?? null,
      fieldLabel: getFieldLabel(result?.field),
      message: result?.message || "",
      target,
      isFallback: target.isFallback
    };
  }));

  const counts = countBySeverity(items);

  return {
    entityType,
    entityLabel: getEntityTypeLabel(entityType),
    context,
    fallbackAnchorId: resolvedFallbackAnchorId,
    fallbackLabel: resolvedFallbackLabel,
    counts,
    state: getStateProjection({ readiness, counts }),
    items,
    hasReadiness: Boolean(readiness),
    isEmpty: items.length === 0
  };
}

export function buildEditorActionabilityModel({
  entityType,
  readiness = null,
  currentRevision = null,
  activePublishedRevision = null,
  fallbackAnchorId = null
} = {}) {
  const navigation = buildReadinessNavigationModel({
    entityType,
    readiness,
    context: "editor",
    fallbackAnchorId
  });
  const visibleProblemItems = navigation.items.slice(0, 3);
  const hiddenProblemCount = Math.max(0, navigation.items.length - visibleProblemItems.length);
  const primaryAction = buildPrimaryAction({
    entityType,
    problemItems: navigation.items,
    fallbackAnchorId: navigation.fallbackAnchorId,
    fallbackLabel: navigation.fallbackLabel
  });
  const stateLabel = currentRevision?.state || (navigation.hasReadiness ? navigation.state.label : "Новая карточка");

  return {
    entityType,
    state: navigation.state,
    stateLabel,
    currentRevisionState: currentRevision?.state ?? null,
    hasCurrentRevision: Boolean(currentRevision),
    activePublishedRevisionLabel: activePublishedRevision ? `Версия №${activePublishedRevision.revisionNumber}` : "Опубликованной версии нет",
    problemItems: navigation.items,
    visibleProblemItems,
    hiddenProblemCount,
    primaryAction,
    fallbackAnchorId: navigation.fallbackAnchorId,
    fallbackLabel: navigation.fallbackLabel
  };
}
