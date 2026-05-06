import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ConfirmActionForm } from "../../../../../../components/admin/ConfirmActionForm";
import { AdminShell } from "../../../../../../components/admin/AdminShell";
import { ReadinessPanel } from "../../../../../../components/admin/ReadinessPanel";
import { SurfacePacket } from "../../../../../../components/admin/SurfacePacket";
import styles from "../../../../../../components/admin/admin-ui.module.css";
import { getEntityAdminHref } from "../../../../../../lib/admin/entity-links.js";
import { requireAdminUser } from "../../../../../../lib/admin/page-helpers";
import { appendAdminReturnTo, normalizeAdminReturnTo } from "../../../../../../lib/admin/relation-navigation.js";
import { getScreenLegend } from "../../../../../../lib/admin/screen-copy.js";
import { getPublishActionCopy } from "../../../../../../lib/admin/workflow-status.js";
import { userCanPublishRevision } from "../../../../../../lib/auth/session.js";
import { findEntityById, findRevisionById } from "../../../../../../lib/content-core/repository";
import { evaluateReadiness } from "../../../../../../lib/content-ops/readiness";
import { getEntityTypeLabel, getPreviewStatusLabel, normalizeLegacyCopy } from "../../../../../../lib/ui-copy.js";

function getEntityListHref(entityType) {
  if (entityType === "media_asset" || entityType === "gallery") {
    return "/admin/entities/media_asset";
  }

  return `/admin/entities/${entityType}`;
}

export default async function PublishReadinessPage({ params, searchParams }) {
  const { revisionId } = await params;
  const user = await requireAdminUser();
  const revision = await findRevisionById(revisionId);

  if (!revision) {
    notFound();
  }

  const entity = await findEntityById(revision.entityId);

  if (!entity) {
    notFound();
  }

  if (!userCanPublishRevision(user, entity, revision)) {
    redirect("/admin/no-access");
  }

  const readiness = await evaluateReadiness({ entity, revision });
  const query = await searchParams;
  const normalizedReturnTo = normalizeAdminReturnTo(query?.returnTo);
  const title = revision.payload.title || revision.payload.h1 || getEntityTypeLabel(entity.entityType);
  const activePublishedRevision = entity.activePublishedRevisionId
    ? await findRevisionById(entity.activePublishedRevisionId)
    : null;
  const publishAction = getPublishActionCopy({ activePublishedRevision });
  const hasLivePublishedRevision = Boolean(activePublishedRevision);
  const entityHref = appendAdminReturnTo(getEntityAdminHref(entity.entityType, entity.id), normalizedReturnTo);
  const entityListHref = getEntityListHref(entity.entityType);
  const sideEffects = [
    hasLivePublishedRevision
      ? "После публикации текущая live-версия будет заменена этой редакцией."
      : "После публикации карточка станет доступной для включения в live-контур.",
    "Согласование уже завершено на экране проверки.",
    "Карта сайта обновится после публикации.",
    "По необходимости будет отправлен сигнал для поисковых систем."
  ];

  return (
    <AdminShell
      user={user}
      title="Публикация"
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: getEntityTypeLabel(entity.entityType), href: entityListHref },
        { label: title, href: entityHref },
        { label: "Публикация" }
      ]}
      activeHref={entityListHref}
      actions={<Link href={entityHref} className={styles.secondaryButton}>Вернуться к карточке</Link>}
    >
      <div className={styles.stack}>
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}
        <ReadinessPanel
          readiness={readiness}
          entityType={entity.entityType}
          navigationContext="preview"
          panelId="publish-readiness"
          fallbackAnchorId="publish-readiness"
          fallbackLabel="Блок готовности"
          title="Проверка перед публикацией"
          defaultOpen
        />
        <SurfacePacket
          eyebrow="Публикация"
          title={title}
          summary={`Версия №${revision.revisionNumber} · Статус предпросмотра: ${getPreviewStatusLabel(revision.previewStatus)}`}
          legend={getScreenLegend("publishReadiness")}
          bullets={[
            readiness.hasBlocking ? "Публикация пока заблокирована проверкой готовности." : "Версия готова к явной публикации.",
            ...sideEffects
          ]}
        >
          <div className={styles.inlineActions}>
            <ConfirmActionForm action={`/api/admin/revisions/${revision.id}/publish`} confirmMessage={publishAction.confirmMessage}>
              <button type="submit" className={`${styles.primaryButton} ${styles.stretchButton}`} disabled={readiness.hasBlocking}>
                {publishAction.label}
              </button>
            </ConfirmActionForm>
          </div>
        </SurfacePacket>
      </div>
    </AdminShell>
  );
}
