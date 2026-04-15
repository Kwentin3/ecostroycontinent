import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "../../../../../components/admin/AdminShell";
import { PreviewViewport } from "../../../../../components/admin/PreviewViewport";
import { ReadinessPanel } from "../../../../../components/admin/ReadinessPanel";
import { LandingWorkspaceVerificationPanel } from "../../../../../components/admin/LandingWorkspaceVerificationPanel";
import { RevisionDiffPanel } from "../../../../../components/admin/RevisionDiffPanel";
import { SurfacePacket } from "../../../../../components/admin/SurfacePacket";
import styles from "../../../../../components/admin/admin-ui.module.css";
import { requireReviewUser } from "../../../../../lib/admin/page-helpers";
import { userCanPublishRevision } from "../../../../../lib/auth/session.js";
import { getPreviewTargetForField } from "../../../../../lib/admin/entity-ui";
import { CHANGE_INTENT_LABEL, getScreenLegend } from "../../../../../lib/admin/screen-copy.js";
import { ENTITY_TYPES } from "../../../../../lib/content-core/content-types.js";
import { buildHumanReadableDiff } from "../../../../../lib/content-core/diff.js";
import { findEntityById, findRevisionById } from "../../../../../lib/content-core/repository.js";
import { getAuditTimeline } from "../../../../../lib/content-ops/audit.js";
import { evaluateReadiness } from "../../../../../lib/content-ops/readiness.js";
import { buildPublishedLookups, getPublishedGlobalSettings } from "../../../../../lib/read-side/public-content";
import {
  getChangeClassLabel,
  getEntityTypeLabel,
  getOwnerApprovalStatusLabel,
  getPreviewStatusLabel,
  normalizeLegacyCopy
} from "../../../../../lib/ui-copy.js";
import { CasePage, ServicePage, StandalonePage } from "../../../../../components/public/PublicRenderers";

function renderPreview(entityType, payload, lookups, globalSettings, entityId = "") {
  if (entityType === ENTITY_TYPES.MEDIA_ASSET) {
    const previewUrl = payload.storageKey && entityId ? `/api/admin/media/${entityId}/preview` : "";

    return (
      <section className={styles.reviewMediaDetail}>
        <div className={styles.reviewMediaDetailPreview}>
          {previewUrl ? (
            <img src={previewUrl} alt={payload.alt || payload.title || "Медиа"} className={styles.reviewMediaDetailImage} />
          ) : (
            <div className={styles.reviewMediaDetailFallback}>М</div>
          )}
        </div>
        <div className={styles.reviewMediaDetailCopy}>
          <h3>{payload.title || "Медиа без названия"}</h3>
          <p>{payload.caption || payload.alt || "Проверьте, что фото и подпись соответствуют реальному материалу."}</p>
          {payload.alt ? <p className={styles.mutedText}>Описание: {payload.alt}</p> : null}
        </div>
      </section>
    );
  }

  if (entityType === ENTITY_TYPES.SERVICE) {
    const relatedCases = (payload.relatedCaseIds || []).map((id) => lookups.caseMap.get(id)).filter(Boolean);

    return (
      <ServicePage
        service={payload}
        relatedCases={relatedCases}
        galleries={(id) => lookups.galleryMap.get(id) || null}
        resolveMedia={(id) => lookups.mediaMap.get(id) || null}
        globalSettings={globalSettings}
      />
    );
  }

  if (entityType === ENTITY_TYPES.CASE) {
    const relatedServices = (payload.serviceIds || []).map((id) => lookups.serviceMap.get(id)).filter(Boolean);

    return (
      <CasePage
        item={payload}
        relatedServices={relatedServices}
        galleries={(id) => lookups.galleryMap.get(id) || null}
        resolveMedia={(id) => lookups.mediaMap.get(id) || null}
      />
    );
  }

  if (entityType === ENTITY_TYPES.PAGE) {
    return (
      <StandalonePage
        page={payload}
        globalSettings={globalSettings}
        services={(id) => lookups.serviceMap.get(id) || null}
        equipment={(id) => lookups.equipmentMap.get(id) || null}
        cases={(id) => lookups.caseMap.get(id) || null}
        galleries={(id) => lookups.galleryMap.get(id) || null}
        resolveMedia={(id) => lookups.mediaMap.get(id) || null}
      />
    );
  }

  return (
    <section className={styles.panel}>
      <pre>{JSON.stringify(payload, null, 2)}</pre>
    </section>
  );
}

