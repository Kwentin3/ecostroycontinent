import { withTransaction } from "../db/client.js";
import { recordAuditEvent } from "../content-ops/audit.js";
import { AUDIT_EVENT_KEYS, ENTITY_TYPES, ENTITY_TYPE_LABELS, PAGE_TYPES } from "../content-core/content-types.js";
import {
  clearEntityActivePublishedRevision,
  getEntityAggregate,
  listPublishObligations
} from "../content-core/repository.js";
import { listEntityCards, listPublishedCards } from "../content-core/service.js";
import { isAgentTestCreationOrigin } from "./entity-origin.js";

export const LIVE_DEACTIVATION_ENTITY_TYPES = Object.freeze([
  ENTITY_TYPES.PAGE,
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.CASE,
  ENTITY_TYPES.MEDIA_ASSET
]);

const SUPPORTED_ENTITY_TYPE_SET = new Set(LIVE_DEACTIVATION_ENTITY_TYPES);
const TARGET_SOURCE_TYPES = Object.freeze({
  [ENTITY_TYPES.PAGE]: [],
  [ENTITY_TYPES.MEDIA_ASSET]: [ENTITY_TYPES.GALLERY, ENTITY_TYPES.SERVICE, ENTITY_TYPES.CASE, ENTITY_TYPES.PAGE],
  [ENTITY_TYPES.SERVICE]: [ENTITY_TYPES.GALLERY, ENTITY_TYPES.CASE, ENTITY_TYPES.PAGE],
  [ENTITY_TYPES.CASE]: [ENTITY_TYPES.GALLERY, ENTITY_TYPES.SERVICE, ENTITY_TYPES.PAGE]
});
const ENTITY_TYPE_PUBLISHED_NOUNS = Object.freeze({
  [ENTITY_TYPES.PAGE]: "страница",
  [ENTITY_TYPES.MEDIA_ASSET]: "медиафайл",
  [ENTITY_TYPES.SERVICE]: "услуга",
  [ENTITY_TYPES.CASE]: "кейс",
  [ENTITY_TYPES.GALLERY]: "галерея"
});
const ENTITY_TYPE_GENITIVE_LABELS = Object.freeze({
  [ENTITY_TYPES.PAGE]: "страницы",
  [ENTITY_TYPES.MEDIA_ASSET]: "медиафайла",
  [ENTITY_TYPES.SERVICE]: "услуги",
  [ENTITY_TYPES.CASE]: "кейса",
  [ENTITY_TYPES.GALLERY]: "галереи"
});

function pushId(bucket, value) {
  const normalized = String(value ?? "").trim();

  if (normalized) {
    bucket.add(normalized);
  }
}

function pushArray(bucket, values = []) {
  for (const value of values ?? []) {
    pushId(bucket, value);
  }
}

function collectPageReferences(payload = {}) {
  const mediaIds = new Set();
  const serviceIds = new Set();
  const caseIds = new Set();

  pushId(mediaIds, payload.primaryMediaAssetId);
  pushId(mediaIds, payload.hero?.mediaAssetId);
  pushArray(mediaIds, payload.mediaAssetIds);

  pushArray(serviceIds, payload.serviceIds);
  pushArray(serviceIds, payload.serviceCardIds);

  pushArray(caseIds, payload.caseIds);
  pushArray(caseIds, payload.caseCardIds);

  for (const block of payload.blocks ?? []) {
    pushId(mediaIds, block?.mediaAssetId);
    pushArray(mediaIds, block?.mediaAssetIds);
    pushArray(serviceIds, block?.serviceIds);
    pushArray(serviceIds, block?.serviceCardIds);
    pushArray(caseIds, block?.caseIds);
    pushArray(caseIds, block?.caseCardIds);
  }

  return { mediaIds, serviceIds, caseIds };
}

