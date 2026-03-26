import { notFound } from "next/navigation";

import { ConfirmActionForm } from "../../../../../../components/admin/ConfirmActionForm";
import { AdminShell } from "../../../../../../components/admin/AdminShell";
import { ReadinessPanel } from "../../../../../../components/admin/ReadinessPanel";
import { SurfacePacket } from "../../../../../../components/admin/SurfacePacket";
import styles from "../../../../../../components/admin/admin-ui.module.css";
import { requirePublishUser } from "../../../../../../lib/admin/page-helpers";
import { findEntityById, findRevisionById } from "../../../../../../lib/content-core/repository";
import { evaluateReadiness } from "../../../../../../lib/content-ops/readiness";
import { getEntityTypeLabel, getPreviewStatusLabel, normalizeLegacyCopy } from "../../../../../../lib/ui-copy.js";

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
  const title = revision.payload.title || revision.payload.h1 || getEntityTypeLabel(entity.entityType);
  const sideEffects = [
    "Опубликованная версия станет активной для посетителей.",
    "Карта сайта обновится после публикации.",
    "По необходимости будет отправлен сигнал для поисковых систем."
  ];

  return (
    <AdminShell
      user={user}
      title="Проверка перед публикацией"
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: "Проверка", href: "/admin/review" },
        { label: title }
      ]}
      activeHref="/admin/review"
    >
      <div className={styles.stack}>
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}
        <SurfacePacket
          eyebrow="Проверка перед выпуском"
          title={title}
          summary={`Версия №${revision.revisionNumber} · Статус предпросмотра: ${getPreviewStatusLabel(revision.previewStatus)}`}
          bullets={[
            readiness.hasBlocking ? "Публикация пока заблокирована проверкой готовности." : "Версия готова к явной публикации.",
            ...sideEffects
          ]}
        >
          <div className={styles.inlineActions}>
            <ConfirmActionForm action={`/api/admin/revisions/${revision.id}/publish`} confirmMessage="Опубликовать эту версию?">
              <button type="submit" className={styles.primaryButton} disabled={readiness.hasBlocking}>
                Опубликовать
              </button>
            </ConfirmActionForm>
          </div>
        </SurfacePacket>
        <ReadinessPanel readiness={readiness} title="Проверки публикации" />
      </div>
    </AdminShell>
  );
}
