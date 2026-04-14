import { NextResponse } from "next/server.js";

import { buildEntityPayload } from "../../../../../../lib/admin/entity-form-data.js";
import { normalizeEntityCreationOrigin } from "../../../../../../lib/admin/entity-origin.js";
import { getString } from "../../../../../../lib/admin/form-data.js";
import { redirectToAdmin, redirectWithError, redirectWithQuery, toOperatorMessage } from "../../../../../../lib/admin/operation-feedback.js";
import { FEEDBACK_COPY } from "../../../../../../lib/ui-copy.js";
import { userCanEditContent } from "../../../../../../lib/auth/session.js";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers.js";
import { getEntityAggregate } from "../../../../../../lib/content-core/repository.js";
import { ENTITY_TYPES, PAGE_CREATE_MODES, PAGE_TYPES } from "../../../../../../lib/content-core/content-types.js";
import { saveDraft } from "../../../../../../lib/content-core/service.js";

function getWorkingRevisionPayload(aggregate) {
  const currentDraft = aggregate?.revisions?.find((revision) => revision.state === "draft");
  return currentDraft?.payload || aggregate?.activePublishedRevision?.payload || null;
}

async function buildPageCreatePayload(formPayload, formData) {
  const createMode = getString(formData, "createMode") || PAGE_CREATE_MODES.STANDALONE;

  if (createMode === PAGE_CREATE_MODES.CLONE_ADAPT) {
    const cloneFromPageId = getString(formData, "cloneFromPageId");

    if (!cloneFromPageId) {
      throw new Error("Для режима копии нужно выбрать исходную страницу.");
    }

    const cloneAggregate = await getEntityAggregate(cloneFromPageId);
    const clonePayload = getWorkingRevisionPayload(cloneAggregate);

    if (!clonePayload) {
      throw new Error("Не удалось прочитать исходную страницу для копии.");
    }

    return {
      ...clonePayload,
      title: formPayload.title || clonePayload.title,
      h1: formPayload.h1 || formPayload.title || clonePayload.h1 || clonePayload.title,
      slug: formPayload.slug || `${clonePayload.slug || "page"}-copy`,
      targeting: {
        ...(clonePayload.targeting || {}),
        geoLabel: formPayload.geoLabel || clonePayload.targeting?.geoLabel || "",
        city: formPayload.city || clonePayload.targeting?.city || "",
        district: formPayload.district || clonePayload.targeting?.district || "",
        serviceArea: formPayload.serviceArea || clonePayload.targeting?.serviceArea || ""
      }
    };
  }

  if (createMode === PAGE_CREATE_MODES.FROM_SERVICE) {
    const primaryServiceId = getString(formData, "primaryServiceId");

    if (!primaryServiceId) {
      throw new Error("Для страницы услуги нужно выбрать источник «Услуга».");
    }

    const serviceAggregate = await getEntityAggregate(primaryServiceId);
    const servicePayload = getWorkingRevisionPayload(serviceAggregate);

    if (!servicePayload) {
      throw new Error("Не удалось прочитать выбранную услугу.");
    }

    return {
      ...formPayload,
      pageType: PAGE_TYPES.SERVICE_LANDING,
      seedSlug: servicePayload.slug,
      title: formPayload.title || servicePayload.title,
      h1: formPayload.h1 || formPayload.title || servicePayload.h1 || servicePayload.title,
      intro: formPayload.intro || servicePayload.summary || "",
      primaryMediaAssetId: formPayload.primaryMediaAssetId || servicePayload.primaryMediaAssetId || "",
      serviceScope: servicePayload.serviceScope || "",
      defaultBlockCtaLabel: servicePayload.ctaVariant || "",
      sourceRefs: {
        primaryServiceId,
        primaryEquipmentId: "",
        caseIds: servicePayload.relatedCaseIds || [],
        galleryIds: servicePayload.galleryIds || []
      },
      targeting: {
        geoLabel: formPayload.geoLabel || "",
        city: formPayload.city || "",
        district: formPayload.district || "",
        serviceArea: formPayload.serviceArea || ""
      }
    };
  }

  if (createMode === PAGE_CREATE_MODES.FROM_EQUIPMENT) {
    const primaryEquipmentId = getString(formData, "primaryEquipmentId");

    if (!primaryEquipmentId) {
      throw new Error("Для страницы техники нужно выбрать источник «Техника».");
    }

    const equipmentAggregate = await getEntityAggregate(primaryEquipmentId);
    const equipmentPayload = getWorkingRevisionPayload(equipmentAggregate);

    if (!equipmentPayload) {
      throw new Error("Не удалось прочитать выбранную технику.");
    }

    return {
      ...formPayload,
      pageType: PAGE_TYPES.EQUIPMENT_LANDING,
      seedSlug: equipmentPayload.slug,
      title: formPayload.title || equipmentPayload.title,
      h1: formPayload.h1 || formPayload.title || equipmentPayload.title,
      intro: formPayload.intro || equipmentPayload.shortSummary || "",
      primaryMediaAssetId: formPayload.primaryMediaAssetId || equipmentPayload.primaryMediaAssetId || "",
      equipmentSummary: equipmentPayload.capabilitySummary || "",
      equipmentSpecs: equipmentPayload.keySpecs || [],
      sourceRefs: {
        primaryServiceId: "",
        primaryEquipmentId,
        caseIds: equipmentPayload.relatedCaseIds || [],
        galleryIds: equipmentPayload.galleryIds || []
      },
      targeting: {
        geoLabel: formPayload.geoLabel || "",
        city: formPayload.city || "",
        district: formPayload.district || "",
        serviceArea: formPayload.serviceArea || ""
      }
    };
  }

  return {
    ...formPayload,
    pageType: formPayload.pageType || PAGE_TYPES.ABOUT
  };
}

