import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "../../../../../../../components/admin/AdminShell";
import { ConfirmActionForm } from "../../../../../../../components/admin/ConfirmActionForm";
import styles from "../../../../../../../components/admin/admin-ui.module.css";
import {
  assessEntityDelete,
  isDeleteToolEntityTypeSupported
} from "../../../../../../../lib/admin/entity-delete.js";
import { normalizeLegacyCopy } from "../../../../../../../lib/ui-copy.js";
import { requireEditorUser } from "../../../../../../../lib/admin/page-helpers.js";
import { assertEntityType } from "../../../../../../../lib/content-core/service.js";
import { ENTITY_TYPE_LABELS } from "../../../../../../../lib/content-core/content-types.js";

function getCurrentStateLabel(root) {
  if (!root) {
    return "Состояние не удалось определить.";
  }

  if (root.published) {
    return "Есть active published truth";
  }

  if (root.hasReviewRevision) {
    return "Есть review-state revision";
  }

  return "Live truth нет";
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

  const sourceHref = `/admin/entities/${normalizedType}/${entityId}`;
  const failureRedirectTo = `/admin/entities/${normalizedType}/${entityId}/delete`;

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
            Это preflight-проверка перед обычным удалением. Она показывает, что именно заблокирует удаление, и не
            подменяет ни вывод из живого контура, ни удаление тестового графа.
          </p>
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${evaluation.allowed ? styles.mediaBadgesuccess : styles.mediaBadgedanger}`}>
              {evaluation.allowed ? "Удаление разрешено" : "Удаление заблокировано"}
            </span>
            {evaluation.root?.published ? <span className={`${styles.badge} ${styles.mediaBadgesuccess}`}>Есть published truth</span> : null}
            {evaluation.root?.hasReviewRevision ? <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Есть review residue</span> : null}
            {evaluation.root?.isTestData ? <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Тестовые</span> : null}
          </div>
        </section>

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Dry-run</h3>
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
                Если удаление разрешено, сущность будет удалена из admin truth. Для media storage cleanup останется
                best-effort, но published/review/ref safety rules здесь не ослабляются.
              </p>
            </li>
          </ul>
        </section>

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Что сейчас мешает удалению</h3>
          {evaluation.stateBlockers.length === 0 ? (
            <p className={styles.mutedText}>Собственных state-blockers не найдено.</p>
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
            <p className={styles.mutedText}>Висящих нетестовых черновиков не найдено.</p>
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
              Это необратимое действие. Если объект должен остаться в истории admin truth, используйте другой
              операционный путь, а не обычное удаление.
            </p>
            <ConfirmActionForm
              action={`/api/admin/entities/${normalizedType}/delete`}
              confirmMessage="Удалить сущность? Действие необратимо."
              className={styles.inlineActions}
            >
              <input type="hidden" name="entityId" value={entityId} />
              <input type="hidden" name="redirectTo" value={`/admin/entities/${normalizedType}`} />
              <input type="hidden" name="failureRedirectTo" value={failureRedirectTo} />
              <button type="submit" className={styles.dangerButton}>Удалить</button>
            </ConfirmActionForm>
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
