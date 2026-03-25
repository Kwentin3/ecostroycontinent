import { notFound } from "next/navigation";

import { AdminShell } from "../../../../../../../components/admin/AdminShell";
import styles from "../../../../../../../components/admin/admin-ui.module.css";
import { TimelineList } from "../../../../../../../components/admin/TimelineList";
import { requireEditorUser } from "../../../../../../../lib/admin/page-helpers";
import { getEntityEditorState } from "../../../../../../../lib/content-core/service";
import { getAuditTimeline } from "../../../../../../../lib/content-ops/audit";

export default async function EntityHistoryPage({ params }) {
  const { entityType, entityId } = await params;
  const user = await requireEditorUser();
  const state = await getEntityEditorState(entityId);
  const auditItems = await getAuditTimeline(entityId);

  if (!state?.entity) {
    notFound();
  }

  return (
    <AdminShell user={user} title={`${entityType} history`}>
      <div className={styles.stack}>
        <section className={styles.panel}>
          <h3>Revision timeline</h3>
          <div className={styles.timeline}>
            {state.revisions.map((revision) => (
              <article key={revision.id} className={styles.timelineItem}>
                <div className={styles.badgeRow}>
                  <span className={styles.badge}>{revision.state}</span>
                  {revision.aiInvolvement ? <span className={styles.badge}>AI involved</span> : null}
                </div>
                <h4>Revision {revision.revisionNumber}</h4>
                <p className={styles.mutedText}>{revision.changeIntent}</p>
                <p className={styles.mutedText}>{revision.changeClass}</p>
              </article>
            ))}
          </div>
        </section>
        <section className={styles.panel}>
          <h3>Audit timeline</h3>
          <TimelineList items={auditItems} />
        </section>
      </div>
    </AdminShell>
  );
}
