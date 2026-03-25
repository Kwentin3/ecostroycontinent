import { notFound } from "next/navigation";

import { AdminShell } from "../../../../../components/admin/AdminShell";
import { ReadinessPanel } from "../../../../../components/admin/ReadinessPanel";
import { CasePage, ServicePage, StandalonePage } from "../../../../../components/public/PublicRenderers";
import styles from "../../../../../components/admin/admin-ui.module.css";
import { requireReviewUser } from "../../../../../lib/admin/page-helpers";
import { ENTITY_TYPES } from "../../../../../lib/content-core/content-types";
import { findEntityById, findRevisionById } from "../../../../../lib/content-core/repository";
import { evaluateReadiness } from "../../../../../lib/content-ops/readiness";
import { getPublishedGlobalSettings } from "../../../../../lib/read-side/public-content";

function renderPreview(entityType, payload, globalSettings) {
  if (entityType === ENTITY_TYPES.SERVICE) {
    return <ServicePage service={payload} relatedCases={[]} galleries={() => null} globalSettings={globalSettings} />;
  }

  if (entityType === ENTITY_TYPES.CASE) {
    return <CasePage item={payload} relatedServices={[]} galleries={() => null} />;
  }

  if (entityType === ENTITY_TYPES.PAGE) {
    return <StandalonePage page={payload} globalSettings={globalSettings} services={() => null} cases={() => null} galleries={() => null} />;
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
  const globalSettings = await getPublishedGlobalSettings();
  const query = await searchParams;

  return (
    <AdminShell user={user} title="Owner / editorial review">
      <div className={styles.stack}>
        {query?.message ? <div className={styles.statusPanelInfo}>{query.message}</div> : null}
        <div className={styles.split}>
          <section className={styles.panel}>
            <p className={styles.eyebrow}>Approval-focused mode</p>
            <h3>{revision.payload.title || revision.payload.h1 || entity.entityType}</h3>
            <p className={styles.mutedText}>Revision {revision.revisionNumber} | {revision.changeClass}</p>
            <p>{revision.changeIntent}</p>
            <div className={styles.badgeRow}>
              <span className={styles.badge}>Preview: {revision.previewStatus}</span>
              {revision.ownerReviewRequired ? <span className={styles.badge}>Owner review required</span> : null}
              {revision.aiInvolvement ? <span className={styles.badge}>AI involved</span> : null}
            </div>
            {user.role === "business_owner" || user.role === "superadmin" ? (
              <form action={`/api/admin/revisions/${revision.id}/owner-action`} method="post" className={styles.formGrid}>
                <label className={styles.label}>
                  <span>Comment</span>
                  <textarea name="comment" defaultValue={revision.reviewComment || ""} />
                </label>
                <div className={styles.inlineActions}>
                  <button type="submit" name="action" value="approve" className={styles.primaryButton}>Approve</button>
                  <button type="submit" name="action" value="reject" className={styles.secondaryButton}>Reject</button>
                  <button type="submit" name="action" value="send_back" className={styles.dangerButton}>Send back</button>
                </div>
              </form>
            ) : (
              <p className={styles.mutedText}>Editorial review mode: inspect readiness and preview, then wait for owner decision when required.</p>
            )}
            <ReadinessPanel readiness={readiness} title="Review readiness" />
          </section>
          <section className={styles.panel}>
            <p className={styles.eyebrow}>Candidate preview</p>
            {renderPreview(entity.entityType, revision.payload, globalSettings)}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
