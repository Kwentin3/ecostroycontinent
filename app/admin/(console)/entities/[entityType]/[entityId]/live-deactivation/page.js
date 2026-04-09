import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "../../../../../../../components/admin/AdminShell";
import { ConfirmActionForm } from "../../../../../../../components/admin/ConfirmActionForm";
import styles from "../../../../../../../components/admin/admin-ui.module.css";
import {
  evaluateLiveDeactivation,
  isLiveDeactivationEntityTypeSupported
} from "../../../../../../../lib/admin/live-deactivation.js";
import { normalizeLegacyCopy } from "../../../../../../../lib/ui-copy.js";
import { requirePublishUser } from "../../../../../../../lib/admin/page-helpers.js";
import { assertEntityType } from "../../../../../../../lib/content-core/service.js";
import { ENTITY_TYPE_LABELS } from "../../../../../../../lib/content-core/content-types.js";

export default async function LiveDeactivationPage({ params, searchParams }) {
  const { entityType, entityId } = await params;
  const query = await searchParams;
  const user = await requirePublishUser();
  const normalizedType = assertEntityType(entityType);

  if (!isLiveDeactivationEntityTypeSupported(normalizedType)) {
    notFound();
  }

  const evaluation = await evaluateLiveDeactivation({
    entityType: normalizedType,
    entityId
  });

  if (!evaluation.exists) {
    notFound();
  }

  const sourceHref = `/admin/entities/${normalizedType}/${entityId}`;
  const failureRedirectTo = `/admin/entities/${normalizedType}/${entityId}/live-deactivation`;

  return (
    <AdminShell
      user={user}
      title="Вывести из живого контура"
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: ENTITY_TYPE_LABELS[normalizedType], href: `/admin/entities/${normalizedType}` },
        { label: evaluation.root?.label || "Вывести из живого контура" }
      ]}
      activeHref={`/admin/entities/${normalizedType}`}
      actions={<Link href={sourceHref} className={styles.secondaryButton}>Вернуться к объекту</Link>}
    >
      <div className={styles.stack}>
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}

        <section className={styles.panel}>
          <p className={styles.helpText}>
            Это отдельная admin-only операция. Она снимает сущность с живого published contour, но не удаляет её и не
            заменяет rollback или удаление тестового графа.
          </p>
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${evaluation.allowed ? styles.mediaBadgesuccess : styles.mediaBadgedanger}`}>
              {evaluation.allowed ? "Операция разрешена" : "Операция заблокирована"}
            </span>
            {evaluation.root?.published ? <span className={`${styles.badge} ${styles.mediaBadgesuccess}`}>Есть active published truth</span> : null}
            {evaluation.root?.isTestData ? <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Тестовые</span> : null}
          </div>
        </section>

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Dry-run</h3>
          <div className={styles.cockpitCoverageSummary}>
            <strong>{evaluation.root?.label || entityId}</strong>
            <span className={styles.mutedText}>{ENTITY_TYPE_LABELS[normalizedType]}</span>
          </div>
          <ul className={styles.stack}>
            <li className={styles.timelineItem}>
              <strong>Текущий live state</strong>
              <p className={styles.mutedText}>
                {evaluation.root?.published ? "Активная опубликованная truth есть." : "Активной опубликованной truth нет."}
              </p>
            </li>
            <li className={styles.timelineItem}>
              <strong>Маршрут</strong>
              <p className={styles.mutedText}>{evaluation.routeEffects?.routePath || "Не удалось честно определить маршрут."}</p>
            </li>
            <li className={styles.timelineItem}>
              <strong>Публичный результат</strong>
              <p className={styles.mutedText}>{evaluation.routeEffects?.routeOutcome || "Операция заблокирована до расчёта публичного эффекта."}</p>
            </li>
            <li className={styles.timelineItem}>
              <strong>Листинг</strong>
              <p className={styles.mutedText}>{evaluation.routeEffects?.listImpact || "Нет отдельного листинга в этом срезе."}</p>
            </li>
            <li className={styles.timelineItem}>
              <strong>Карта сайта</strong>
              <p className={styles.mutedText}>{evaluation.routeEffects?.sitemapImpact || "Отдельный sitemap runtime route в текущем коде не найден."}</p>
            </li>
            <li className={styles.timelineItem}>
              <strong>Revalidation paths</strong>
              <p className={styles.mutedText}>
                {(evaluation.routeEffects?.revalidationPaths ?? []).length > 0
                  ? evaluation.routeEffects.revalidationPaths.join(", ")
                  : "Отдельных путей для revalidation не рассчитано."}
              </p>
            </li>
          </ul>
        </section>

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Входящие опубликованные ссылки</h3>
          {evaluation.publishedIncomingRefs.length === 0 ? (
            <p className={styles.mutedText}>Публикуемых входящих ссылок не найдено.</p>
          ) : (
            <ul className={styles.stack}>
              {evaluation.publishedIncomingRefs.map((ref) => (
                <li key={`${ref.entityType}:${ref.entityId}:published`} className={styles.timelineItem}>
                  <div className={styles.cockpitCoverageSummary}>
                    <strong>{ref.label}</strong>
                    <span className={styles.mutedText}>{ENTITY_TYPE_LABELS[ref.entityType]}</span>
                  </div>
                  <p className={styles.mutedText}>{ref.reason}</p>
                  <div className={styles.inlineActions}>
                    <Link href={ref.href} className={styles.secondaryButton}>Открыть</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Входящие нетестовые черновики</h3>
          {evaluation.draftIncomingRefs.length === 0 ? (
            <p className={styles.mutedText}>Нетестовых черновиков с висящими ссылками не найдено.</p>
          ) : (
            <ul className={styles.stack}>
              {evaluation.draftIncomingRefs.map((ref) => (
                <li key={`${ref.entityType}:${ref.entityId}:draft`} className={styles.timelineItem}>
                  <div className={styles.cockpitCoverageSummary}>
                    <strong>{ref.label}</strong>
                    <span className={styles.mutedText}>{ENTITY_TYPE_LABELS[ref.entityType]}</span>
                  </div>
                  <p className={styles.mutedText}>{ref.reason}</p>
                  <div className={styles.inlineActions}>
                    <Link href={ref.href} className={styles.secondaryButton}>Открыть</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {evaluation.warnings.length > 0 ? (
          <section className={styles.statusPanelWarning}>
            <strong>Что изменится после операции</strong>
            <ul className={styles.stack}>
              {evaluation.warnings.map((warning) => (
                <li key={warning} className={styles.timelineItem}>{warning}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {evaluation.blockers.length > 0 ? (
          <section className={styles.statusPanelBlocking}>
            <strong>Операция остановлена.</strong>
            <ul className={styles.stack}>
              {evaluation.blockers.map((blocker) => (
                <li key={blocker} className={styles.timelineItem}>{blocker}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {evaluation.allowed ? (
          <section className={styles.panel}>
            <h3>Выполнение</h3>
            <p className={styles.helpText}>
              Сначала будет снят active published pointer, затем публичный контур будет переоценён через revalidation.
              История и админская truth сохранятся, hard delete в этом срезе не выполняется.
            </p>
            <ConfirmActionForm
              action={`/api/admin/entities/${normalizedType}/${entityId}/live-deactivation`}
              confirmMessage="Вывести сущность из живого контура? Публичный маршрут перестанет быть live."
              className={styles.inlineActions}
            >
              <input type="hidden" name="redirectTo" value={sourceHref} />
              <input type="hidden" name="failureRedirectTo" value={failureRedirectTo} />
              <button type="submit" className={styles.dangerButton}>Вывести из живого контура</button>
            </ConfirmActionForm>
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
