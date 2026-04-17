import {
  findEntityById,
  findEntityByPublishedSlugCollision,
  findEntityByTypeSingleton,
  findPublishedPageTypeCollision,
  findRevisionById,
  getEntityAggregate,
  listPublishObligations
} from "../content-core/repository.js";
import {
  ENTITY_TYPES,
  PAGE_SECTION_TYPES,
  PAGE_TYPES
} from "../content-core/content-types.js";
import { isLegacyNonLaunchPageType, isStrictPageOwnershipLaunchMode } from "../public-launch/ownership.js";

function makeResult(severity, code, message, field = null) {
  return {
    severity,
    code,
    message,
    field
  };
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

async function refsExist(ids) {
  const existing = await Promise.all(ids.map((id) => findEntityById(id)));
  return existing.every(Boolean);
}

async function publishedRefsExist(entityIds) {
  const aggregates = await Promise.all(entityIds.map((id) => getEntityAggregate(id)));
  return aggregates.every((aggregate) => aggregate?.activePublishedRevision);
}

async function validateOptionalPublishedRef(entityId, field, missingCode, unpublishedCode, missingMessage, unpublishedMessage) {
  if (!hasText(entityId)) {
    return [];
  }

  const exists = await refsExist([entityId]);

  if (!exists) {
    return [makeResult("blocking", missingCode, missingMessage, field)];
  }

  const published = await publishedRefsExist([entityId]);

  if (!published) {
    return [makeResult("blocking", unpublishedCode, unpublishedMessage, field)];
  }

  return [];
}

async function getPublishedGlobalSettingsRevision() {
  const entity = await findEntityByTypeSingleton(ENTITY_TYPES.GLOBAL_SETTINGS);

  if (!entity?.activePublishedRevisionId) {
    return null;
  }

  return findRevisionById(entity.activePublishedRevisionId);
}

async function evaluateGlobalSettings(payload) {
  const results = [];

  if (!hasText(payload.publicBrandName)) {
    results.push(makeResult("blocking", "missing_brand_name", "Требуется публичное название.", "publicBrandName"));
  }

  if (payload.contactTruthConfirmed) {
    if (!hasText(payload.primaryPhone)) {
      results.push(makeResult("blocking", "missing_primary_phone", "При подтвержденных контактах нужен основной телефон.", "primaryPhone"));
    }

    if (!hasText(payload.serviceArea)) {
      results.push(makeResult("blocking", "missing_service_area", "При подтвержденных контактах нужна зона обслуживания.", "serviceArea"));
    }
  } else {
    results.push(makeResult("info", "contact_truth_unconfirmed", "Контактные данные еще не подтверждены."));
  }

  return results;
}

async function evaluateMediaAsset(payload) {
  const results = [];

  if (!hasText(payload.storageKey)) {
    results.push(makeResult("blocking", "missing_storage_key", "Перед публикацией у медиафайла должен быть файл в хранилище.", "storageKey"));
  }

  if (!hasText(payload.alt)) {
    results.push(makeResult("warning", "missing_alt", "Лучше добавить описание изображения.", "alt"));
  }

  if (!hasText(payload.ownershipNote)) {
    results.push(makeResult("warning", "missing_ownership_note", "Лучше указать примечание о правах.", "ownershipNote"));
  }

  return results;
}

async function evaluateGallery(payload) {
  const results = [];

  if ((payload.assetIds ?? []).length === 0) {
    results.push(makeResult("blocking", "empty_gallery", "Галерея должна содержать хотя бы один медиафайл.", "assetIds"));
  } else if (!(await refsExist(payload.assetIds))) {
    results.push(makeResult("blocking", "invalid_asset_refs", "В галерее есть ссылки на отсутствующие медиафайлы.", "assetIds"));
  } else if (!(await publishedRefsExist(payload.assetIds))) {
    results.push(makeResult("blocking", "unpublished_asset_refs", "В галерее можно использовать только опубликованные медиафайлы.", "assetIds"));
  }

  results.push(...await validateOptionalPublishedRef(
    payload.primaryAssetId,
    "primaryAssetId",
    "invalid_primary_asset_ref",
    "unpublished_primary_asset_ref",
    "Не указан основной медиафайл галереи.",
    "Основной медиафайл галереи должен быть опубликован до публикации."
  ));

  return results;
}

async function evaluateService(entityId, payload) {
  const results = [];

  if (!hasText(payload.slug)) {
    results.push(makeResult("blocking", "missing_slug", "Требуется короткий адрес услуги.", "slug"));
  } else {
    const collision = await findEntityByPublishedSlugCollision(ENTITY_TYPES.SERVICE, payload.slug, entityId);

    if (collision) {
      results.push(makeResult("blocking", "slug_collision", "У другой опубликованной услуги уже есть этот адрес.", "slug"));
    }
  }

  if (!hasText(payload.title) || !hasText(payload.h1) || !hasText(payload.summary) || !hasText(payload.serviceScope)) {
    results.push(makeResult("blocking", "missing_service_minimum", "Для услуги нужны название, H1, краткое описание и состав работ."));
  }

  if (!hasText(payload.ctaVariant)) {
    results.push(makeResult("blocking", "missing_cta", "Для услуги нужен текст кнопки.", "ctaVariant"));
  }

  const proofPathCount =
    (payload.relatedCaseIds?.length ?? 0)
    + (payload.galleryIds?.length ?? 0)
    + (hasText(payload.primaryMediaAssetId) ? 1 : 0);

  if (proofPathCount === 0) {
    results.push(makeResult("blocking", "missing_proof_path", "У услуги должен быть хотя бы один подтверждающий материал."));
  }

  if ((payload.relatedCaseIds ?? []).length > 0) {
    if (!(await refsExist(payload.relatedCaseIds))) {
      results.push(makeResult("blocking", "invalid_case_refs", "В услуге есть ссылки на отсутствующие кейсы.", "relatedCaseIds"));
    } else if (!(await publishedRefsExist(payload.relatedCaseIds))) {
      results.push(makeResult("blocking", "unpublished_case_refs", "В услуге можно ссылаться только на опубликованные кейсы.", "relatedCaseIds"));
    }
  }

  if ((payload.galleryIds ?? []).length > 0) {
    if (!(await refsExist(payload.galleryIds))) {
      results.push(makeResult("blocking", "invalid_gallery_refs", "В услуге есть ссылки на отсутствующие галереи.", "galleryIds"));
    } else if (!(await publishedRefsExist(payload.galleryIds))) {
      results.push(makeResult("blocking", "unpublished_gallery_refs", "В услуге можно ссылаться только на опубликованные галереи.", "galleryIds"));
    }
  }

  results.push(...await validateOptionalPublishedRef(
    payload.primaryMediaAssetId,
    "primaryMediaAssetId",
    "invalid_primary_media_ref",
    "unpublished_primary_media_ref",
    "Не указан основной медиафайл услуги.",
    "Основной медиафайл услуги должен быть опубликован до публикации."
  ));

  return results;
}

async function evaluateEquipment(entityId, payload) {
  const results = [];

  if (!hasText(payload.slug)) {
    results.push(makeResult("blocking", "missing_slug", "Для техники нужен короткий адрес.", "slug"));
  } else {
    const collision = await findEntityByPublishedSlugCollision(ENTITY_TYPES.EQUIPMENT, payload.slug, entityId);

    if (collision) {
      results.push(makeResult("blocking", "slug_collision", "У другой опубликованной техники уже есть этот адрес.", "slug"));
    }
  }

  if (!hasText(payload.title) || !hasText(payload.equipmentType) || !hasText(payload.shortSummary) || !hasText(payload.capabilitySummary)) {
    results.push(makeResult("blocking", "missing_equipment_minimum", "Для техники нужны название, тип, краткое описание и описание возможностей."));
  }

  if ((payload.keySpecs ?? []).length === 0) {
    results.push(makeResult("blocking", "missing_specs", "Для техники нужна хотя бы одна характеристика.", "keySpecs"));
  }

  if ((payload.usageScenarios ?? []).length === 0) {
    results.push(makeResult("warning", "missing_usage_scenarios", "Лучше указать сценарии применения техники.", "usageScenarios"));
  }

  results.push(...await validateOptionalPublishedRef(
    payload.primaryMediaAssetId,
    "primaryMediaAssetId",
    "invalid_primary_media_ref",
    "unpublished_primary_media_ref",
    "Не указан основной медиафайл техники.",
    "Основной медиафайл техники должен быть опубликован до публикации."
  ));

  return results;
}

async function evaluateCase(entityId, payload) {
  const results = [];

  if (!hasText(payload.slug)) {
    results.push(makeResult("blocking", "missing_slug", "Требуется короткий адрес кейса.", "slug"));
  } else {
    const collision = await findEntityByPublishedSlugCollision(ENTITY_TYPES.CASE, payload.slug, entityId);

    if (collision) {
      results.push(makeResult("blocking", "slug_collision", "У другого опубликованного кейса уже есть этот адрес.", "slug"));
    }
  }

  if (!hasText(payload.title) || !hasText(payload.location) || !hasText(payload.task) || !hasText(payload.workScope) || !hasText(payload.result)) {
    results.push(makeResult("blocking", "missing_case_minimum", "Для кейса нужны название, локация, задача, объем работ и результат."));
  }

  const visualProofCount = (payload.galleryIds?.length ?? 0) + (hasText(payload.primaryMediaAssetId) ? 1 : 0);

  if (visualProofCount === 0) {
    results.push(makeResult("blocking", "missing_visual_proof", "Кейс нельзя публиковать без визуального подтверждения."));
  }

  if ((payload.galleryIds ?? []).length > 0) {
    if (!(await refsExist(payload.galleryIds))) {
      results.push(makeResult("blocking", "invalid_gallery_refs", "В кейсе есть ссылки на отсутствующие галереи.", "galleryIds"));
    } else if (!(await publishedRefsExist(payload.galleryIds))) {
      results.push(makeResult("blocking", "unpublished_gallery_refs", "В кейсе можно ссылаться только на опубликованные галереи.", "galleryIds"));
    }
  }

  if ((payload.serviceIds ?? []).length > 0) {
    if (!(await refsExist(payload.serviceIds))) {
      results.push(makeResult("blocking", "invalid_service_refs", "В кейсе есть ссылки на отсутствующие услуги.", "serviceIds"));
    } else if (!(await publishedRefsExist(payload.serviceIds))) {
      results.push(makeResult("blocking", "unpublished_service_refs", "В кейсе можно ссылаться только на опубликованные услуги.", "serviceIds"));
    }
  }

  results.push(...await validateOptionalPublishedRef(
    payload.primaryMediaAssetId,
    "primaryMediaAssetId",
    "invalid_primary_media_ref",
    "unpublished_primary_media_ref",
    "Не указан основной медиафайл кейса.",
    "Основной медиафайл кейса должен быть опубликован до публикации."
  ));

  return results;
}

async function evaluatePage(entityId, payload) {
  const results = [];
  const sourceRefs = payload.sourceRefs || {};
  const sections = Array.isArray(payload.sections) ? payload.sections : [];
  const sectionTypes = new Set(sections.map((section) => section?.type).filter(Boolean));

  if (!hasText(payload.title) || !hasText(payload.h1)) {
    results.push(makeResult("blocking", "missing_page_basics", "Для страницы нужны заголовок и H1."));
  }

  if (sections.length === 0) {
    results.push(makeResult("blocking", "missing_sections", "Страница должна содержать структурные секции."));
  }

  if (isStrictPageOwnershipLaunchMode() && isLegacyNonLaunchPageType(payload.pageType)) {
    results.push(
      makeResult(
        "blocking",
        "legacy_page_type_non_launch",
        "Тип страницы отмечен как legacy non-launch и заблокирован для launch-публикации.",
        "pageType"
      )
    );
  }

  if (payload.pageType === PAGE_TYPES.ABOUT && payload.slug !== "about") {
    results.push(makeResult("blocking", "about_slug_fixed", "У страницы «О нас» адрес должен оставаться about.", "slug"));
  }

  if (payload.pageType === PAGE_TYPES.CONTACTS && payload.slug !== "contacts") {
    results.push(makeResult("blocking", "contacts_slug_fixed", "У страницы «Контакты» адрес должен оставаться contacts.", "slug"));
  }

  if (payload.pageType === PAGE_TYPES.ABOUT || payload.pageType === PAGE_TYPES.CONTACTS) {
    const collision = await findPublishedPageTypeCollision(payload.pageType, entityId);

    if (collision) {
      results.push(makeResult("blocking", "page_type_collision", "Другая опубликованная страница уже заняла этот тип.", "pageType"));
    }
  } else if (!hasText(payload.slug)) {
    results.push(makeResult("blocking", "missing_slug", "Для посадочной страницы нужен slug.", "slug"));
  } else {
    const collision = await findEntityByPublishedSlugCollision(ENTITY_TYPES.PAGE, payload.slug, entityId);

    if (collision) {
      results.push(makeResult("blocking", "slug_collision", "У другой опубликованной страницы уже есть этот адрес.", "slug"));
    }
  }

  if (payload.pageType === PAGE_TYPES.SERVICE_LANDING && !hasText(sourceRefs.primaryServiceId)) {
    results.push(makeResult("blocking", "missing_primary_service", "Для страницы услуги нужен привязанный источник «Услуга».", "sourceRefs.primaryServiceId"));
  }

  if (payload.pageType === PAGE_TYPES.EQUIPMENT_LANDING && !hasText(sourceRefs.primaryEquipmentId)) {
    results.push(makeResult("blocking", "missing_primary_equipment", "Для страницы техники нужен привязанный источник «Техника».", "sourceRefs.primaryEquipmentId"));
  }

  const requiredSectionTypes = payload.pageType === PAGE_TYPES.SERVICE_LANDING
    ? [
        PAGE_SECTION_TYPES.HERO_OFFER,
        PAGE_SECTION_TYPES.SERVICE_SCOPE,
        PAGE_SECTION_TYPES.GEO_COVERAGE,
        PAGE_SECTION_TYPES.PROOF_CASES,
        PAGE_SECTION_TYPES.CTA
      ]
    : payload.pageType === PAGE_TYPES.EQUIPMENT_LANDING
      ? [
          PAGE_SECTION_TYPES.HERO_OFFER,
          PAGE_SECTION_TYPES.EQUIPMENT_SUMMARY,
          PAGE_SECTION_TYPES.EQUIPMENT_SPECS,
          PAGE_SECTION_TYPES.GEO_COVERAGE,
          PAGE_SECTION_TYPES.PROOF_CASES,
          PAGE_SECTION_TYPES.CTA
        ]
      : payload.pageType === PAGE_TYPES.CONTACTS
        ? [
            PAGE_SECTION_TYPES.HERO_OFFER,
            PAGE_SECTION_TYPES.RICH_TEXT,
            PAGE_SECTION_TYPES.CONTACT_DETAILS,
            PAGE_SECTION_TYPES.GEO_COVERAGE
          ]
        : [
            PAGE_SECTION_TYPES.HERO_OFFER,
            PAGE_SECTION_TYPES.RICH_TEXT,
            PAGE_SECTION_TYPES.CTA
          ];

  for (const sectionType of requiredSectionTypes) {
    if (!sectionTypes.has(sectionType)) {
      results.push(makeResult("blocking", "missing_required_section", `Не хватает секции «${sectionType}».`, "sections"));
    }
  }

  results.push(...await validateOptionalPublishedRef(
    payload.primaryMediaAssetId,
    "primaryMediaAssetId",
    "invalid_primary_media_ref",
    "unpublished_primary_media_ref",
    "Не указан основной медиафайл страницы.",
    "Основной медиафайл страницы должен быть опубликован до публикации."
  ));

  return results;
}

export async function evaluateReadiness({ entity, revision, globalSettingsRevision }) {
  const results = [];
  const settingsRevision = globalSettingsRevision ?? await getPublishedGlobalSettingsRevision();

  switch (entity.entityType) {
    case ENTITY_TYPES.GLOBAL_SETTINGS:
      results.push(...(await evaluateGlobalSettings(revision.payload)));
      break;
    case ENTITY_TYPES.MEDIA_ASSET:
      results.push(...(await evaluateMediaAsset(revision.payload)));
      break;
    case ENTITY_TYPES.GALLERY:
      results.push(...(await evaluateGallery(revision.payload)));
      break;
    case ENTITY_TYPES.SERVICE:
      results.push(...(await evaluateService(entity.id, revision.payload)));
      break;
    case ENTITY_TYPES.EQUIPMENT:
      results.push(...(await evaluateEquipment(entity.id, revision.payload)));
      break;
    case ENTITY_TYPES.CASE:
      results.push(...(await evaluateCase(entity.id, revision.payload)));
      break;
    case ENTITY_TYPES.PAGE:
      results.push(...(await evaluatePage(entity.id, revision.payload)));
      break;
    default:
      break;
  }

  if (entity.entityType === ENTITY_TYPES.PAGE && revision.payload.pageType === PAGE_TYPES.CONTACTS) {
    if (!settingsRevision?.payload?.contactTruthConfirmed) {
      results.push(makeResult("blocking", "contacts_truth_unconfirmed", "Страницу «Контакты» нельзя публиковать, пока не подтверждены контактные данные."));
    }

    if (!settingsRevision?.payload?.primaryPhone) {
      results.push(makeResult("blocking", "contacts_missing_phone", "Для страницы «Контакты» нужен основной телефон из глобальных настроек."));
    }

    if (!settingsRevision?.payload?.serviceArea) {
      results.push(makeResult("blocking", "contacts_missing_service_area", "Для страницы «Контакты» нужна зона обслуживания из глобальных настроек."));
    }
  }

  const openObligations = await listPublishObligations(entity.id);

  if (openObligations.some((obligation) => obligation.status === "open")) {
    results.push(makeResult("blocking", "open_publish_obligations", "У сущности остались незавершенные обязательства по публикации."));
  }

  const blocking = results.filter((result) => result.severity === "blocking");
  const warnings = results.filter((result) => result.severity === "warning");
  const info = results.filter((result) => result.severity === "info");

  return {
    entityId: entity.id,
    hasBlocking: blocking.length > 0,
    results,
    blockingCount: blocking.length,
    warningCount: warnings.length,
    infoCount: info.length
  };
}
