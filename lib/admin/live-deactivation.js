import { withTransaction } from "../db/client.js";
import { recordDestructiveEvent } from "../content-ops/destructive-forensics.js";
import { AUDIT_EVENT_KEYS, ENTITY_TYPES, ENTITY_TYPE_LABELS, PAGE_TYPES } from "../content-core/content-types.js";
import {
  clearEntityActivePublishedRevision,
  getEntityAggregate,
  listPublishObligations
} from "../content-core/repository.js";
import { listEntityCards, listPublishedCards } from "../content-core/service.js";
import {
  buildGraphReferenceItem,
  isTestGraphEntry,
  listIncomingGraphEntries,
  loadDestructiveReferenceCatalog
} from "./destructive-graph.js";
import { getEntityAdminHref } from "./entity-links.js";
import { isAgentTestCreationOrigin } from "./entity-origin.js";

export const LIVE_DEACTIVATION_ENTITY_TYPES = Object.freeze([
  ENTITY_TYPES.PAGE,
  ENTITY_TYPES.SERVICE,
  ENTITY_TYPES.EQUIPMENT,
  ENTITY_TYPES.CASE,
  ENTITY_TYPES.GALLERY,
  ENTITY_TYPES.MEDIA_ASSET
]);

const SUPPORTED_ENTITY_TYPE_SET = new Set(LIVE_DEACTIVATION_ENTITY_TYPES);

function dedupeStrings(items = []) {
  return [...new Set(items.filter(Boolean))];
}

function dedupeItems(items = [], keyBuilder) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = keyBuilder(item);

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

function labelFromPayload(payload = {}, entityType, entityId) {
  return payload?.title
    || payload?.h1
    || payload?.slug
    || payload?.originalFilename
    || `${ENTITY_TYPE_LABELS[entityType] || entityType} ${entityId}`;
}

function getPublishedNoun(entityType) {
  switch (entityType) {
    case ENTITY_TYPES.PAGE:
      return "страница";
    case ENTITY_TYPES.MEDIA_ASSET:
      return "медиафайл";
    case ENTITY_TYPES.SERVICE:
      return "услуга";
    case ENTITY_TYPES.EQUIPMENT:
      return "техника";
    case ENTITY_TYPES.CASE:
      return "кейс";
    case ENTITY_TYPES.GALLERY:
      return "коллекция";
    default:
      return "сущность";
  }
}

function getGenitiveNoun(entityType) {
  switch (entityType) {
    case ENTITY_TYPES.PAGE:
      return "страницы";
    case ENTITY_TYPES.MEDIA_ASSET:
      return "медиафайла";
    case ENTITY_TYPES.SERVICE:
      return "услуги";
    case ENTITY_TYPES.EQUIPMENT:
      return "техники";
    case ENTITY_TYPES.CASE:
      return "кейса";
    case ENTITY_TYPES.GALLERY:
      return "коллекции";
    default:
      return "сущности";
  }
}

function makeOperatorRefReason(sourceType, state) {
  if (state === "published") {
    return `На сущность ссылается опубликованная ${getPublishedNoun(sourceType)}.`;
  }

  return `На сущность ссылается рабочий нетестовый черновик ${getGenitiveNoun(sourceType)}.`;
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
      : "Открытое publish-обязательство",
    state: obligation?.status ?? null,
    href: getEntityAdminHref(entityType, entityId),
    reason: "У сущности есть открытые обязательства по публикации."
  };
}