function referencesTarget(sourceEntityType, payload, targetEntityType, targetId) {
  switch (sourceEntityType) {
    case ENTITY_TYPES.GALLERY:
      if (targetEntityType === ENTITY_TYPES.MEDIA_ASSET) {
        return payload?.primaryAssetId === targetId || (payload?.assetIds ?? []).includes(targetId);
      }

      if (targetEntityType === ENTITY_TYPES.SERVICE || targetEntityType === ENTITY_TYPES.CASE) {
        return (payload?.relatedEntityIds ?? []).includes(targetId);
      }

      return false;
    case ENTITY_TYPES.SERVICE:
      if (targetEntityType === ENTITY_TYPES.MEDIA_ASSET) {
        return payload?.primaryMediaAssetId === targetId;
      }

      if (targetEntityType === ENTITY_TYPES.CASE) {
        return (payload?.relatedCaseIds ?? []).includes(targetId);
      }

      return false;
    case ENTITY_TYPES.CASE:
      if (targetEntityType === ENTITY_TYPES.MEDIA_ASSET) {
        return payload?.primaryMediaAssetId === targetId;
      }

      if (targetEntityType === ENTITY_TYPES.SERVICE) {
        return (payload?.serviceIds ?? []).includes(targetId);
      }

      return false;
    case ENTITY_TYPES.PAGE: {
      const refs = collectPageReferences(payload);

      if (targetEntityType === ENTITY_TYPES.MEDIA_ASSET) {
        return refs.mediaIds.has(targetId);
      }

      if (targetEntityType === ENTITY_TYPES.SERVICE) {
        return refs.serviceIds.has(targetId);
      }

      if (targetEntityType === ENTITY_TYPES.CASE) {
        return refs.caseIds.has(targetId);
      }

      return false;
    }
    default:
      return false;
  }
}

function labelFromPayload(payload = {}, entityType, entityId) {
  return payload?.title
    || payload?.h1
    || payload?.slug
    || `${ENTITY_TYPE_LABELS[entityType] || entityType} ${entityId}`;
}

function dedupeStrings(items = []) {
  return [...new Set(items.filter(Boolean))];
}

function dedupeIncomingRefs(items = []) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = `${item.entityType}:${item.entityId}:${item.state}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

function dedupeStateItems(items = []) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = `${item.kind}:${item.id ?? ""}:${item.reason ?? ""}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

function makeOperatorRefReason(sourceType, state) {
  if (state === "published") {
    return `На сущность ссылается опубликованная ${ENTITY_TYPE_PUBLISHED_NOUNS[sourceType] || "сущность"}.`;
  }

  return `На сущность ссылается рабочий нетестовый черновик ${ENTITY_TYPE_GENITIVE_LABELS[sourceType] || "сущности"}.`;
}

function buildIncomingRefItem(sourceType, card, state) {
  const payload = card?.latestRevision?.payload ?? card?.revision?.payload ?? {};
  const entityId = card?.entity?.id ?? card?.entityId ?? "";

  return {
    entityType: sourceType,
    entityId,
    label: labelFromPayload(payload, sourceType, entityId),
    href: sourceType === ENTITY_TYPES.GALLERY
      ? `/admin/entities/media_asset?compose=collections&collection=${entityId}`
      : `/admin/entities/${sourceType}/${entityId}`,
    state,
    reason: makeOperatorRefReason(sourceType, state)
  };
}

function getEntityAdminHref(entityType, entityId) {
  if (entityType === ENTITY_TYPES.MEDIA_ASSET) {
    return `/admin/entities/media_asset?asset=${entityId}`;
  }

  if (entityType === ENTITY_TYPES.GALLERY) {
    return `/admin/entities/media_asset?compose=collections&collection=${entityId}`;
  }

  return `/admin/entities/${entityType}/${entityId}`;
}

function buildReviewResidueItem(revision) {
  return {
    kind: "review_revision",
    id: revision?.id ?? "",
    label: `Ревизия №${revision?.revisionNumber ?? "?"} на проверке`,
    state: revision?.state ?? null,
    href: revision?.id ? `/admin/review/${revision.id}` : null,
    reason: "У сущности есть ревизия на проверке."
  };
}

