import { getEntityTypeLabel } from "../ui-copy.js";

const ENTITY_ROUTE_ROOTS = Object.freeze({
  global_settings: "/admin/entities/global_settings",
  service: "/admin/entities/service",
  case: "/admin/entities/case",
  page: "/admin/entities/page",
  media_asset: "/admin/entities/media_asset",
  gallery: "/admin/entities/gallery"
});

function normalizeEntityType(entityType) {
  return typeof entityType === "string" && entityType.trim() ? entityType.trim() : "";
}

function normalizeReturnTo(returnTo) {
  if (typeof returnTo !== "string") {
    return "";
  }

  const trimmed = returnTo.trim();

  if (!trimmed || !trimmed.startsWith("/admin") || trimmed.startsWith("//")) {
    return "";
  }

  return trimmed;
}

function getEntityRouteRoot(entityType) {
  const normalizedType = normalizeEntityType(entityType);

  return ENTITY_ROUTE_ROOTS[normalizedType] || (normalizedType ? `/admin/entities/${normalizedType}` : "/admin");
}

function appendReturnTo(href, returnTo = "") {
  const safeReturnTo = normalizeReturnTo(returnTo);

  if (!safeReturnTo) {
    return href;
  }

  const [path, hash = ""] = href.split("#");
  const url = new URL(path, "http://admin.local");

  url.searchParams.set("returnTo", safeReturnTo);

  return `${url.pathname}${url.search}${hash ? `#${hash}` : ""}`;
}

function buildFallbackLabel(entityType) {
  return getEntityTypeLabel(entityType) ? "Открыть список" : "Открыть";
}

export function buildRelationTarget({
  entityType,
  entityId = null,
  returnTo = ""
} = {}) {
  const rootHref = getEntityRouteRoot(entityType);

  if (entityId) {
    return {
      href: appendReturnTo(`${rootHref}/${entityId}`, returnTo),
      isFallback: false,
      actionLabel: "Открыть"
    };
  }

  return {
    href: appendReturnTo(rootHref, returnTo),
    isFallback: true,
    actionLabel: buildFallbackLabel(entityType)
  };
}

export function buildRelationSelectionModel({
  entityType,
  options = [],
  selectedIds = [],
  returnTo = "",
  emptyLabel = "Нет связанных сущностей",
  fallbackLabel = null
} = {}) {
  const normalizedSelectedIds = Array.from(new Set(selectedIds.filter(Boolean)));
  const optionMap = new Map(options.map((option) => [option.id, option]));
  const fallbackTarget = buildRelationTarget({ entityType, returnTo });
  const items = normalizedSelectedIds.map((id) => {
    const option = optionMap.get(id);

    if (option) {
      const exactTarget = buildRelationTarget({ entityType, entityId: id, returnTo });

      return {
        id,
        label: option.label,
        subtitle: option.subtitle || "",
        meta: option.meta || "",
        href: exactTarget.href,
        actionLabel: exactTarget.actionLabel,
        isFallback: false
      };
    }

    return {
      id,
      label: fallbackLabel || `Неизвестная ${getEntityTypeLabel(entityType).toLowerCase()}`,
      subtitle: "Связь не найдена",
      meta: id,
      href: fallbackTarget.href,
      actionLabel: fallbackTarget.actionLabel,
      isFallback: true
    };
  });
  const missingSelectedIds = items.filter((item) => item.isFallback).map((item) => item.id);

  return {
    entityType,
    selectedIds: normalizedSelectedIds,
    selectedCount: normalizedSelectedIds.length,
    items,
    optionRows: options.map((option) => ({
      ...option,
      selected: normalizedSelectedIds.includes(option.id)
    })),
    missingSelectedIds,
    missingCount: missingSelectedIds.length,
    isPartial: missingSelectedIds.length > 0,
    isEmpty: normalizedSelectedIds.length === 0,
    emptyLabel
  };
}

export { appendReturnTo as appendAdminReturnTo, normalizeReturnTo as normalizeAdminReturnTo };
