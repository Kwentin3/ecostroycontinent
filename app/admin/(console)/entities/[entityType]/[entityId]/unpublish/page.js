import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminShell } from "../../../../../../../components/admin/AdminShell";
import { ConfirmActionForm } from "../../../../../../../components/admin/ConfirmActionForm";
import styles from "../../../../../../../components/admin/admin-ui.module.css";
import {
  evaluateUnpublish,
  getUnpublishHref,
  isUnpublishEntityTypeSupported
} from "../../../../../../../lib/admin/unpublish-workflow.js";
import { appendAdminReturnTo, normalizeAdminReturnTo } from "../../../../../../../lib/admin/relation-navigation.js";
import { requireAdminUser } from "../../../../../../../lib/admin/page-helpers.js";
import { userCanUnpublish } from "../../../../../../../lib/auth/session.js";
import { assertEntityType } from "../../../../../../../lib/content-core/service.js";
import { ENTITY_TYPE_LABELS, ENTITY_TYPES } from "../../../../../../../lib/content-core/content-types.js";
import { normalizeLegacyCopy } from "../../../../../../../lib/ui-copy.js";

function getEntitySourceHref(entityType, entityId) {
  return entityType === ENTITY_TYPES.MEDIA_ASSET
    ? `/admin/entities/media_asset?asset=${entityId}`
    : `/admin/entities/${entityType}/${entityId}`;
}

function renderImpactList(items, emptyLabel) {
  if (!items?.length) {
    return <p className={styles.mutedText}>{emptyLabel}</p>;
  }

  return (
    <ul className={styles.stack}>
      {items.map((item) => (
        <li key={`${item.kind || item.entityType}:${item.id || item.entityId}:${item.reason}`} className={styles.timelineItem}>
          <div className={styles.cockpitCoverageSummary}>
            <strong>{item.label}</strong>
            {item.entityType ? <span className={styles.mutedText}>{ENTITY_TYPE_LABELS[item.entityType]}</span> : null}
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
  );
}

export default async function UnpublishPage({ params, searchParams }) {
  const { entityType, entityId } = await params;
  const query = await searchParams;
  const user = await requireAdminUser();
  const normalizedType = assertEntityType(entityType);

  if (!isUnpublishEntityTypeSupported(normalizedType)) {
    notFound();
  }

  if (!userCanUnpublish(user, normalizedType)) {
    redirect("/admin/no-access");
  }

  const evaluation = await evaluateUnpublish({
    entityType: normalizedType,
    entityId
  });

  if (!evaluation.exists) {
    notFound();
  }

  const normalizedReturnTo = normalizeAdminReturnTo(query?.returnTo);
  const fallbackSourceHref = getEntitySourceHref(normalizedType, entityId);
  const sourceHref = normalizedReturnTo || fallbackSourceHref;
  const failureRedirectTo = appendAdminReturnTo(getUnpublishHref(normalizedType, entityId), normalizedReturnTo);

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
            Это операция публикационного контура: она снимает активную опубликованную версию, но не удаляет объект,
            черновики, историю, медиафайл или связанные записи.
          </p>
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${evaluation.allowed ? styles.mediaBadgesuccess : styles.mediaBadgedanger}`}>
              {evaluation.allowed ? "Можно снять с публикации" : "Операция заблокирована"}
            </span>
            {evaluation.root?.published ? <span className={`${styles.badge} ${styles.mediaBadgesuccess}`}>Есть опубликованная версия</span> : null}
            {evaluation.warnings.length > 0 ? <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Предупреждений: {evaluation.warnings.length}</span> : null}
          </div>
        </section>

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Публичный эффект</h3>
          <ul className={styles.stack}>
            <li className={styles.timelineItem}>
              <strong>{evaluation.root?.label || entityId}</strong>
              <p className={styles.mutedText}>{ENTITY_TYPE_LABELS[normalizedType]}</p>
            </li>
            <li className={styles.timelineItem}>
              <strong>Маршрут</strong>
              <p className={styles.mutedText}>{evaluation.routeEffects?.routePath || "Отдельного публичного маршрута нет."}</p>
            </li>
            <li className={styles.timelineItem}>
              <strong>Результат</strong>
              <p className={styles.mutedText}>{evaluation.routeEffects?.routeOutcome || "Сущность исчезнет из опубликованного lookup-контура."}</p>
            </li>
          </ul>
        </section>

        {evaluation.warnings.length > 0 ? (
          <section className={styles.statusPanelWarning}>
            <strong>Предупреждения, которые не блокируют unpublish</strong>
            <ul className={styles.stack}>
              {evaluation.warnings.map((warning) => (
                <li key={warning} className={styles.timelineItem}>{warning}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Связи</h3>
          {renderImpactList(evaluation.publishedIncomingRefs, "Опубликованных входящих ссылок не найдено.")}
          {renderImpactList(evaluation.draftIncomingRefs, "Нетестовых черновиков с входящими ссылками не найдено.")}
        </section>

        {evaluation.reviewResidue.length > 0 || evaluation.openObligations.length > 0 ? (
          <section className={`${styles.panel} ${styles.panelMuted}`}>
            <h3>Рабочие хвосты</h3>
            {renderImpactList(evaluation.reviewResidue, "Ревизий на проверке не найдено.")}
            {renderImpactList(evaluation.openObligations, "Открытых publish-обязательств не найдено.")}
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
              Активная опубликованная версия будет снята с live-контура. История и черновики сохранятся.
            </p>
            <ConfirmActionForm
              action={`/api/admin/entities/${normalizedType}/${entityId}/unpublish`}
              confirmMessage="Снять объект с публикации? Публичный контур перестанет показывать эту опубликованную версию."
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
