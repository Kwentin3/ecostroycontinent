import { notFound } from "next/navigation";

import { AdminShell } from "../../../../../components/admin/AdminShell";
import { RevisionDiffPanel } from "../../../../../components/admin/RevisionDiffPanel";
import { ReadinessPanel } from "../../../../../components/admin/ReadinessPanel";
import { CasePage, ServicePage, StandalonePage } from "../../../../../components/public/PublicRenderers";
import styles from "../../../../../components/admin/admin-ui.module.css";
import { requireReviewUser } from "../../../../../lib/admin/page-helpers";
import { ENTITY_TYPES } from "../../../../../lib/content-core/content-types";
import { buildHumanReadableDiff } from "../../../../../lib/content-core/diff";
import { findEntityById, findRevisionById } from "../../../../../lib/content-core/repository";
import { evaluateReadiness } from "../../../../../lib/content-ops/readiness";
import { buildPublishedLookups, getPublishedGlobalSettings } from "../../../../../lib/read-side/public-content";

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
    ? `Preview basis: published revision #${baseline.revisionNumber}`
    : "Preview basis: no published baseline yet.";

  return (
    <AdminShell user={user} title="Проверка и approval">
      <div className={styles.stack}>
        {query?.error ? <div className={styles.statusPanelBlocking}>{query.error}</div> : null}
        {query?.message ? <div className={styles.statusPanelInfo}>{query.message}</div> : null}
        <div className={styles.split}>
          <section className={styles.panel}>
            <p className={styles.eyebrow}>Режим approval</p>
            <h3>{revision.payload.title || revision.payload.h1 || entity.entityType}</h3>
            <p className={styles.mutedText}>Ревизия {revision.revisionNumber} | {revision.changeClass}</p>
            <p>{revision.changeIntent}</p>
            <div className={styles.badgeRow}>
              <span className={styles.badge}>Preview: {revision.previewStatus}</span>
              {revision.ownerReviewRequired ? <span className={styles.badge}>Требуется owner review</span> : null}
              {revision.aiInvolvement ? <span className={styles.badge}>AI involved</span> : null}
            </div>
            <RevisionDiffPanel
              title="Читаемый diff"
              basisLabel={baseline ? `Сравнение с опубликованной ревизией #${baseline.revisionNumber}` : "Сравнение с пустой базой"}
              rows={diffRows}
              emptyLabel="Нет top-level изменений."
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
                  <button type="submit" name="action" value="send_back" className={styles.dangerButton}>Вернуть</button>
                </div>
              </form>
            ) : (
              <p className={styles.mutedText}>Проверьте readiness и preview, затем ждите решения owner, если оно требуется.</p>
            )}
            <ReadinessPanel readiness={readiness} title="Readiness для проверки" />
          </section>
          <section className={styles.panel}>
            <p className={styles.eyebrow}>Preview кандидата</p>
            <p className={styles.mutedText}>{basisLabel} Связанные сущности и медиа берутся из опубликованных lookup-ов.</p>
            {renderPreview(entity.entityType, revision.payload, lookups, globalSettings)}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
