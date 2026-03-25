import { NextResponse } from "next/server";

import { getBoolean, getString, getStringArray } from "../../../../../../lib/admin/form-data";
import { redirectWithError, redirectWithQuery } from "../../../../../../lib/admin/operation-feedback";
import { userCanEditContent } from "../../../../../../lib/auth/session";
import { requireRouteUser } from "../../../../../../lib/admin/route-helpers";
import { saveDraft } from "../../../../../../lib/content-core/service";

function buildPayload(entityType, formData) {
  const common = {
    title: getString(formData, "title"),
    h1: getString(formData, "h1"),
    slug: getString(formData, "slug"),
    intro: getString(formData, "intro"),
    body: getString(formData, "body"),
    summary: getString(formData, "summary"),
    serviceScope: getString(formData, "serviceScope"),
    problemsSolved: getString(formData, "problemsSolved"),
    methods: getString(formData, "methods"),
    ctaVariant: getString(formData, "ctaVariant"),
    location: getString(formData, "location"),
    projectType: getString(formData, "projectType"),
    task: getString(formData, "task"),
    workScope: getString(formData, "workScope"),
    result: getString(formData, "result"),
    primaryMediaAssetId: getString(formData, "primaryMediaAssetId"),
    primaryAssetId: getString(formData, "primaryAssetId"),
    caption: getString(formData, "caption"),
    publicBrandName: getString(formData, "publicBrandName"),
    legalName: getString(formData, "legalName"),
    primaryPhone: getString(formData, "primaryPhone"),
    publicEmail: getString(formData, "publicEmail"),
    serviceArea: getString(formData, "serviceArea"),
    primaryRegion: getString(formData, "primaryRegion"),
    defaultCtaLabel: getString(formData, "defaultCtaLabel"),
    defaultCtaDescription: getString(formData, "defaultCtaDescription"),
    organizationCity: getString(formData, "organizationCity"),
    organizationCountry: getString(formData, "organizationCountry"),
    contactTruthConfirmed: getBoolean(formData, "contactTruthConfirmed"),
    relatedCaseIds: getStringArray(formData, "relatedCaseIds"),
    galleryIds: getStringArray(formData, "galleryIds"),
    serviceIds: getStringArray(formData, "serviceIds"),
    caseIds: getStringArray(formData, "caseIds"),
    assetIds: getStringArray(formData, "assetIds"),
    relatedEntityIds: getStringArray(formData, "relatedEntityIds"),
    activeMessengers: getStringArray(formData, "activeMessengers"),
    pageType: getString(formData, "pageType"),
    contactNote: getString(formData, "contactNote"),
    ctaTitle: getString(formData, "ctaTitle"),
    ctaBody: getString(formData, "ctaBody"),
    defaultBlockCtaLabel: getString(formData, "defaultBlockCtaLabel"),
    metaTitle: getString(formData, "metaTitle"),
    metaDescription: getString(formData, "metaDescription"),
    canonicalIntent: getString(formData, "canonicalIntent"),
    indexationFlag: getString(formData, "indexationFlag") || "index",
    openGraphTitle: getString(formData, "openGraphTitle"),
    openGraphDescription: getString(formData, "openGraphDescription"),
    openGraphImageAssetId: getString(formData, "openGraphImageAssetId")
  };

  if (entityType === "gallery") {
    return {
      title: common.title,
      primaryAssetId: common.primaryAssetId,
      assetIds: common.assetIds,
      caption: common.caption,
      relatedEntityIds: common.relatedEntityIds,
      metaTitle: common.metaTitle,
      metaDescription: common.metaDescription,
      canonicalIntent: common.canonicalIntent,
      indexationFlag: common.indexationFlag,
      openGraphTitle: common.openGraphTitle,
      openGraphDescription: common.openGraphDescription,
      openGraphImageAssetId: common.openGraphImageAssetId
    };
  }

  return common;
}

export async function POST(request, { params }) {
  const { user, response } = await requireRouteUser(request);

  if (response) {
    return response;
  }

  if (!userCanEditContent(user)) {
    return NextResponse.redirect(new URL("/admin/no-access", request.url));
  }

  const { entityType } = await params;
  const formData = await request.formData();
  const entityId = getString(formData, "entityId");
  const changeIntent = getString(formData, "changeIntent") || "Draft saved from editor.";

  try {
    const result = await saveDraft({
      entityType,
      entityId: entityId || null,
      userId: user.id,
      changeIntent,
      payload: buildPayload(entityType, formData)
    });

    return redirectWithQuery(request, `/admin/entities/${entityType}/${result.entity.id}`, {
      message: "Draft saved"
    });
  } catch (error) {
    const fallbackPath = entityId ? `/admin/entities/${entityType}/${entityId}` : `/admin/entities/${entityType}/new`;
    return redirectWithError(request, fallbackPath, error);
  }
}