function buildOpenObligationItem(entityType, entityId, obligation) {
  return {
    kind: "open_obligation",
    id: obligation?.id ?? "",
    label: obligation?.obligationType
      ? `Открытое обязательство: ${obligation.obligationType}`
      : "Открытое обязательство по публикации",
    state: obligation?.status ?? null,
    href: getEntityAdminHref(entityType, entityId),
    reason: "У сущности есть открытые обязательства по публикации."
  };
}

function buildRouteEffects(entityType, publishedPayload = {}, entityId = "") {
  if (entityType === ENTITY_TYPES.PAGE) {
    const pageType = publishedPayload.pageType;

    if (pageType === PAGE_TYPES.ABOUT) {
      return {
        allowed: true,
        routePath: "/about",
        routeOutcome: "Маршрут /about станет 404, пока не появится новая опубликованная страница этого типа.",
        listImpact: "Отдельного листинга страниц нет.",
        sitemapImpact: "Если карта сайта строится из опубликованного контента, запись должна исчезнуть. Отдельный маршрут sitemap в текущем коде не найден.",
        revalidationPaths: ["/about"]
      };
    }

    if (pageType === PAGE_TYPES.CONTACTS) {
      return {
        allowed: true,
        routePath: "/contacts",
        routeOutcome: "Маршрут /contacts станет 404, пока не появится новая опубликованная страница этого типа.",
        listImpact: "Отдельного листинга страниц нет.",
        sitemapImpact: "Если карта сайта строится из опубликованного контента, запись должна исчезнуть. Отдельный маршрут sitemap в текущем коде не найден.",
        revalidationPaths: ["/contacts"]
      };
    }

    return {
      allowed: false,
      reason: "Текущий тип страницы не поддерживает безопасное выведение из живого контура в этом срезе."
    };
  }

  if (entityType === ENTITY_TYPES.SERVICE) {
    const slug = String(publishedPayload.slug ?? "").trim();

    if (!slug) {
      return {
        allowed: false,
        reason: "У опубликованной услуги не удалось честно определить публичный адрес по slug."
      };
    }

    return {
      allowed: true,
      routePath: `/services/${slug}`,
      routeOutcome: `Маршрут /services/${slug} станет 404 на публичной стороне.`,
      listImpact: "Услуга исчезнет из опубликованного списка услуг.",
      sitemapImpact: "Если карта сайта строится из опубликованных услуг, запись должна исчезнуть. Отдельный маршрут sitemap в текущем коде не найден.",
      revalidationPaths: [`/services/${slug}`, "/services"]
    };
  }

  if (entityType === ENTITY_TYPES.CASE) {
    const slug = String(publishedPayload.slug ?? "").trim();

    if (!slug) {
      return {
        allowed: false,
        reason: "У опубликованного кейса не удалось честно определить публичный адрес по slug."
      };
    }

    return {
      allowed: true,
      routePath: `/cases/${slug}`,
      routeOutcome: `Маршрут /cases/${slug} станет 404 на публичной стороне.`,
      listImpact: "Кейс исчезнет из опубликованного списка кейсов.",
      sitemapImpact: "Если карта сайта строится из опубликованных кейсов, запись должна исчезнуть. Отдельный маршрут sitemap в текущем коде не найден.",
      revalidationPaths: [`/cases/${slug}`, "/cases"]
    };
  }

  if (entityType === ENTITY_TYPES.MEDIA_ASSET) {
    return {
      allowed: true,
      routePath: `/api/media/${entityId}, /api/media-public/${entityId}`,
      routeOutcome: "Прямой доступ к опубликованному медиафайлу перестанет работать и будет отдавать 404.",
      listImpact: "В медиатеке объект останется, но перестанет считаться опубликованным.",
      sitemapImpact: "Медиафайл не участвует в карте сайта как отдельная страница.",
      revalidationPaths: []
    };
  }

  return {
    allowed: false,
    reason: "Этот тип сущности не поддерживает выведение из живого контура."
  };
}

