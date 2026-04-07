import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "../../../../../../components/admin/AdminShell";
import { LandingWorkspaceMemoryPanel } from "../../../../../../components/admin/LandingWorkspaceMemoryPanel";
import { LandingWorkspaceVerificationPanel } from "../../../../../../components/admin/LandingWorkspaceVerificationPanel";
import { PreviewViewport } from "../../../../../../components/admin/PreviewViewport";
import { SurfacePacket } from "../../../../../../components/admin/SurfacePacket";
import { StandalonePage } from "../../../../../../components/public/PublicRenderers";
import { loadLandingWorkspacePageData, buildLandingWorkspaceHref } from "../../../../../../lib/admin/landing-workspace.js";
import { requireReviewUser } from "../../../../../../lib/admin/page-helpers";
import { userCanEditContent } from "../../../../../../lib/auth/session.js";
import { ENTITY_TYPES } from "../../../../../../lib/content-core/content-types.js";
import { getPayloadLabel } from "../../../../../../lib/admin/entity-ui.js";
import { normalizeLegacyCopy } from "../../../../../../lib/ui-copy.js";
import { getCurrentSessionId } from "../../../../../../lib/auth/session.js";
import styles from "../../../../../../components/admin/admin-ui.module.css";

export default async function LandingWorkspacePage({ params, searchParams }) {
  const { pageId } = await params;
  const user = await requireReviewUser();
  const query = await searchParams;
  const previewMode = typeof query?.preview === "string" ? query.preview : "desktop";
  const data = await loadLandingWorkspacePageData(pageId, { previewMode }, { actor: user });

  if (!data.entity || data.entity.entityType !== ENTITY_TYPES.PAGE || !data.sourceRevision) {
    notFound();
  }

  const canEdit = userCanEditContent(user);
  const pageLabel = getPayloadLabel(data.sourceRevision.payload) || pageId;
  const workspaceHref = buildLandingWorkspaceHref(pageId);
  const sourceEditorHref = `/admin/entities/page/${pageId}`;
  const currentChangeIntent = data.workspaceMemoryCard?.editorialIntent?.changeIntent
    || data.currentRevision?.changeIntent
    || "Refine the landing page from canonical Page truth.";
  const currentEditorialGoal = data.workspaceMemoryCard?.editorialIntent?.editorialGoal
    || "Refine the landing page from canonical Page truth.";
  const currentVariantDirection = data.workspaceMemoryCard?.editorialIntent?.variantDirection || "";
  const currentSessionId = await getCurrentSessionId();

  return (
    <AdminShell
      user={user}
      title={`Landing workspace · ${pageLabel}`}
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: "Лендинги", href: "/admin/workspace/landing" },
        { label: pageLabel }
      ]}
      activeHref="/admin/workspace/landing"
      actions={
        <>
          <Link href={sourceEditorHref} className={styles.secondaryButton}>
            Открыть источник
          </Link>
          <Link href="/admin/workspace/landing" className={styles.secondaryButton}>
            К выбору
          </Link>
        </>
      }
    >
      <div className={styles.workspaceGrid}>
        <section className={styles.workspaceColumn}>
          <SurfacePacket
            eyebrow="Page truth"
            title={pageLabel}
            summary={`Canonical page owner: ${pageId}`}
            legend="The source editor remains the only truth-editing surface. This workspace only anchors to that Page truth."
            meta={[
              data.currentRevision ? `Draft revision: #${data.currentRevision.revisionNumber}` : "Draft revision: none",
              data.activePublishedRevision ? `Published base: #${data.activePublishedRevision.revisionNumber}` : "Published base: none",
              data.sourceRevision ? `Latest revision state: ${data.sourceRevision.state}` : "Latest revision state: unavailable"
            ]}
          >
            <div className={styles.inlineActions}>
              <Link href={sourceEditorHref} className={styles.secondaryButton}>
                Open source editor
              </Link>
              {currentSessionId ? (
                <Link href={workspaceHref} className={styles.secondaryButton}>
                  Refresh workspace anchor
                </Link>
              ) : null}
            </div>
          </SurfacePacket>

          <LandingWorkspaceMemoryPanel memoryCard={data.workspaceMemoryCard} />

          <SurfacePacket
            eyebrow="Turn log"
            title="Recent turn"
            summary="The turn log stays short and bounded so the workspace does not drift into chat-product semantics."
            legend="Track the last accepted change, blocker, and generation outcome here."
            bullets={[
              `Last change: ${normalizeLegacyCopy(data.workspaceMemoryCard?.recentTurn?.lastChange || "—")}`,
              `Last blocker: ${normalizeLegacyCopy(data.workspaceMemoryCard?.recentTurn?.lastBlocker || "—")}`,
              `Outcome: ${normalizeLegacyCopy(data.workspaceMemoryCard?.recentTurn?.generationOutcome || "—")}`
            ]}
          />
        </section>

        <section className={styles.workspaceColumn}>
          <SurfacePacket
            eyebrow="Preview"
            title="Derived page preview"
            summary="Preview and verification read the same derived artifact slice."
            legend="Change the device preview without changing the underlying candidate slice."
          >
            <PreviewViewport
              title="Preview"
              hint="Device toggles only the viewport. The derived slice stays the same."
              device={previewMode}
              hrefBase={workspaceHref}
              searchParams={query}
            >
              <StandalonePage
                page={data.derivedArtifactSlice.payload}
                globalSettings={data.globalSettings}
                services={(id) => data.publishedLookups.serviceMap.get(id) || null}
                cases={(id) => data.publishedLookups.caseMap.get(id) || null}
                galleries={(id) => data.publishedLookups.galleryMap.get(id) || null}
                resolveMedia={(id) => data.publishedLookups.mediaMap.get(id) || null}
              />
            </PreviewViewport>
          </SurfacePacket>

          <SurfacePacket
            eyebrow="Intent composer"
            title="Bounded landing instruction"
            summary="Keep the instruction short and specific. The source editor remains the canonical editing surface."
            legend="This composer only steers the next candidate generation. It does not edit Page truth directly."
          >
            {canEdit ? (
              <form action={`/api/admin/workspace/landing/${pageId}`} method="post" className={styles.formGrid}>
                <input type="hidden" name="previewMode" value={previewMode} />
                <input type="hidden" name="editorialGoal" value={currentEditorialGoal} />
                <input type="hidden" name="variantDirection" value={currentVariantDirection} />
                <label className={styles.label}>
                  <span>Change intent</span>
                  <textarea
                    name="changeIntent"
                    defaultValue={currentChangeIntent}
                    placeholder="What should the landing page change next?"
                    required
                  />
                </label>
                <div className={styles.inlineActions}>
                  <button type="submit" name="actionKind" value="generate_candidate" className={styles.primaryButton}>
                    {data.currentRevision ? "Обновить черновик" : "Сгенерировать черновик"}
                  </button>
                  {data.currentRevision ? (
                    <button type="submit" name="actionKind" value="send_to_review" className={styles.secondaryButton}>
                      Отправить на проверку
                    </button>
                  ) : null}
                </div>
              </form>
            ) : (
              <p className={styles.mutedText}>
                Эту поверхность могут редактировать только seo_manager и superadmin. business_owner видит
                отчет, превью и обзор проверки.
              </p>
            )}
          </SurfacePacket>
        </section>

        <section className={`${styles.workspaceColumn} ${styles.stickyPanel}`}>
          <LandingWorkspaceVerificationPanel
            derivedArtifactSlice={data.derivedArtifactSlice}
            readiness={data.readiness}
            revision={data.sourceRevision}
            auditItems={data.auditItems}
            report={data.verificationReport}
          />

          <SurfacePacket
            eyebrow="Review handoff"
            title="Next step"
            summary="The workspace can hand off to the existing review flow without creating a second publish path."
            legend="Use the existing review page for approvals and the source editor for truth edits."
            meta={[
              data.currentRevision ? `Draft revision #${data.currentRevision.revisionNumber}` : "No draft revision yet",
              data.sourceRevision?.state === "review" ? "Already in review" : "Not yet in review"
            ]}
          >
            {data.sourceRevision?.state === "review" ? (
              <Link href={`/admin/review/${data.sourceRevision.id}`} className={styles.primaryButton}>
                Open review
              </Link>
            ) : data.currentRevision ? (
              <Link href={`/admin/review/${data.currentRevision.id}`} className={styles.secondaryButton}>
                Open draft review
              </Link>
            ) : (
              <p className={styles.mutedText}>Create a draft first, then hand it off to review.</p>
            )}
          </SurfacePacket>
        </section>
      </div>
    </AdminShell>
  );
}
