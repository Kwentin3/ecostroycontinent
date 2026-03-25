import { notFound } from "next/navigation";

import { ConfirmActionForm } from "../../../../../../components/admin/ConfirmActionForm";
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
    <AdminShell user={user} title="Готовность к публикации">
      <div className={styles.stack}>
        {query?.error ? <div className={styles.statusPanelBlocking}>{query.error}</div> : null}
        {query?.message ? <div className={styles.statusPanelInfo}>{query.message}</div> : null}
        <section className={styles.panel}>
          <h3>{revision.payload.title || revision.payload.h1 || entity.entityType}</h3>
          <p className={styles.mutedText}>Ревизия {revision.revisionNumber}</p>
          <p className={styles.mutedText}>Статус preview: {revision.previewStatus}</p>
          {readiness.hasBlocking ? (
            <p className={styles.dangerText}>Публикация недоступна, пока не закрыты blocking issues.</p>
          ) : (
            <p>Ревизия готова к explicit publish.</p>
          )}
          <div className={styles.inlineActions}>
            <ConfirmActionForm action={`/api/admin/revisions/${revision.id}/publish`} confirmMessage="Опубликовать эту ревизию?">
              <button type="submit" className={styles.primaryButton} disabled={readiness.hasBlocking}>
                Опубликовать
              </button>
            </ConfirmActionForm>
          </div>
        </section>
        <ReadinessPanel readiness={readiness} title="Проверки публикации" />
      </div>
    </AdminShell>
  );
}