async function collectIncomingReferences(targetEntityType, targetEntityId, deps, db) {
  const publishedIncomingRefs = [];
  const draftIncomingRefs = [];
  const blockers = [];
  const sourceTypes = TARGET_SOURCE_TYPES[targetEntityType] ?? [];

  for (const sourceType of sourceTypes) {
    const [latestCards, publishedCards] = await Promise.all([
      deps.listEntityCards(sourceType, { db }),
      deps.listPublishedCards(sourceType, { db })
    ]);

    for (const published of publishedCards) {
      if (published.entityId === targetEntityId) {
        continue;
      }

      if (!referencesTarget(sourceType, published.revision?.payload ?? {}, targetEntityType, targetEntityId)) {
        continue;
      }

      const item = buildIncomingRefItem(sourceType, published, "published");
      publishedIncomingRefs.push(item);
      blockers.push(item.reason);
    }

    for (const card of latestCards) {
      if (!card?.latestRevision || card.entity.id === targetEntityId) {
        continue;
      }

      if (card.latestRevision.state === "published") {
        continue;
      }

      if (isAgentTestCreationOrigin(card.entity.creationOrigin)) {
        continue;
      }

      if (!referencesTarget(sourceType, card.latestRevision.payload ?? {}, targetEntityType, targetEntityId)) {
        continue;
      }

      const item = buildIncomingRefItem(sourceType, card, "draft");
      draftIncomingRefs.push(item);
      blockers.push(item.reason);
    }
  }

  return {
    publishedIncomingRefs: dedupeIncomingRefs(publishedIncomingRefs),
    draftIncomingRefs: dedupeIncomingRefs(draftIncomingRefs),
    blockers: dedupeStrings(blockers)
  };
}

export function isLiveDeactivationEntityTypeSupported(entityType) {
  return SUPPORTED_ENTITY_TYPE_SET.has(String(entityType ?? "").trim());
}

export function getLiveDeactivationHref(entityType, entityId) {
  return `/admin/entities/${entityType}/${entityId}/live-deactivation`;
}

