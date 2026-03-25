import { notFound } from "next/navigation";

import { AdminShell } from "../../../../../../components/admin/AdminShell";
import { ReadinessPanel } from "../../../../../../components/admin/ReadinessPanel";
import styles from "../../../../../../components/admin/admin-ui.module.css";
import { requirePublishUser } from "../../../../../../lib/admin/page-helpers";
import { findEntityById, findRevisionById } from "../../../../../../lib/content-core/repository";
import { evaluateReadiness } from "../../../../../../lib/content-ops/readiness";

export default async function PublishReadinessPage({ params, searchParams }) {
  const { revisionId } = await params;
  const user = await requirePublishUser();
  const revision = await findRevisionById(revisionId);

  if (!revision) {
    notFound();
  }

  const entity = await findEntityById(revision.entityId);
  const readiness = await evaluateReadiness({ entity, revision });
  const query = await searchParams;

  return (
    <AdminShell user={user} title="Publish readiness">
      <div className={styles.stack}>
        {query?.message ? <div className={styles.statusPanelInfo}>{query.message}</div> : null}
        <section className={styles.panel}>
          <h3>{revision.payload.title || revision.payload.h1 || entity.entityType}</h3>
          <p className={styles.mutedText}>Revision {revision.revisionNumber}</p>
          <p className={styles.mutedText}>Preview status: {revision.previewStatus}</p>
          {readiness.hasBlocking ? (
            <p className={styles.dangerText}>Publish disabled until blocking issues are resolved.</p>
          ) : (
            <p>Revision is eligible for explicit publish.</p>
          )}
          <div className={styles.inlineActions}>
            <form action={`/api/admin/revisions/${revision.id}/publish`} method="post">
              <button type="submit" className={styles.primaryButton} disabled={readiness.hasBlocking}>
                Publish
              </button>
            </form>
          </div>
        </section>
        <ReadinessPanel readiness={readiness} title="Publish checks" />
      </div>
    </AdminShell>
  );
}
