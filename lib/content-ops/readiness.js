import {
  findEntityById,
  findEntityByPublishedSlugCollision,
  findEntityByTypeSingleton,
  findPublishedPageTypeCollision,
  findRevisionById,
  getEntityAggregate,
  listPublishObligations
} from "../content-core/repository";
import { ENTITY_TYPES, PAGE_TYPES } from "../content-core/content-types";

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
    results.push(makeResult("blocking", "missing_brand_name", "Public brand name is required.", "publicBrandName"));
  }

  if (payload.contactTruthConfirmed) {
    if (!hasText(payload.primaryPhone)) {
      results.push(makeResult("blocking", "missing_primary_phone", "Confirmed contact truth requires a primary phone.", "primaryPhone"));
    }

    if (!hasText(payload.serviceArea)) {
      results.push(makeResult("blocking", "missing_service_area", "Confirmed contact truth requires service area wording.", "serviceArea"));
    }
  } else {
    results.push(makeResult("info", "contact_truth_unconfirmed", "Public contact truth is not yet confirmed."));
  }

  return results;
}

async function evaluateMediaAsset(payload) {
  const results = [];

  if (!hasText(payload.storageKey)) {
    results.push(makeResult("blocking", "missing_storage_key", "Media asset must have a storage binding before publish.", "storageKey"));
  }

  if (!hasText(payload.alt)) {
    results.push(makeResult("warning", "missing_alt", "Alt text is recommended for public-facing media.", "alt"));
  }

  if (!hasText(payload.ownershipNote)) {
    results.push(makeResult("warning", "missing_ownership_note", "Ownership note is recommended for media provenance.", "ownershipNote"));
  }

  return results;
}

async function evaluateGallery(payload) {
  const results = [];

  if ((payload.assetIds ?? []).length === 0) {
    results.push(makeResult("blocking", "empty_gallery", "Gallery must reference at least one media asset.", "assetIds"));
  } else if (!(await refsExist(payload.assetIds))) {
    results.push(makeResult("blocking", "invalid_asset_refs", "Gallery contains missing media references.", "assetIds"));
  } else if (!(await publishedRefsExist(payload.assetIds))) {
    results.push(makeResult("blocking", "unpublished_asset_refs", "Gallery may reference only published media assets.", "assetIds"));
  }

  results.push(...await validateOptionalPublishedRef(
    payload.primaryAssetId,
    "primaryAssetId",
    "invalid_primary_asset_ref",
    "unpublished_primary_asset_ref",
    "Gallery primary asset reference is missing.",
    "Gallery primary asset must be published before publish."
  ));

  return results;
}

async function evaluateService(entityId, payload) {
  const results = [];

  if (!hasText(payload.slug)) {
    results.push(makeResult("blocking", "missing_slug", "Service slug is required.", "slug"));
  } else {
    const collision = await findEntityByPublishedSlugCollision(ENTITY_TYPES.SERVICE, payload.slug, entityId);

    if (collision) {
      results.push(makeResult("blocking", "slug_collision", "Another published service already owns this slug.", "slug"));
    }
  }

  if (!hasText(payload.title) || !hasText(payload.h1) || !hasText(payload.summary) || !hasText(payload.serviceScope)) {
    results.push(makeResult("blocking", "missing_service_minimum", "Service needs title, H1, summary and service scope."));
  }

  if (!hasText(payload.ctaVariant)) {
    results.push(makeResult("blocking", "missing_cta", "Service requires CTA variant before publish.", "ctaVariant"));
  }

  const proofPathCount =
    (payload.relatedCaseIds?.length ?? 0) +
    (payload.galleryIds?.length ?? 0) +
    (hasText(payload.primaryMediaAssetId) ? 1 : 0);

  if (proofPathCount === 0) {
    results.push(makeResult("blocking", "missing_proof_path", "Service cannot publish without a proof path."));
  }

  if ((payload.relatedCaseIds ?? []).length > 0) {
    if (!(await refsExist(payload.relatedCaseIds))) {
      results.push(makeResult("blocking", "invalid_case_refs", "Service contains missing case references.", "relatedCaseIds"));
    } else if (!(await publishedRefsExist(payload.relatedCaseIds))) {
      results.push(makeResult("blocking", "unpublished_case_refs", "Service may reference only published cases at publish time.", "relatedCaseIds"));
    }
  }

  if ((payload.galleryIds ?? []).length > 0) {
    if (!(await refsExist(payload.galleryIds))) {
      results.push(makeResult("blocking", "invalid_gallery_refs", "Service contains missing gallery references.", "galleryIds"));
    } else if (!(await publishedRefsExist(payload.galleryIds))) {
      results.push(makeResult("blocking", "unpublished_gallery_refs", "Service may reference only published galleries at publish time.", "galleryIds"));
    }
  }

  results.push(...await validateOptionalPublishedRef(
    payload.primaryMediaAssetId,
    "primaryMediaAssetId",
    "invalid_primary_media_ref",
    "unpublished_primary_media_ref",
    "Service primary media reference is missing.",
    "Service primary media must be published before publish."
  ));

  return results;
}

