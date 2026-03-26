import Link from "next/link";

import { AdminShell } from "../../../components/admin/AdminShell";
import { SurfacePacket } from "../../../components/admin/SurfacePacket";
import styles from "../../../components/admin/admin-ui.module.css";
import { requireAdminUser } from "../../../lib/admin/page-helpers";
import { ENTITY_TYPES } from "../../../lib/content-core/content-types.js";
import { listEntityCards } from "../../../lib/content-core/service";
import { getReviewQueue } from "../../../lib/content-ops/workflow";
import { getEntityTypeLabel, getOwnerApprovalStatusLabel, getRevisionStateLabel, normalizeLegacyCopy } from "../../../lib/ui-copy.js";

function pickRequiresYourAction(items, user) {
  if (user.role === "business_owner") {
    return items.filter((item) => item.revision.ownerReviewRequired && item.revision.ownerApprovalStatus === "pending");
  }

  return items.filter((item) => item.revision.state === "review");
}

function buildLandingPacket(user, requiresAction, waitingOnOthers, readyNext) {
  const openFirstReview = requiresAction[0]?.revision?.id ? `/admin/review/${requiresAction[0].revision.id}` : "/admin/review";

  if (user.role === "business_owner") {
    return {
      eyebrow: "Решения",
      title: requiresAction.length ? `${requiresAction.length} материалов ждут вашего решения` : "Сегодня ничего не ждёт вашего решения",
      summary: "Открывайте только те карточки, где нужен ваш выбор. Редактирование и публикация остаются у рабочих ролей.",
      bullets: [
        `На вашем согласовании: ${requiresAction.length}`,
        `Ждут других ролей: ${waitingOnOthers.length}`,
        `Готовы к следующему шагу: ${readyNext.length}`
      ],
      actions: <Link href={openFirstReview} className={styles.secondaryButton}>Открыть проверку</Link>
    };
  }

  if (user.role === "superadmin") {
    return {
      eyebrow: "Операционный контроль",
      title: "Публикация, откат и доступы под контролем",
      summary: "Здесь видно, что готово к публикации, что ждёт проверки и где нужен контроль доступа.",
      bullets: [
        `На проверке: ${requiresAction.length}`,
        `Ждут других ролей: ${waitingOnOthers.length}`,
        `Черновики, готовые к следующему шагу: ${readyNext.length}`
      ],
      actions: <div className={styles.inlineActions}>
        <Link href="/admin/review" className={styles.secondaryButton}>Открыть очередь</Link>
        <Link href="/admin/users" className={styles.secondaryButton}>Пользователи</Link>
      </div>
    };
  }

  return {
    eyebrow: "Рабочий день",
    title: requiresAction.length ? `${requiresAction.length} материалов ждут вашей проверки` : "Сегодня нет срочных задач",
    summary: "В этой панели видно, что нужно сделать сейчас, что ждёт согласования и что уже готово к следующему шагу.",
    bullets: [
      `На проверке: ${requiresAction.length}`,
      `Ждут других ролей: ${waitingOnOthers.length}`,
      `Готовы к следующему шагу: ${readyNext.length}`
    ],
    actions: <div className={styles.inlineActions}>
      <Link href={openFirstReview} className={styles.secondaryButton}>Открыть проверку</Link>
      <Link href="/admin/entities/service" className={styles.secondaryButton}>Открыть услуги</Link>
    </div>
  };
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
  const landingPacket = buildLandingPacket(user, requiresAction, waitingOnOthers, readyNext);

  return (
    <AdminShell user={user} title="Панель" breadcrumbs={[{ label: "Админка", href: "/admin" }]} activeHref="/admin">
      <div className={styles.stack}>
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}
        <SurfacePacket
          eyebrow={landingPacket.eyebrow}
          title={landingPacket.title}
          summary={landingPacket.summary}
          bullets={landingPacket.bullets}
          actions={landingPacket.actions}
        />
        <section className={styles.panel}>
          <p className={styles.eyebrow}>Нужно ваше действие</p>
          {requiresAction.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.mutedText}>Сейчас ничего не требует вашего действия.</p>
              <p className={styles.mutedText}>Начните с услуг, кейсов или очереди проверки, чтобы продвинуть стартовый набор вперёд.</p>
              <Link href="/admin/entities/service" className={styles.primaryButton}>Открыть услуги</Link>
            </div>
          ) : (
            <div className={styles.timeline}>
              {requiresAction.map((item) => (
                <article key={item.revision.id} className={styles.timelineItem}>
                  <h4>{item.revision.payload.title || item.revision.payload.h1 || getEntityTypeLabel(item.entityType)}</h4>
                  <p className={styles.mutedText}>
                    {getEntityTypeLabel(item.entityType)} | версия №{item.revision.revisionNumber} | {getRevisionStateLabel(item.revision.state)}
                  </p>
                  <Link href={`/admin/review/${item.revision.id}`}>Открыть проверку</Link>
                </article>
              ))}
            </div>
          )}
        </section>
        <section className={styles.gridTwo}>
          <div className={styles.panel}>
            <h3>Ждёт других</h3>
            {waitingOnOthers.length === 0 ? (
              <p className={styles.mutedText}>Сейчас ничего не ждёт другую роль.</p>
            ) : (
              <ul>
                {waitingOnOthers.map((item) => (
                  <li key={item.revision.id}>
                    {item.revision.payload.title || getEntityTypeLabel(item.entityType)} | {item.revision.ownerReviewRequired ? getOwnerApprovalStatusLabel(item.revision.ownerApprovalStatus) : "Редакционная проверка"}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.panel}>
            <h3>Готово к следующему шагу</h3>
            {readyNext.length === 0 ? (
              <p className={styles.mutedText}>Черновиков, готовых к следующему шагу, нет.</p>
            ) : (
              <ul>
                {readyNext.map((item) => (
                  <li key={item.entity.id}>
                    <Link href={`/admin/entities/${item.entity.entityType}/${item.entity.id}`}>
                      {item.latestRevision.payload.title || item.latestRevision.payload.h1 || getEntityTypeLabel(item.entity.entityType)}
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
