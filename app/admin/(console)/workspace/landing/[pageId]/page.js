import { notFound } from "next/navigation";

import { AdminShell } from "../../../../../../components/admin/AdminShell";
import { LandingWorkspaceStageAScreen } from "../../../../../../components/admin/LandingWorkspaceStageAScreen";
import { buildLandingWorkspaceHref, loadLandingWorkspacePageData } from "../../../../../../lib/admin/landing-workspace.js";
import { getPayloadLabel } from "../../../../../../lib/admin/entity-ui.js";
import { requireReviewUser } from "../../../../../../lib/admin/page-helpers";
import { userCanEditContent } from "../../../../../../lib/auth/session.js";
import { ENTITY_TYPES } from "../../../../../../lib/content-core/content-types.js";
import { normalizeLegacyCopy } from "../../../../../../lib/ui-copy.js";

function serializeLookupMap(map) {
  return Object.fromEntries(Array.from(map?.entries?.() ?? []));
}

export default async function LandingWorkspacePage({ params, searchParams }) {
  const { pageId } = await params;
  const user = await requireReviewUser();
  const query = await searchParams;
  const previewMode = typeof query?.preview === "string" ? query.preview : "desktop";
  const data = await loadLandingWorkspacePageData(pageId, { previewMode }, { actor: user });

  if (!data.entity || data.entity.entityType !== ENTITY_TYPES.PAGE || !data.sourceRevision) {
    notFound();
  }

  const canEdit = userCanEditContent(user) && !data.sessionConflict;
  const pageLabel = getPayloadLabel(data.sourceRevision.payload) || pageId;
  const workspaceHref = buildLandingWorkspaceHref(pageId);
  const sourceEditorHref = `/admin/entities/page/${pageId}`;
  const currentChangeIntent = normalizeLegacyCopy(
    data.workspaceMemoryCard?.editorialIntent?.changeIntent
      || data.currentRevision?.changeIntent
      || "Уточнить лендинг на основе страницы-источника."
  );
  const currentEditorialGoal = normalizeLegacyCopy(
    data.workspaceMemoryCard?.editorialIntent?.editorialGoal
      || "Уточнить лендинг на основе страницы-источника."
  );
  const currentVariantDirection = data.workspaceMemoryCard?.editorialIntent?.variantDirection || "";
  const reviewHref = data.sourceRevision?.state === "review"
    ? `/admin/review/${data.sourceRevision.id}`
    : data.currentRevision
      ? `/admin/review/${data.currentRevision.id}`
      : "";

  return (
    <AdminShell
      user={user}
      title={`Рабочая зона лендинга · ${pageLabel}`}
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: "AI-верстка", href: "/admin/workspace/landing" },
        { label: pageLabel }
      ]}
      activeHref="/admin/workspace/landing"
    >
      <LandingWorkspaceStageAScreen
        pageLabel={pageLabel}
        workspaceHref={workspaceHref}
        sourceEditorHref={sourceEditorHref}
        chooserHref="/admin/workspace/landing"
        canEdit={canEdit}
        sessionConflict={data.sessionConflict}
        message={typeof query?.message === "string" ? query.message : ""}
        error={typeof query?.error === "string" ? query.error : ""}
        previewMode={previewMode}
        currentRevision={data.currentRevision}
        reviewHref={reviewHref}
        initialDraft={data.derivedArtifactSlice?.draft}
        verificationReport={data.verificationReport}
        mediaOptions={data.mediaOptions}
        relationOptions={data.relationOptions}
        publishedLookupRecords={{
          services: serializeLookupMap(data.publishedLookups.serviceMap),
          cases: serializeLookupMap(data.publishedLookups.caseMap),
          galleries: serializeLookupMap(data.publishedLookups.galleryMap),
          media: serializeLookupMap(data.publishedLookups.mediaMap)
        }}
        currentChangeIntent={currentChangeIntent}
        currentEditorialGoal={currentEditorialGoal}
        currentVariantDirection={currentVariantDirection}
      />
    </AdminShell>
  );
}
