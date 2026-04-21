import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "../../../../../../../components/admin/AdminShell";
import { ConfirmActionForm } from "../../../../../../../components/admin/ConfirmActionForm";
import styles from "../../../../../../../components/admin/admin-ui.module.css";
import {
  evaluateLiveDeactivation,
  getLiveDeactivationHref,
  isLiveDeactivationEntityTypeSupported
} from "../../../../../../../lib/admin/live-deactivation.js";
import { appendAdminReturnTo, normalizeAdminReturnTo } from "../../../../../../../lib/admin/relation-navigation.js";
import { normalizeLegacyCopy } from "../../../../../../../lib/ui-copy.js";
import { requirePublishUser } from "../../../../../../../lib/admin/page-helpers.js";
import { assertEntityType } from "../../../../../../../lib/content-core/service.js";
import { ENTITY_TYPE_LABELS, ENTITY_TYPES } from "../../../../../../../lib/content-core/content-types.js";

function getEntitySourceHref(entityType, entityId) {
  return entityType === ENTITY_TYPES.MEDIA_ASSET
    ? `/admin/entities/media_asset?asset=${entityId}`
    : `/admin/entities/${entityType}/${entityId}`;
}

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

  const normalizedReturnTo = normalizeAdminReturnTo(query?.returnTo);
  const fallbackSourceHref = getEntitySourceHref(normalizedType, entityId);
  const sourceHref = normalizedReturnTo || fallbackSourceHref;
  const failureRedirectTo = appendAdminReturnTo(getLiveDeactivationHref(normalizedType, entityId), normalizedReturnTo);

  return (
    <AdminShell
      user={user}
      title="Снять с публикации"
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: ENTITY_TYPE_LABELS[normalizedType], href: `/admin/entities/${normalizedType}` },
        { label: evaluation.root?.label || "Снять с публикации" }
      ]}
      activeHref={`/admin/entities/${normalizedType}`}
      actions={<Link href={sourceHref} className={styles.secondaryButton}>Вернуться к объекту</Link>}
    >
      <div className={styles.stack}>
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}

        <section className={styles.panel}>
          <p className={styles.helpText}>
            Это отдельная операция администратора. Она снимает объект с публикации, но не удаляет его и не
            заменяет ни откат, ни удаление тестового графа.
          </p>
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${evaluation.allowed ? styles.mediaBadgesuccess : styles.mediaBadgedanger}`}>
              {evaluation.allowed ? "Операция разрешена" : "Операция заблокирована"}
            </span>
            {evaluation.root?.published ? <span className={`${styles.badge} ${styles.mediaBadgesuccess}`}>Есть опубликованная версия</span> : null}
            {evaluation.root?.isTestData ? <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Тестовые</span> : null}
          </div>
        </section>

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Проверка перед снятием с публикации</h3>
          <div className={styles.cockpitCoverageSummary}>
            <strong>{evaluation.root?.label || entityId}</strong>
            <span className={styles.mutedText}>{ENTITY_TYPE_LABELS[normalizedType]}</span>
          </div>
          <ul className={styles.stack}>
            <li className={styles.timelineItem}>
              <strong>Текущее состояние публикации</strong>
              <p className={styles.mutedText}>
                {evaluation.root?.published ? "Опубликованная версия активна." : "Активной опубликованной версии нет."}
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
              <p className={styles.mutedText}>{evaluation.routeEffects?.sitemapImpact || "Отдельный маршрут sitemap в текущем коде не найден."}</p>
            </li>
            <li className={styles.timelineItem}>
              <strong>Какие адреса обновятся</strong>
              <p className={styles.mutedText}>
                {(evaluation.routeEffects?.revalidationPaths ?? []).length > 0
                  ? evaluation.routeEffects.revalidationPaths.join(", ")
                  : "Отдельного обновления страниц не требуется."}
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

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Ревизии на проверке</h3>
          {evaluation.reviewResidue?.length === 0 ? (
            <p className={styles.mutedText}>Ревизий на проверке не найдено.</p>
          ) : (
            <ul className={styles.stack}>
              {evaluation.reviewResidue.map((item) => (
                <li key={`${item.kind}:${item.id}`} className={styles.timelineItem}>
                  <div className={styles.cockpitCoverageSummary}>
                    <strong>{item.label}</strong>
                    <span className={styles.mutedText}>Проверка и публикация</span>
                  </div>
                  <p className={styles.mutedText}>{item.reason}</p>
                  {item.href ? (
                    <div className={styles.inlineActions}>
                      <Link href={item.href} className={styles.secondaryButton}>Открыть</Link>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Открытые обязательства по публикации</h3>
          {evaluation.openObligations?.length === 0 ? (
            <p className={styles.mutedText}>Открытых обязательств по публикации не найдено.</p>
          ) : (
            <ul className={styles.stack}>
              {evaluation.openObligations.map((item) => (
                <li key={`${item.kind}:${item.id}`} className={styles.timelineItem}>
                  <div className={styles.cockpitCoverageSummary}>
                    <strong>{item.label}</strong>
                    <span className={styles.mutedText}>Проверка и публикация</span>
                  </div>
                  <p className={styles.mutedText}>{item.reason}</p>
                  {item.href ? (
                    <div className={styles.inlineActions}>
                      <Link href={item.href} className={styles.secondaryButton}>Открыть</Link>
                    </div>
                  ) : null}
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
              Сначала будет снята действующая опубликованная версия, затем публичный контур будет обновлён.
              История объекта сохранится, окончательное удаление в этом сценарии не выполняется.
            </p>
            <ConfirmActionForm
              action={`/api/admin/entities/${normalizedType}/${entityId}/live-deactivation`}
              confirmMessage="Снять объект с публикации? Публичный маршрут перестанет быть доступным."
              className={styles.inlineActions}
            >
              <input type="hidden" name="redirectTo" value={sourceHref} />
              <input type="hidden" name="failureRedirectTo" value={failureRedirectTo} />
              <button type="submit" className={styles.dangerButton}>Снять с публикации</button>
            </ConfirmActionForm>
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
