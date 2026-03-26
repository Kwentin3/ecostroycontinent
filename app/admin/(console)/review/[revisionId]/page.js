import { notFound } from "next/navigation";

import { AdminShell } from "../../../../../components/admin/AdminShell";
import { PreviewViewport } from "../../../../../components/admin/PreviewViewport";
import { ReadinessPanel } from "../../../../../components/admin/ReadinessPanel";
import { RevisionDiffPanel } from "../../../../../components/admin/RevisionDiffPanel";
import { SurfacePacket } from "../../../../../components/admin/SurfacePacket";
import styles from "../../../../../components/admin/admin-ui.module.css";
import { requireReviewUser } from "../../../../../lib/admin/page-helpers";
import { getPreviewTargetForField } from "../../../../../lib/admin/entity-ui";
import { ENTITY_TYPES } from "../../../../../lib/content-core/content-types.js";
import { buildHumanReadableDiff } from "../../../../../lib/content-core/diff.js";
import { findEntityById, findRevisionById } from "../../../../../lib/content-core/repository.js";
import { evaluateReadiness } from "../../../../../lib/content-ops/readiness.js";
import { buildPublishedLookups, getPublishedGlobalSettings } from "../../../../../lib/read-side/public-content";
import { getChangeClassLabel, getEntityTypeLabel, getPreviewStatusLabel, normalizeLegacyCopy } from "../../../../../lib/ui-copy.js";
import { CasePage, ServicePage, StandalonePage } from "../../../../../components/public/PublicRenderers";

function renderPreview(entityType, payload, lookups, globalSettings) {
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
  const title = revision.payload.title || revision.payload.h1 || getEntityTypeLabel(entity.entityType);
  const basisLabel = baseline
    ? `База предпросмотра: опубликованная версия №${baseline.revisionNumber}`
    : "База предпросмотра: опубликованной основы пока нет.";

  return (
    <AdminShell
      user={user}
      title="Проверка и согласование"
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
        <div className={styles.split}>
          <section className={styles.stack}>
            <SurfacePacket
              eyebrow="Карточка решения"
              title={title}
              summary={`Версия №${revision.revisionNumber} · ${getChangeClassLabel(revision.changeClass)}`}
              meta={[
                `Предпросмотр: ${getPreviewStatusLabel(revision.previewStatus)}`,
                revision.ownerReviewRequired ? "Нужно согласование владельца" : "Согласование владельца не требуется",
                revision.aiInvolvement ? "С участием ИИ" : null
              ].filter(Boolean)}
              bullets={[
                `Что изменилось: ${normalizeLegacyCopy(revision.changeIntent)}`,
                "Комментарий лучше писать конкретно: какое поле или блок нужно поправить.",
                "Сначала читайте изменения, затем выбирайте решение."
              ]}
            >
              {user.role === "business_owner" || user.role === "superadmin" ? (
                <form action={`/api/admin/revisions/${revision.id}/owner-action`} method="post" className={styles.formGrid}>
                  <label className={styles.label}>
                    <span>Комментарий</span>
                    <textarea name="comment" defaultValue={revision.reviewComment || ""} />
                  </label>
                  <div className={styles.inlineActions}>
                    <button type="submit" name="action" value="approve" className={styles.primaryButton}>Одобрить</button>
                    <button type="submit" name="action" value="reject" className={styles.secondaryButton}>Отклонить</button>
                    <button type="submit" name="action" value="send_back" className={styles.dangerButton}>Вернуть с комментарием</button>
                  </div>
                </form>
              ) : (
                <p className={styles.mutedText}>Сначала проверьте готовность и предпросмотр, затем дождитесь решения владельца, если оно требуется.</p>
              )}
            </SurfacePacket>

            <ReadinessPanel readiness={readiness} title="Проверка готовности" defaultOpen />

            <RevisionDiffPanel
              title="Понятные изменения"
              basisLabel={basisLabel}
              rows={diffRows}
              emptyLabel="Изменений верхнего уровня нет."
            />
          </section>

          <section className={`${styles.stack} ${styles.stickyPanel}`}>
            <SurfacePacket
              eyebrow="Предпросмотр версии"
              title="Что увидит посетитель"
              summary={`${basisLabel}. Связанные сущности и медиа берутся из опубликованных данных.`}
            >
              <PreviewViewport>
                {renderPreview(entity.entityType, revision.payload, lookups, globalSettings)}
              </PreviewViewport>
            </SurfacePacket>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
