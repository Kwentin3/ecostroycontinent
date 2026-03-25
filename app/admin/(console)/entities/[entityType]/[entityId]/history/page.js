import { notFound } from "next/navigation";

import { ConfirmActionForm } from "../../../../../../../components/admin/ConfirmActionForm";
import { AdminShell } from "../../../../../../../components/admin/AdminShell";
import { RevisionDiffPanel } from "../../../../../../../components/admin/RevisionDiffPanel";
import styles from "../../../../../../../components/admin/admin-ui.module.css";
import { TimelineList } from "../../../../../../../components/admin/TimelineList";
import { requireEditorUser } from "../../../../../../../lib/admin/page-helpers";
import { ENTITY_TYPE_LABELS } from "../../../../../../../lib/content-core/content-types";
import { buildHumanReadableDiff } from "../../../../../../../lib/content-core/diff";
import { getEntityEditorState } from "../../../../../../../lib/content-core/service";
import { getAuditTimeline } from "../../../../../../../lib/content-ops/audit";

export default async function EntityHistoryPage({ params, searchParams }) {
  const { entityType, entityId } = await params;
  const user = await requireEditorUser();
  const state = await getEntityEditorState(entityId);
  const auditItems = await getAuditTimeline(entityId);
  const query = await searchParams;

  if (!state?.entity) {
    notFound();
  }

  return (
    <AdminShell user={user} title={`${ENTITY_TYPE_LABELS[entityType] || entityType} история`}>
      <div className={styles.stack}>
        {query?.error ? <div className={styles.statusPanelBlocking}>{query.error}</div> : null}
        {query?.message ? <div className={styles.statusPanelInfo}>{query.message}</div> : null}
        <section className={styles.panel}>
          <h3>Лента ревизий</h3>
          <div className={styles.stack}>
            {state.revisions.map((revision, index) => {
              const baseline = index === state.revisions.length - 1 ? state.activePublishedRevision : state.revisions[index + 1] ?? state.activePublishedRevision;
              const diffRows = buildHumanReadableDiff(state.entity.entityType, baseline?.payload ?? null, revision.payload);

              return (
                <article key={revision.id} className={styles.timelineItem}>
                  <div className={styles.badgeRow}>
                    <span className={styles.badge}>{revision.state}</span>
                    {revision.aiInvolvement ? <span className={styles.badge}>AI involved</span> : null}
                  </div>
                  <h4>Revision {revision.revisionNumber}</h4>
                  <p className={styles.mutedText}>{revision.changeIntent}</p>
                  <p className={styles.mutedText}>{revision.changeClass}</p>
                  <RevisionDiffPanel
                    title="Human-readable diff"
                    basisLabel={baseline ? `Compared against ${baseline.state === "published" ? "published baseline" : `revision #${baseline.revisionNumber}`}` : "Initial revision"}
                    rows={diffRows}
                    emptyLabel="No top-level changes to show."
                  />
                  {user.role === "superadmin" && revision.state === "published" ? (
                    <div className={styles.inlineActions}>
                      <ConfirmActionForm
                        action={`/api/admin/entities/${entityType}/${entityId}/rollback`}
                        confirmMessage={`Откатить к ревизии ${revision.revisionNumber}?`}
                        className={styles.inlineActions}
                      >
                        <input type="hidden" name="targetRevisionId" value={revision.id} />
                        <button type="submit" className={styles.secondaryButton}>Откатить к этой ревизии</button>
                      </ConfirmActionForm>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
        <section className={styles.panel}>
          <h3>Лента аудита</h3>
          <TimelineList items={auditItems} />
        </section>
      </div>
    </AdminShell>
  );
}