export async function POST(request, { params }, deps = {}) {
  const routeDeps = {
    requireRouteUser,
    userCanEditContent,
    saveDraft,
    ...deps
  };
  const { user, response } = await routeDeps.requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!routeDeps.userCanEditContent(user)) {
    return redirectToAdmin("/admin/no-access");
  }

  const { entityType } = await params;
  const formData = await request.formData();
  const entityId = getString(formData, "entityId");
  const changeIntent = getString(formData, "changeIntent") || "Черновик сохранён из редактора.";
  const creationOrigin = normalizeEntityCreationOrigin(getString(formData, "creationOrigin"));
  const redirectMode = getString(formData, "redirectMode");
  const successRedirectTo = getString(formData, "redirectTo");
  const failureRedirectTo = getString(formData, "failureRedirectTo");
  const responseMode = getString(formData, "responseMode");
  // If this route is used to create temporary smoke/audit/remediation entities,
  // their human-visible title must start with `test__...` so cleanup can classify
  // them as disposable artifacts later. Do not introduce unmarked test objects here.

  try {
    const payload = entityType === ENTITY_TYPES.PAGE
      ? await buildPageCreatePayload(buildEntityPayload(entityType, formData), formData)
      : buildEntityPayload(entityType, formData);
    const result = await routeDeps.saveDraft({
      entityType,
      entityId: entityId || null,
      userId: user.id,
      changeIntent,
      payload,
      creationOrigin
    });

    const successPath = redirectMode === "page_workspace" && entityType === "page"
      ? `/admin/entities/page/${result.entity.id}`
      : (successRedirectTo || `/admin/entities/${entityType}/${result.entity.id}`);

    if (responseMode === "json") {
      return NextResponse.json({
        ok: true,
        message: FEEDBACK_COPY.draftSaved,
        redirectTo: successPath,
        entity: result.entity,
        revision: result.revision,
        changedFields: result.changedFields
      });
    }

    return redirectWithQuery(request, successPath, {
      message: FEEDBACK_COPY.draftSaved
    });
  } catch (error) {
    if (responseMode === "json") {
      return NextResponse.json({
        ok: false,
        error: toOperatorMessage(error)
      }, { status: 400 });
    }

    if (redirectMode === "page_workspace" && entityType === "page" && !entityId && failureRedirectTo) {
      return redirectWithQuery(request, failureRedirectTo, {
        error: toOperatorMessage(error),
        createPageType: getString(formData, "pageType") || "about",
        createMode: getString(formData, "createMode") || PAGE_CREATE_MODES.STANDALONE,
        primaryServiceId: getString(formData, "primaryServiceId"),
        primaryEquipmentId: getString(formData, "primaryEquipmentId"),
        cloneFromPageId: getString(formData, "cloneFromPageId"),
        createTitle: getString(formData, "title")
      });
    }

    const fallbackPath = failureRedirectTo || (entityId ? `/admin/entities/${entityType}/${entityId}` : `/admin/entities/${entityType}/new`);
    return redirectWithError(request, fallbackPath, error);
  }
}
