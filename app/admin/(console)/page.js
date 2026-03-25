import Link from "next/link";

import { AdminShell } from "../../../components/admin/AdminShell";
import styles from "../../../components/admin/admin-ui.module.css";
import { requireAdminUser } from "../../../lib/admin/page-helpers";
import { ENTITY_TYPES } from "../../../lib/content-core/content-types";
import { listEntityCards } from "../../../lib/content-core/service";
import { getReviewQueue } from "../../../lib/content-ops/workflow";

function pickRequiresYourAction(items, user) {
  if (user.role === "business_owner") {
    return items.filter((item) => item.revision.ownerReviewRequired && item.revision.ownerApprovalStatus === "pending");
  }

  return items.filter((item) => item.revision.state === "review");
}

export default async function AdminDashboardPage() {
  const user = await requireAdminUser();
  const reviewQueue = await getReviewQueue();
  const services = await listEntityCards(ENTITY_TYPES.SERVICE);
  const cases = await listEntityCards(ENTITY_TYPES.CASE);

  const requiresAction = pickRequiresYourAction(reviewQueue, user);
  const waitingOnOthers = reviewQueue.filter((item) => !requiresAction.includes(item));
  const readyNext = [...services, ...cases].filter((item) => item.latestRevision?.state === "draft");

  return (
    <AdminShell user={user} title="Dashboard">
      <div className={styles.stack}>
        <section className={styles.panel}>
          <p className={styles.eyebrow}>Action-centered dashboard</p>
          <h3>Requires your action</h3>
          {requiresAction.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.mutedText}>Nothing requires your action yet.</p>
              <p className={styles.mutedText}>Start with Services, Cases, or the review inbox to move the first slice forward.</p>
              <Link href="/admin/entities/service" className={styles.primaryButton}>Open services</Link>
            </div>
          ) : (
            <div className={styles.timeline}>
              {requiresAction.map((item) => (
                <article key={item.revision.id} className={styles.timelineItem}>
                  <h4>{item.revision.payload.title || item.revision.payload.h1 || item.entityType}</h4>
                  <p className={styles.mutedText}>{item.entityType} | revision {item.revision.revisionNumber}</p>
                  <Link href={`/admin/review/${item.revision.id}`}>Open review</Link>
                </article>
              ))}
            </div>
          )}
        </section>
        <section className={styles.gridTwo}>
          <div className={styles.panel}>
            <h3>Waiting on others</h3>
            {waitingOnOthers.length === 0 ? <p className={styles.mutedText}>Nothing is currently waiting on another role.</p> : (
              <ul>
                {waitingOnOthers.map((item) => (
                  <li key={item.revision.id}>
                    {item.revision.payload.title || item.entityType} | {item.revision.ownerReviewRequired ? "owner review" : "editorial review"}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.panel}>
            <h3>Ready for next step</h3>
            {readyNext.length === 0 ? <p className={styles.mutedText}>No draft candidates are waiting for the next step.</p> : (
              <ul>
                {readyNext.map((item) => (
                  <li key={item.entity.id}>
                    <Link href={`/admin/entities/${item.entity.entityType}/${item.entity.id}`}>
                      {item.latestRevision.payload.title || item.latestRevision.payload.h1 || item.entity.entityType}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