export async function evaluateLiveDeactivation(input, deps = {}) {
  const resolvedDeps = {
    getEntityAggregate,
    listPublishObligations,
    listEntityCards,
    listPublishedCards,
    ...deps
  };
  const db = deps.db ?? null;
  const entityType = String(input.entityType ?? "").trim();
  const entityId = String(input.entityId ?? "").trim();
  const blockers = [];
  const warnings = [];
  const reviewResidue = [];
  const openObligationItems = [];

  if (!isLiveDeactivationEntityTypeSupported(entityType)) {
    return {
      entityType,
      entityId,
      exists: false,
      allowed: false,
      blockers: ["Этот тип сущности не поддерживает выведение из живого контура."],
      warnings: [],
      publishedIncomingRefs: [],
      draftIncomingRefs: [],
      reviewResidue: [],
      openObligations: [],
      routeEffects: null,
      root: null
    };
  }

  const aggregate = await resolvedDeps.getEntityAggregate(entityId, db);

  if (!aggregate?.entity || aggregate.entity.entityType !== entityType) {
    return {
      entityType,
      entityId,
      exists: false,
      allowed: false,
      blockers: ["Сущность не найдена."],
      warnings: [],
      publishedIncomingRefs: [],
      draftIncomingRefs: [],
      reviewResidue: [],
      openObligations: [],
      routeEffects: null,
      root: null
    };
  }

  const latestRevision = aggregate.revisions?.[0] ?? null;
  const publishedRevision = aggregate.activePublishedRevision ?? null;
  const openObligations = (await resolvedDeps.listPublishObligations(entityId, db))
    .filter((obligation) => obligation.status === "open");

  if (isAgentTestCreationOrigin(aggregate.entity.creationOrigin)) {
    blockers.push("Тестовый опубликованный объект нужно убирать через удаление тестового графа.");
  }

  if (!aggregate.entity.activePublishedRevisionId || !publishedRevision) {
    blockers.push("Сущность уже выведена из живого контура.");
  }

  for (const revision of aggregate.revisions ?? []) {
    if (revision.state !== "review") {
      continue;
    }

    blockers.push("У сущности есть ревизия на проверке.");
    reviewResidue.push(buildReviewResidueItem(revision));
  }

  for (const obligation of openObligations) {
    blockers.push("У сущности есть открытые обязательства по публикации.");
    openObligationItems.push(buildOpenObligationItem(entityType, entityId, obligation));
  }

  const routeEffects = buildRouteEffects(entityType, publishedRevision?.payload ?? latestRevision?.payload ?? {}, entityId);

  if (!routeEffects.allowed) {
    blockers.push(routeEffects.reason);
  } else {
    warnings.push(routeEffects.routeOutcome);
  }

  const incoming = await collectIncomingReferences(entityType, entityId, resolvedDeps, db);
  blockers.push(...incoming.blockers);

  if (entityType === ENTITY_TYPES.PAGE) {
    warnings.push("Привязанные landing workspace sessions будут считаться устаревшими, но сама страница останется в админке как историческая truth.");
  }

  return {
    entityType,
    entityId,
    exists: true,
    allowed: blockers.length === 0,
    blockers: dedupeStrings(blockers),
    warnings: dedupeStrings(warnings),
    publishedIncomingRefs: incoming.publishedIncomingRefs,
    draftIncomingRefs: incoming.draftIncomingRefs,
    reviewResidue: dedupeStateItems(reviewResidue),
    openObligations: dedupeStateItems(openObligationItems),
    routeEffects: routeEffects.allowed ? routeEffects : null,
    root: {
      entityId: aggregate.entity.id,
      entityType: aggregate.entity.entityType,
      creationOrigin: aggregate.entity.creationOrigin ?? null,
      label: labelFromPayload(publishedRevision?.payload ?? latestRevision?.payload ?? {}, entityType, entityId),
      href: getEntityAdminHref(entityType, entityId),
      latestRevisionState: latestRevision?.state ?? null,
      activePublishedRevisionId: aggregate.entity.activePublishedRevisionId ?? null,
      openObligationsCount: openObligations.length,
      hasReviewRevision: (aggregate.revisions ?? []).some((revision) => revision.state === "review"),
      published: Boolean(aggregate.entity.activePublishedRevisionId),
      isTestData: isAgentTestCreationOrigin(aggregate.entity.creationOrigin)
    }
  };
}

export async function executeLiveDeactivation(input, deps = {}) {
  const resolvedDeps = {
    withTransaction,
    evaluateLiveDeactivation,
    clearEntityActivePublishedRevision,
    recordAuditEvent,
    ...deps
  };

  return resolvedDeps.withTransaction(async (db) => {
    const evaluation = await resolvedDeps.evaluateLiveDeactivation(input, { ...deps, db });

    if (!evaluation.allowed) {
      return {
        executed: false,
        evaluation,
        revalidationPaths: []
      };
    }

    await resolvedDeps.clearEntityActivePublishedRevision(input.entityId, input.actorUserId, db);
    await resolvedDeps.recordAuditEvent({
      entityId: input.entityId,
      revisionId: evaluation.root?.activePublishedRevisionId ?? null,
      actorUserId: input.actorUserId,
      eventKey: AUDIT_EVENT_KEYS.LIVE_DEACTIVATED,
      summary: "Сущность выведена из живого контура.",
      details: {
        entityType: input.entityType,
        routePath: evaluation.routeEffects?.routePath ?? null,
        routeOutcome: evaluation.routeEffects?.routeOutcome ?? null,
        listImpact: evaluation.routeEffects?.listImpact ?? null,
        sitemapImpact: evaluation.routeEffects?.sitemapImpact ?? null
      }
    }, { db });

    return {
      executed: true,
      evaluation,
      revalidationPaths: evaluation.routeEffects?.revalidationPaths ?? []
    };
  });
}
