import { notFound } from "next/navigation";

import { AdminShell } from "../../../../../components/admin/AdminShell";
import { RevisionDiffPanel } from "../../../../../components/admin/RevisionDiffPanel";
import { ReadinessPanel } from "../../../../../components/admin/ReadinessPanel";
import { CasePage, ServicePage, StandalonePage } from "../../../../../components/public/PublicRenderers";
import styles from "../../../../../components/admin/admin-ui.module.css";
import { requireReviewUser } from "../../../../../lib/admin/page-helpers";
import { ENTITY_TYPES } from "../../../../../lib/content-core/content-types.js";
import { buildHumanReadableDiff } from "../../../../../lib/content-core/diff.js";
import { findEntityById, findRevisionById } from "../../../../../lib/content-core/repository.js";
import { evaluateReadiness } from "../../../../../lib/content-ops/readiness.js";
import { buildPublishedLookups, getPublishedGlobalSettings } from "../../../../../lib/read-side/public-content";
import { getChangeClassLabel, getEntityTypeLabel, getPreviewStatusLabel, normalizeLegacyCopy } from "../../../../../lib/ui-copy.js";

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
  const diffRows = buildHumanReadableDiff(entity.entityType, baseline?.payload ?? null, revision.payload);
  const query = await searchParams;
  const basisLabel = baseline
    ? `База предпросмотра: опубликованная версия №${baseline.revisionNumber}`
    : "База предпросмотра: опубликованной основы пока нет.";

  return (
    <AdminShell user={user} title="Проверка и согласование">
      <div className={styles.stack}>
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}
        <div className={styles.split}>
          <section className={styles.panel}>
            <p className={styles.eyebrow}>Режим согласования</p>
            <h3>{revision.payload.title || revision.payload.h1 || getEntityTypeLabel(entity.entityType)}</h3>
            <p className={styles.mutedText}>Версия №{revision.revisionNumber} | {getChangeClassLabel(revision.changeClass)}</p>
            <p>{normalizeLegacyCopy(revision.changeIntent)}</p>
            <div className={styles.badgeRow}>
              <span className={styles.badge}>Предпросмотр: {getPreviewStatusLabel(revision.previewStatus)}</span>
              {revision.ownerReviewRequired ? <span className={styles.badge}>Требуется согласование владельца</span> : null}
              {revision.aiInvolvement ? <span className={styles.badge}>С участием ИИ</span> : null}
            </div>
            <RevisionDiffPanel
              title="Понятные изменения"
              basisLabel={basisLabel}
              rows={diffRows}
              emptyLabel="Изменений верхнего уровня нет."
            />
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
            <ReadinessPanel readiness={readiness} title="Проверка готовности" />
          </section>
          <section className={styles.panel}>
            <p className={styles.eyebrow}>Предпросмотр версии</p>
            <p className={styles.mutedText}>{basisLabel} Связанные сущности и медиа берутся из опубликованных данных.</p>
            {renderPreview(entity.entityType, revision.payload, lookups, globalSettings)}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