function buildUnsupportedResult(entityType, entityId) {
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

function buildNotFoundResult(entityType, entityId) {
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

function buildRouteEffects(entityType, publishedPayload = {}, entityId = "") {
  if (entityType === ENTITY_TYPES.PAGE) {
    const pageType = publishedPayload.pageType;

    if (pageType === PAGE_TYPES.ABOUT) {
      return {
        allowed: true,
        routePath: "/about",
        routeOutcome: "Маршрут /about станет 404, пока не появится новая опубликованная страница этого типа.",
        listImpact: "Отдельного листинга страниц нет.",
        sitemapImpact: "Если sitemap строится из опубликованного контура, запись /about должна исчезнуть.",
        revalidationPaths: ["/about"]
      };
    }

    if (pageType === PAGE_TYPES.CONTACTS) {
      return {
        allowed: true,
        routePath: "/contacts",
        routeOutcome: "Маршрут /contacts станет 404, пока не появится новая опубликованная страница этого типа.",
        listImpact: "Отдельного листинга страниц нет.",
        sitemapImpact: "Если sitemap строится из опубликованного контура, запись /contacts должна исчезнуть.",
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
        reason: "У опубликованной услуги не удалось определить публичный адрес по slug."
      };
    }

    return {
      allowed: true,
      routePath: `/services/${slug}`,
      routeOutcome: `Маршрут /services/${slug} станет 404 на публичной стороне.`,
      listImpact: "Услуга исчезнет из опубликованного списка услуг.",
      sitemapImpact: "Если sitemap строится из опубликованных услуг, запись должна исчезнуть.",
      revalidationPaths: [`/services/${slug}`, "/services"]
    };
  }

  if (entityType === ENTITY_TYPES.CASE) {
    const slug = String(publishedPayload.slug ?? "").trim();

    if (!slug) {
      return {
        allowed: false,
        reason: "У опубликованного кейса не удалось определить публичный адрес по slug."
      };
    }

    return {
      allowed: true,
      routePath: `/cases/${slug}`,
      routeOutcome: `Маршрут /cases/${slug} станет 404 на публичной стороне.`,
      listImpact: "Кейс исчезнет из опубликованного списка кейсов.",
      sitemapImpact: "Если sitemap строится из опубликованных кейсов, запись должна исчезнуть.",
      revalidationPaths: [`/cases/${slug}`, "/cases"]
    };
  }

  if (entityType === ENTITY_TYPES.MEDIA_ASSET) {
    return {
      allowed: true,
      routePath: `/api/media/${entityId}, /api/media-public/${entityId}`,
      routeOutcome: "Прямой доступ к опубликованному медиафайлу перестанет работать и будет отдавать 404.",
      listImpact: "Медиафайл перестанет считаться опубликованным в живом контуре.",
      sitemapImpact: "Медиафайл не участвует в sitemap как отдельная индексируемая страница.",
      revalidationPaths: []
    };
  }

  if (entityType === ENTITY_TYPES.EQUIPMENT) {
    return {
      allowed: true,
      routePath: null,
      routeOutcome: "Техника будет снята из опубликованного lookup-контура и перестанет участвовать в живых проекциях, где используется как источник.",
      listImpact: "Опубликованная техника исчезнет из lookup техники.",
      sitemapImpact: "Отдельной индексируемой страницы для техники нет, прямого влияния на sitemap нет.",
      revalidationPaths: []
    };
  }

  if (entityType === ENTITY_TYPES.GALLERY) {
    return {
      allowed: true,
      routePath: null,
      routeOutcome: "Коллекция будет снята из опубликованного lookup-контура и перестанет участвовать в живых подборках, где используется как ссылка.",
      listImpact: "Опубликованная коллекция исчезнет из lookup коллекций.",
      sitemapImpact: "Отдельной индексируемой страницы для коллекции нет, прямого влияния на sitemap нет.",
      revalidationPaths: []
    };
  }

  return {
    allowed: false,
    reason: "Этот тип сущности не поддерживает выведение из живого контура."
  };
}

async function collectIncomingReferences(targetEntityType, targetEntityId, deps, db) {
  const catalog = await loadDestructiveReferenceCatalog(deps, db);
  const publishedIncomingRefs = listIncomingGraphEntries(targetEntityType, targetEntityId, catalog, {
    excludedSourceId: targetEntityId,
    state: "published"
  }).map((entry) => buildGraphReferenceItem(entry, {
    reason: makeOperatorRefReason(entry.sourceEntityType, "published")
  }));
  const draftIncomingRefs = listIncomingGraphEntries(targetEntityType, targetEntityId, catalog, {
    excludedSourceId: targetEntityId,
    state: "draft",
    filter: (entry) => !isTestGraphEntry(entry)
  }).map((entry) => buildGraphReferenceItem(entry, {
    reason: makeOperatorRefReason(entry.sourceEntityType, "draft")
  }));

  return {
    publishedIncomingRefs: dedupeItems(
      publishedIncomingRefs,
      (item) => `${item.entityType}:${item.entityId}:${item.state}:${item.reason}`
    ),
    draftIncomingRefs: dedupeItems(
      draftIncomingRefs,
      (item) => `${item.entityType}:${item.entityId}:${item.state}:${item.reason}`
    ),
    blockers: dedupeStrings([
      ...publishedIncomingRefs.map((item) => item.reason),
      ...draftIncomingRefs.map((item) => item.reason)
    ])
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

  if (!isLiveDeactivationEntityTypeSupported(entityType)) {
    return buildUnsupportedResult(entityType, entityId);
  }

  const aggregate = await resolvedDeps.getEntityAggregate(entityId, db);

  if (!aggregate?.entity || aggregate.entity.entityType !== entityType) {
    return buildNotFoundResult(entityType, entityId);
  }

  const latestRevision = aggregate.revisions?.[0] ?? null;
  const publishedRevision = aggregate.activePublishedRevision ?? null;
  const blockers = [];
  const warnings = [];
  const reviewResidue = [];
  const openObligationItems = [];
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
  } else if (routeEffects.routeOutcome) {
    warnings.push(routeEffects.routeOutcome);
  }

  const incoming = await collectIncomingReferences(entityType, entityId, resolvedDeps, db);
  blockers.push(...incoming.blockers);

  if (entityType === ENTITY_TYPES.PAGE) {
    warnings.push("Привязанные landing workspace sessions будут считаться устаревшими, но сама страница сохранится в админке как историческая truth.");
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
    reviewResidue: dedupeItems(reviewResidue, (item) => `${item.kind}:${item.id}:${item.reason}`),
    openObligations: dedupeItems(openObligationItems, (item) => `${item.kind}:${item.id}:${item.reason}`),
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
    recordDestructiveEvent,
    ...deps
  };

  return resolvedDeps.withTransaction(async (db) => {
    const evaluation = await resolvedDeps.evaluateLiveDeactivation(input, { ...deps, db });
    const rootSnapshot = {
      entityId: evaluation.root?.entityId ?? input.entityId,
      entityType: evaluation.root?.entityType ?? input.entityType,
      label: evaluation.root?.label ?? input.entityId
    };

    if (!evaluation.allowed) {
      await resolvedDeps.recordDestructiveEvent({
        auditEventKey: AUDIT_EVENT_KEYS.LIVE_DEACTIVATION_BLOCKED,
        operationKind: "live_deactivation",
        outcome: "blocked",
        actorUserId: input.actorUserId ?? null,
        root: rootSnapshot,
        target: rootSnapshot,
        summary: "Снятие из живого контура отклонено правилами безопасности.",
        details: {
          entityType: evaluation.entityType,
          entityId: evaluation.entityId,
          blockers: evaluation.blockers ?? [],
          warnings: evaluation.warnings ?? [],
          publishedIncomingRefs: evaluation.publishedIncomingRefs ?? [],
          draftIncomingRefs: evaluation.draftIncomingRefs ?? [],
          reviewResidue: evaluation.reviewResidue ?? [],
          openObligations: evaluation.openObligations ?? [],
          routeEffects: evaluation.routeEffects ?? null
        }
      }, { db });

      return {
        executed: false,
        evaluation,
        revalidationPaths: []
      };
    }

    await resolvedDeps.clearEntityActivePublishedRevision(input.entityId, input.actorUserId, db);
    await resolvedDeps.recordDestructiveEvent({
      auditEventKey: AUDIT_EVENT_KEYS.LIVE_DEACTIVATED,
      operationKind: "live_deactivation",
      outcome: "executed",
      actorUserId: input.actorUserId ?? null,
      revisionId: evaluation.root?.activePublishedRevisionId ?? null,
      root: rootSnapshot,
      target: rootSnapshot,
      summary: "Сущность выведена из живого контура.",
      affectedEntities: [
        {
          entityId: input.entityId,
          entityType: input.entityType
        }
      ],
      details: {
        entityType: input.entityType,
        routePath: evaluation.routeEffects?.routePath ?? null,
        routeOutcome: evaluation.routeEffects?.routeOutcome ?? null,
        listImpact: evaluation.routeEffects?.listImpact ?? null,
        sitemapImpact: evaluation.routeEffects?.sitemapImpact ?? null,
        revalidationPaths: evaluation.routeEffects?.revalidationPaths ?? []
      }
    }, { db });

    return {
      executed: true,
      evaluation,
      revalidationPaths: evaluation.routeEffects?.revalidationPaths ?? []
    };
  });
}
