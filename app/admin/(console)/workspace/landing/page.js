import Link from "next/link";

import { AdminShell } from "../../../../../components/admin/AdminShell";
import { SurfacePacket } from "../../../../../components/admin/SurfacePacket";
import { loadLandingWorkspaceChooserData, buildLandingWorkspaceHref } from "../../../../../lib/admin/landing-workspace.js";
import { requireReviewUser } from "../../../../../lib/admin/page-helpers";
import { readWorkspaceSessionRecord } from "../../../../../lib/ai-workspace/memory-card.js";
import { getCurrentSessionId } from "../../../../../lib/auth/session.js";
import { getPayloadLabel } from "../../../../../lib/admin/entity-ui.js";
import { normalizeLegacyCopy } from "../../../../../lib/ui-copy.js";
import styles from "../../../../../components/admin/admin-ui.module.css";

export default async function LandingWorkspaceChooserPage({ searchParams }) {
  const user = await requireReviewUser();
  const query = await searchParams;
  const sessionId = await getCurrentSessionId();
  const sessionRow = sessionId ? await readWorkspaceSessionRecord(sessionId) : null;
  const data = await loadLandingWorkspaceChooserData({ sessionRow });
  const currentPageCard = data.pageCards.find((card) => card.entity.id === data.currentSessionPageId) ?? null;

  return (
    <AdminShell
      user={user}
      title="Landing workspace"
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: "Лендинги" }
      ]}
      activeHref="/admin/workspace/landing"
    >
      <div className={styles.stack}>
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}

        <SurfacePacket
          eyebrow="Workspace chooser"
          title="Landing workspace chooser"
          summary="Choose the Page owner first. The workspace never creates Page truth, it only anchors to it."
          legend="Use this surface to resume an existing page session or enter a page-owned landing workspace."
          meta={[
            currentPageCard ? `Current page: ${getPayloadLabel(currentPageCard.latestRevision?.payload)}` : "Current page: none",
            data.currentSessionPageId ? `Page id: ${data.currentSessionPageId}` : "Page id: unanchored"
          ]}
        >
          {data.currentSessionPageId ? (
            <Link href={buildLandingWorkspaceHref(data.currentSessionPageId)} className={styles.primaryButton}>
              Resume current workspace
            </Link>
          ) : (
            <p className={styles.mutedText}>No active page anchor yet. Open any page below to create the first workspace session for that page.</p>
          )}
        </SurfacePacket>

        <section className={styles.panel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Page</th>
                <th>Latest revision</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.pageCards.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <div className={styles.emptyState}>
                      <p className={styles.mutedText}>Страниц пока нет.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.pageCards.map((card) => {
                  const href = buildLandingWorkspaceHref(card.entity.id);
                  const label = getPayloadLabel(card.latestRevision?.payload);
                  return (
                    <tr key={card.entity.id}>
                      <td>
                        <div className={styles.cockpitCoverageSummary}>
                          <strong>{label}</strong>
                          <span className={styles.mutedText}>{card.entity.id}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.cockpitCoverageSummary}>
                          <strong>{card.latestRevision ? `Версия №${card.latestRevision.revisionNumber}` : "Версий пока нет"}</strong>
                          <span className={styles.mutedText}>{card.latestRevision ? card.latestRevision.state : "draft"}</span>
                        </div>
                      </td>
                      <td>
                        <Link href={href} className={styles.secondaryButton}>
                          Открыть workspace
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </div>
    </AdminShell>
  );
}
