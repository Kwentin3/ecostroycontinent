import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "../../../../../../../components/admin/AdminShell";
import { ConfirmActionForm } from "../../../../../../../components/admin/ConfirmActionForm";
import styles from "../../../../../../../components/admin/admin-ui.module.css";
import {
  assessEntityDelete,
  isDeleteToolEntityTypeSupported
} from "../../../../../../../lib/admin/entity-delete.js";
import {
  getLiveDeactivationHref,
  isLiveDeactivationEntityTypeSupported
} from "../../../../../../../lib/admin/live-deactivation.js";
import { appendAdminReturnTo, normalizeAdminReturnTo } from "../../../../../../../lib/admin/relation-navigation.js";
import { normalizeLegacyCopy } from "../../../../../../../lib/ui-copy.js";
import { requireEditorUser } from "../../../../../../../lib/admin/page-helpers.js";
import { assertEntityType } from "../../../../../../../lib/content-core/service.js";
import { ENTITY_TYPES, ENTITY_TYPE_LABELS } from "../../../../../../../lib/content-core/content-types.js";

function getCurrentStateLabel(root) {
  if (!root) {
    return "Состояние не удалось определить.";
  }

  if (root.published && root.hasReviewRevision) {
    return "Есть опубликованная версия и ревизия на проверке";
  }

  if (root.published) {
    return "Есть опубликованная версия";
  }

  if (root.hasReviewRevision) {
    return "Есть ревизия на проверке";
  }

  return "Живой публикации нет";
}

function getEntitySourceHref(entityType, entityId) {
  return entityType === ENTITY_TYPES.MEDIA_ASSET
    ? `/admin/entities/media_asset?asset=${entityId}`
    : `/admin/entities/${entityType}/${entityId}`;
}

function getEntityListHref(entityType) {
  return entityType === ENTITY_TYPES.MEDIA_ASSET
    ? "/admin/entities/media_asset"
    : `/admin/entities/${entityType}`;
}

function getIncomingPublishedAction(ref, returnTo) {
  if (!isLiveDeactivationEntityTypeSupported(ref?.entityType)) {
    return null;
  }

  return {
    href: appendAdminReturnTo(getLiveDeactivationHref(ref.entityType, ref.entityId), returnTo),
    label: "Снять с публикации"
  };
}