export default async function ReviewDetailPage({ params, searchParams }) {
  const { revisionId } = await params;
  const user = await requireReviewUser();
  const revision = await findRevisionById(revisionId);

  if (!revision) {
    notFound();
  }

  const entity = await findEntityById(revision.entityId);
  const auditItems = await getAuditTimeline(entity.id);
  const readiness = await evaluateReadiness({ entity, revision });
  const lookups = await buildPublishedLookups();
  const globalSettings = await getPublishedGlobalSettings();
  const baseline = entity.activePublishedRevisionId ? await findRevisionById(entity.activePublishedRevisionId) : null;
  const diffRows = buildHumanReadableDiff(
    entity.entityType,
    baseline?.payload ?? null,
    revision.payload,
    (field) => getPreviewTargetForField(entity.entityType, field)
  );
  const query = await searchParams;
  const previewMode = typeof query?.preview === "string" ? query.preview : "desktop";
  const title = revision.payload.title || revision.payload.h1 || getEntityTypeLabel(entity.entityType);
  const publishHref = userCanPublishRevision(user, entity, revision)
    && (!revision.ownerReviewRequired || revision.ownerApprovalStatus === "approved")
    ? `/admin/revisions/${revision.id}/publish`
    : "";
  const publishWaitingForOwner = userCanPublishRevision(user, entity, revision)
    && revision.ownerReviewRequired
    && revision.ownerApprovalStatus !== "approved";
  const basisLabel = baseline
    ? `База сравнения: опубликованная версия №${baseline.revisionNumber}`
    : "База сравнения: опубликованной основы пока нет.";
  const ownerApprovalLabel = revision.ownerReviewRequired
    ? getOwnerApprovalStatusLabel(revision.ownerApprovalStatus)
    : "Согласование владельца не требуется";

  return (
    <AdminShell
      user={user}
      title="Проверка материала"
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
          eyebrow="Материал на согласование"
          title={title}
          summary={`${getEntityTypeLabel(entity.entityType)} · версия №${revision.revisionNumber} · ${getChangeClassLabel(revision.changeClass)}`}
          legend={getScreenLegend("reviewDetail")}
          meta={[
            `Статус владельца: ${ownerApprovalLabel}`,
            `Предпросмотр: ${getPreviewStatusLabel(revision.previewStatus)}`,
            revision.aiInvolvement ? "Подготовлено с участием ИИ" : null
          ].filter(Boolean)}
          bullets={[
            revision.changeIntent ? `${CHANGE_INTENT_LABEL}: ${normalizeLegacyCopy(revision.changeIntent)}` : "Проверьте, что материал передает именно ту услугу, кейс, страницу или медиа, которые должны быть опубликованы.",
            "Сначала смотрите сам материал, затем оставляйте замечание или принимайте решение."
          ]}
        />

        <SurfacePacket
          eyebrow="Содержимое материала"
          title="Посмотрите, что увидит посетитель"
          summary={`${basisLabel} Переключайте устройство в рамке предпросмотра, если хотите проверить разные размеры.`}
        >
          <PreviewViewport device={previewMode} hrefBase={`/admin/review/${revisionId}`} searchParams={query}>
            {renderPreview(entity.entityType, revision.payload, lookups, globalSettings, entity.id)}
          </PreviewViewport>
        </SurfacePacket>

        <RevisionDiffPanel
          title="Что изменилось"
          basisLabel={basisLabel}
          rows={diffRows}
          emptyLabel="Изменений верхнего уровня не найдено."
        />

        <SurfacePacket
          eyebrow="Решение собственника"
          title="Оставьте комментарий и выберите решение"
          summary="Комментарий можно оставить коротко и по сути: что подтвердить, что поправить или что не соответствует реальному материалу."
        >
          {user.role === "business_owner" || user.role === "superadmin" ? (
            <form action={`/api/admin/revisions/${revision.id}/owner-action`} method="post" className={styles.formGrid}>
              <label className={styles.label}>
                <span>Комментарий</span>
                <textarea
                  name="comment"
                  defaultValue={revision.reviewComment || ""}
                  placeholder="Например: формулировка верная, но фото нужно заменить / кейс подтверждаю / уточнить результат работ."
                />
              </label>
              <div className={styles.inlineActions}>
                <button type="submit" name="action" value="approve" className={styles.primaryButton}>Одобрить</button>
                <button type="submit" name="action" value="send_back" className={styles.secondaryButton}>Вернуть с замечанием</button>
                <button type="submit" name="action" value="reject" className={styles.dangerButton}>Отклонить</button>
              </div>
            </form>
          ) : (
            <p className={styles.mutedText}>Этот экран показывает решение владельца, но оставить его может только собственник или супер админ.</p>
          )}

          {publishHref ? (
            <div className={styles.inlineActions}>
              <Link href={publishHref} className={styles.secondaryButton}>Проверить перед публикацией</Link>
            </div>
          ) : null}
          {publishWaitingForOwner ? (
            <p className={styles.mutedText}>Путь к публикации откроется после согласования владельца.</p>
          ) : null}
        </SurfacePacket>

        <details className={styles.compactDisclosure}>
          <summary className={styles.compactDisclosureSummary}>
            <span className={styles.compactDisclosureMarker} aria-hidden="true" />
            <span className={styles.compactDisclosureSummaryMain}>
              <strong>Технические детали</strong>
              <span className={styles.compactDisclosureSummaryMeta}>Readiness и verification остаются доступными, но не мешают основному решению владельца.</span>
            </span>
          </summary>
          <div className={styles.compactDisclosureBody}>
            <div className={styles.stack}>
              <ReadinessPanel
                readiness={readiness}
                entityType={entity.entityType}
                navigationContext="preview"
                panelId="review-readiness"
                fallbackAnchorId="review-readiness"
                fallbackLabel="Блок готовности"
                title="Проверка готовности"
              />
              <LandingWorkspaceVerificationPanel
                auditItems={auditItems}
                readiness={readiness}
                revision={revision}
              />
            </div>
          </div>
        </details>
      </div>
    </AdminShell>
  );
}