async function evaluateCase(entityId, payload) {
  const results = [];

  if (!hasText(payload.slug)) {
    results.push(makeResult("blocking", "missing_slug", "Case slug is required.", "slug"));
  } else {
    const collision = await findEntityByPublishedSlugCollision(ENTITY_TYPES.CASE, payload.slug, entityId);

    if (collision) {
      results.push(makeResult("blocking", "slug_collision", "Another published case already owns this slug.", "slug"));
    }
  }

  if (!hasText(payload.title) || !hasText(payload.location) || !hasText(payload.task) || !hasText(payload.workScope) || !hasText(payload.result)) {
    results.push(makeResult("blocking", "missing_case_minimum", "Case needs title, location, task, work scope and result."));
  }

  const visualProofCount = (payload.galleryIds?.length ?? 0) + (hasText(payload.primaryMediaAssetId) ? 1 : 0);

  if (visualProofCount === 0) {
    results.push(makeResult("blocking", "missing_visual_proof", "Case cannot publish without minimum visual proof."));
  }

  if ((payload.galleryIds ?? []).length > 0) {
    if (!(await refsExist(payload.galleryIds))) {
      results.push(makeResult("blocking", "invalid_gallery_refs", "Case contains missing gallery references.", "galleryIds"));
    } else if (!(await publishedRefsExist(payload.galleryIds))) {
      results.push(makeResult("blocking", "unpublished_gallery_refs", "Case may reference only published galleries at publish time.", "galleryIds"));
    }
  }

  if ((payload.serviceIds ?? []).length > 0) {
    if (!(await refsExist(payload.serviceIds))) {
      results.push(makeResult("blocking", "invalid_service_refs", "Case contains missing service references.", "serviceIds"));
    } else if (!(await publishedRefsExist(payload.serviceIds))) {
      results.push(makeResult("blocking", "unpublished_service_refs", "Case may reference only published services at publish time.", "serviceIds"));
    }
  }

  results.push(...await validateOptionalPublishedRef(
    payload.primaryMediaAssetId,
    "primaryMediaAssetId",
    "invalid_primary_media_ref",
    "unpublished_primary_media_ref",
    "Case primary media reference is missing.",
    "Case primary media must be published before publish."
  ));

  return results;
}

async function evaluatePage(entityId, payload) {
  const results = [];

  if (!hasText(payload.title) || !hasText(payload.h1)) {
    results.push(makeResult("blocking", "missing_page_basics", "Page title and H1 are required."));
  }

  if ((payload.blocks ?? []).length === 0) {
    results.push(makeResult("blocking", "missing_blocks", "Page must contain structured blocks."));
  }

  if (payload.pageType === PAGE_TYPES.ABOUT && payload.slug !== "about") {
    results.push(makeResult("blocking", "about_slug_fixed", "About page slug must stay `about`.", "slug"));
  }

  if (payload.pageType === PAGE_TYPES.CONTACTS && payload.slug !== "contacts") {
    results.push(makeResult("blocking", "contacts_slug_fixed", "Contacts page slug must stay `contacts`.", "slug"));
  }

  const collision = await findPublishedPageTypeCollision(payload.pageType, entityId);

  if (collision) {
    results.push(makeResult("blocking", "page_type_collision", "Another published page already owns this fixed page type.", "pageType"));
  }

  results.push(...await validateOptionalPublishedRef(
    payload.primaryMediaAssetId,
    "primaryMediaAssetId",
    "invalid_primary_media_ref",
    "unpublished_primary_media_ref",
    "Page primary media reference is missing.",
    "Page primary media must be published before publish."
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
      results.push(makeResult("blocking", "contacts_truth_unconfirmed", "Contacts page cannot publish until contact truth is confirmed."));
    }

    if (!settingsRevision?.payload?.primaryPhone) {
      results.push(makeResult("blocking", "contacts_missing_phone", "Contacts page requires primary phone from Global Settings."));
    }

    if (!settingsRevision?.payload?.serviceArea) {
      results.push(makeResult("blocking", "contacts_missing_service_area", "Contacts page requires service area from Global Settings."));
    }
  }

  const openObligations = await listPublishObligations(entity.id);

  if (openObligations.some((obligation) => obligation.status === "open")) {
    results.push(makeResult("blocking", "open_publish_obligations", "Entity has unresolved slug-change obligations."));
  }

  const hasBlocking = results.some((result) => result.severity === "blocking");

  return {
    results,
    hasBlocking,
    summary: hasBlocking
      ? "Blocking checks remain."
      : results.some((result) => result.severity === "warning")
        ? "Ready with warnings."
        : "Ready."
  };
}