export default async function DeleteEntityPage({ params, searchParams }) {
  const { entityType, entityId } = await params;
  const query = await searchParams;
  const user = await requireEditorUser();
  const normalizedType = assertEntityType(entityType);

  if (!isDeleteToolEntityTypeSupported(normalizedType)) {
    notFound();
  }

  const evaluation = await assessEntityDelete({
    entityType: normalizedType,
    entityId
  });

  if (!evaluation.exists) {
    notFound();
  }

  const normalizedReturnTo = normalizeAdminReturnTo(query?.returnTo);
  const fallbackSourceHref = getEntitySourceHref(normalizedType, entityId);
  const sourceHref = normalizedReturnTo || fallbackSourceHref;
  const redirectTo = normalizedReturnTo || getEntityListHref(normalizedType);
  const currentDeleteHref = appendAdminReturnTo(`/admin/entities/${normalizedType}/${entityId}/delete`, normalizedReturnTo);
  const failureRedirectTo = currentDeleteHref;
  const canUseLiveDeactivation = isLiveDeactivationEntityTypeSupported(normalizedType);
  const liveDeactivationHref = canUseLiveDeactivation
    ? appendAdminReturnTo(getLiveDeactivationHref(normalizedType, entityId), currentDeleteHref)
    : "";
  const hasOnlyOwnPublishedVersion = Boolean(evaluation.root?.published)
    && evaluation.publishedIncomingRefs.length === 0
    && evaluation.draftIncomingRefs.length === 0
    && !evaluation.root?.hasReviewRevision
    && (evaluation.root?.openObligationsCount ?? 0) === 0;

  return (
    <AdminShell
      user={user}
      title="Удалить сущность"
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: ENTITY_TYPE_LABELS[normalizedType], href: `/admin/entities/${normalizedType}` },
        { label: evaluation.root?.label || "Удалить сущность" }
      ]}
      activeHref={`/admin/entities/${normalizedType}`}
      actions={<Link href={sourceHref} className={styles.secondaryButton}>Вернуться к объекту</Link>}
    >
      <div className={styles.stack}>
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}

        <section className={styles.panel}>
          <p className={styles.helpText}>
            Это проверка перед удалением. Она показывает, что именно заблокирует удаление, и не
            подменяет ни вывод из живого контура, ни удаление тестового графа.
          </p>
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${evaluation.allowed ? styles.mediaBadgesuccess : styles.mediaBadgedanger}`}>
              {evaluation.allowed ? "Удаление разрешено" : "Удаление заблокировано"}
            </span>
            {evaluation.root?.published ? <span className={`${styles.badge} ${styles.mediaBadgesuccess}`}>Есть опубликованная версия</span> : null}
            {evaluation.root?.hasReviewRevision ? <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Есть ревизия на проверке</span> : null}
            {evaluation.root?.isTestData ? <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Тестовые</span> : null}
          </div>
        </section>

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Проверка перед удалением</h3>
          <ul className={styles.stack}>
            <li className={styles.timelineItem}>
              <strong>Объект</strong>
              <p className={styles.mutedText}>{evaluation.root?.label || entityId}</p>
            </li>
            <li className={styles.timelineItem}>
              <strong>Текущее состояние</strong>
              <p className={styles.mutedText}>{getCurrentStateLabel(evaluation.root)}</p>
            </li>
            <li className={styles.timelineItem}>
              <strong>Что произойдёт</strong>
              <p className={styles.mutedText}>
                Если удаление разрешено, объект будет удалён из административной системы. Для медиафайлов физическая
                очистка хранилища выполняется по возможности, но правила безопасности здесь не ослабляются.
              </p>
            </li>
          </ul>
        </section>

        {!evaluation.allowed && canUseLiveDeactivation && evaluation.root?.published ? (
          <section className={styles.panel}>
            <h3>Следующий шаг</h3>
            <p className={styles.helpText}>
              {hasOnlyOwnPublishedVersion
                ? "Объект удерживает в публикации собственная опубликованная версия. Сначала снимите его с публикации, затем вернитесь на этот экран и повторите удаление."
                : "Сначала откройте экран снятия с публикации. Там будет видно, можно ли безопасно убрать объект из живого контура или сначала нужно разобрать ссылки и незавершённые состояния."}
            </p>
            <div className={styles.inlineActions}>
              <Link href={liveDeactivationHref} className={styles.primaryButton}>Снять с публикации</Link>
            </div>
          </section>
        ) : null}

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Что сейчас мешает удалению</h3>
          {evaluation.stateBlockers.length === 0 ? (
            <p className={styles.mutedText}>Собственных причин блокировки не найдено.</p>
          ) : (
            <ul className={styles.stack}>
              {evaluation.stateBlockers.map((blocker) => (
                <li key={`${blocker.kind}:${blocker.reason}:${blocker.href ?? ""}`} className={styles.timelineItem}>
                  <div className={styles.cockpitCoverageSummary}>
                    <strong>{blocker.label}</strong>
                    <span className={styles.mutedText}>Состояние объекта</span>
                  </div>
                  <p className={styles.mutedText}>{blocker.reason}</p>
                  {blocker.href ? (
                    <div className={styles.inlineActions}>
                      <Link href={blocker.href} className={styles.secondaryButton}>Открыть</Link>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Входящие опубликованные ссылки</h3>
          {evaluation.publishedIncomingRefs.length === 0 ? (
            <p className={styles.mutedText}>Опубликованных входящих ссылок не найдено.</p>
          ) : (
            <>
              <p className={styles.helpText}>
                Эти объекты всё ещё держат удаляемую сущность в живом контуре. Сначала откройте нужный объект и снимите
                его с публикации или уберите ссылку, затем вернитесь на этот экран.
              </p>
              <ul className={styles.stack}>
                {evaluation.publishedIncomingRefs.map((ref) => {
                  const action = getIncomingPublishedAction(ref, currentDeleteHref);

                  return (
                    <li key={`${ref.entityType}:${ref.entityId}:published`} className={styles.timelineItem}>
                      <div className={styles.cockpitCoverageSummary}>
                        <strong>{ref.label}</strong>
                        <span className={styles.mutedText}>{ENTITY_TYPE_LABELS[ref.entityType]}</span>
                      </div>
                      <p className={styles.mutedText}>{ref.reason}</p>
                      <div className={styles.inlineActions}>
                        <Link href={ref.href} className={styles.secondaryButton}>Открыть</Link>
                        {action ? (
                          <Link href={action.href} className={styles.secondaryButton}>{action.label}</Link>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Входящие нетестовые черновики</h3>
          {evaluation.draftIncomingRefs.length === 0 ? (
            <p className={styles.mutedText}>Висящих нетестовых черновиков не найдено.</p>
          ) : (
            <>
              <p className={styles.helpText}>
                Эти черновики пока не опубликованы, но после удаления в них останутся висящие ссылки. Сначала откройте
                их и уберите связь, затем возвращайтесь к удалению.
              </p>
              <ul className={styles.stack}>
                {evaluation.draftIncomingRefs.map((ref) => (
                  <li key={`${ref.entityType}:${ref.entityId}:draft`} className={styles.timelineItem}>
                    <div className={styles.cockpitCoverageSummary}>
                      <strong>{ref.label}</strong>
                      <span className={styles.mutedText}>{ENTITY_TYPE_LABELS[ref.entityType]}</span>
                    </div>
                    <p className={styles.mutedText}>{ref.reason}</p>
                    <div className={styles.inlineActions}>
                      <Link href={ref.href} className={styles.secondaryButton}>Открыть черновик</Link>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {evaluation.reasons.length > 0 ? (
          <section className={styles.statusPanelBlocking}>
            <strong>Удаление остановлено.</strong>
            <ul className={styles.stack}>
              {evaluation.reasons.map((reason) => (
                <li key={reason} className={styles.timelineItem}>{reason}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {evaluation.allowed ? (
          <section className={styles.panel}>
            <h3>Подтверждение</h3>
            <p className={styles.helpText}>
              Это необратимое действие. Если объект должен остаться в истории системы, используйте другой
              операционный путь, а не обычное удаление.
            </p>
            <ConfirmActionForm
              action={`/api/admin/entities/${normalizedType}/delete`}
              confirmMessage="Удалить сущность? Действие необратимо."
              className={styles.inlineActions}
            >
              <input type="hidden" name="entityId" value={entityId} />
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <input type="hidden" name="failureRedirectTo" value={failureRedirectTo} />
              <button type="submit" className={styles.dangerButton}>Удалить</button>
            </ConfirmActionForm>
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
