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

export default async function AdminDashboardPage({ searchParams }) {
  const user = await requireAdminUser();
  const reviewQueue = await getReviewQueue();
  const services = await listEntityCards(ENTITY_TYPES.SERVICE);
  const cases = await listEntityCards(ENTITY_TYPES.CASE);
  const query = await searchParams;

  const requiresAction = pickRequiresYourAction(reviewQueue, user);
  const waitingOnOthers = reviewQueue.filter((item) => !requiresAction.includes(item));
  const readyNext = [...services, ...cases].filter((item) => item.latestRevision?.state === "draft");

  return (
    <AdminShell user={user} title="Панель">
      <div className={styles.stack}>
        {query?.error ? <div className={styles.statusPanelBlocking}>{query.error}</div> : null}
        {query?.message ? <div className={styles.statusPanelInfo}>{query.message}</div> : null}
        <section className={styles.panel}>
          <p className={styles.eyebrow}>Панель действий</p>
          <h3>Нужно ваше действие</h3>
          {requiresAction.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.mutedText}>Сейчас ничего не требует вашего действия.</p>
              <p className={styles.mutedText}>Начните с услуг, кейсов или очереди проверки, чтобы двигать first slice дальше.</p>
              <Link href="/admin/entities/service" className={styles.primaryButton}>Открыть услуги</Link>
            </div>
          ) : (
            <div className={styles.timeline}>
              {requiresAction.map((item) => (
                <article key={item.revision.id} className={styles.timelineItem}>
                  <h4>{item.revision.payload.title || item.revision.payload.h1 || item.entityType}</h4>
                  <p className={styles.mutedText}>{item.entityType} | revision {item.revision.revisionNumber}</p>
                  <Link href={`/admin/review/${item.revision.id}`}>Открыть review</Link>
                </article>
              ))}
            </div>
          )}
        </section>
        <section className={styles.gridTwo}>
          <div className={styles.panel}>
            <h3>Ждёт других</h3>
            {waitingOnOthers.length === 0 ? <p className={styles.mutedText}>Сейчас ничто не ждёт другую роль.</p> : (
              <ul>
                {waitingOnOthers.map((item) => (
                  <li key={item.revision.id}>
                    {item.revision.payload.title || item.entityType} | {item.revision.ownerReviewRequired ? "approval владельца" : "редакционная проверка"}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.panel}>
            <h3>Готово к следующему шагу</h3>
            {readyNext.length === 0 ? <p className={styles.mutedText}>Черновиков, готовых к следующему шагу, нет.</p> : (
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
