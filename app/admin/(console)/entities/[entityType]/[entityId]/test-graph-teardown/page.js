import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "../../../../../../../components/admin/AdminShell";
import { ConfirmActionForm } from "../../../../../../../components/admin/ConfirmActionForm";
import styles from "../../../../../../../components/admin/admin-ui.module.css";
import {
  evaluateTestGraphTeardown,
  isTestGraphTeardownEntityTypeSupported
} from "../../../../../../../lib/admin/test-graph-teardown.js";
import { getEntityAdminHref } from "../../../../../../../lib/admin/entity-links.js";
import { normalizeLegacyCopy } from "../../../../../../../lib/ui-copy.js";
import { requireEditorUser } from "../../../../../../../lib/admin/page-helpers.js";
import { assertEntityType } from "../../../../../../../lib/content-core/service.js";
import { ENTITY_TYPE_LABELS } from "../../../../../../../lib/content-core/content-types.js";

function getStatusLabel(member) {
  if (member.published) {
    return "Опубликовано";
  }

  if (member.hasReviewRevision) {
    return "На проверке";
  }

  return "Черновик";
}

export default async function TestGraphTeardownPage({ params, searchParams }) {
  const { entityType, entityId } = await params;
  const query = await searchParams;
  const user = await requireEditorUser();
  const normalizedType = assertEntityType(entityType);

  if (!isTestGraphTeardownEntityTypeSupported(normalizedType)) {
    notFound();
  }

  const evaluation = await evaluateTestGraphTeardown({
    entityType: normalizedType,
    entityId
  });

  if (!evaluation.exists) {
    notFound();
  }

  const sourceHref = getEntityAdminHref(normalizedType, entityId);
  const successRedirectTo = normalizedType === "media_asset"
    ? "/admin/entities/media_asset"
    : `/admin/entities/${normalizedType}`;
  const failureRedirectTo = `/admin/entities/${normalizedType}/${entityId}/test-graph-teardown`;

  return (
    <AdminShell
      user={user}
      title="Удаление тестового графа"
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: ENTITY_TYPE_LABELS[normalizedType], href: successRedirectTo },
        { label: evaluation.root?.label || "Тестовый граф" }
      ]}
      activeHref={successRedirectTo}
      actions={<Link href={sourceHref} className={styles.secondaryButton}>Вернуться к объекту</Link>}
    >
      <div className={styles.stack}>
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}
        <section className={styles.panel}>
          <p className={styles.helpText}>
            Сначала проверьте пробный прогон. Этот экран удаляет только чистый тестовый граф и не работает как обычное снятие с публикации.
          </p>
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Тестовые</span>
            {evaluation.root?.published ? <span className={`${styles.badge} ${styles.mediaBadgesuccess}`}>Есть опубликованная версия</span> : null}
            <span className={`${styles.badge} ${evaluation.allowed ? styles.mediaBadgesuccess : styles.mediaBadgedanger}`}>
              {evaluation.allowed ? "Снятие разрешено" : "Снятие заблокировано"}
            </span>
          </div>
        </section>

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Пробный прогон</h3>
          <div className={styles.cockpitCoverageSummary}>
            <strong>{evaluation.root?.label || entityId}</strong>
            <span className={styles.mutedText}>{ENTITY_TYPE_LABELS[normalizedType]}</span>
          </div>
          <ul className={styles.stack}>
            {evaluation.members.map((member) => (
              <li key={`${member.entityType}:${member.entityId}`} className={styles.timelineItem}>
                <div className={styles.cockpitCoverageSummary}>
                  <strong>{member.label}</strong>
                  <span className={styles.mutedText}>{ENTITY_TYPE_LABELS[member.entityType]}</span>
                </div>
                <div className={styles.badgeRow}>
                  <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Тестовые</span>
                  <span className={`${styles.badge} ${member.published ? styles.mediaBadgesuccess : styles.mediaBadgemuted}`}>
                    {getStatusLabel(member)}
                  </span>
                  {member.deactivatePublished ? <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Будет снят опубликованный указатель</span> : null}
                  <span className={`${styles.badge} ${styles.mediaBadgedanger}`}>Будет удалён</span>
                </div>
                <div className={styles.inlineActions}>
                  <Link href={member.href} className={styles.secondaryButton}>Открыть</Link>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {evaluation.survivingRefs?.length > 0 ? (
          <section className={`${styles.panel} ${styles.panelMuted}`}>
            <h3>Что останется в системе</h3>
            <ul className={styles.stack}>
              {evaluation.survivingRefs.map((ref) => (
                <li key={`surviving:${ref.entityType}:${ref.entityId}:${ref.reason}`} className={styles.timelineItem}>
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
          </section>
        ) : null}

        {evaluation.blockers.length > 0 ? (
          <section className={styles.statusPanelBlocking}>
            <strong>Снятие остановлено.</strong>
            <ul className={styles.stack}>
              {evaluation.blockers.map((blocker) => (
                <li key={blocker} className={styles.timelineItem}>{blocker}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {evaluation.blockingRefs?.length > 0 ? (
          <section className={`${styles.panel} ${styles.panelMuted}`}>
            <h3>Какие объекты сейчас мешают teardown</h3>
            <ul className={styles.stack}>
              {evaluation.blockingRefs.map((ref) => (
                <li key={`blocking:${ref.entityType}:${ref.entityId}:${ref.reason}`} className={styles.timelineItem}>
                  <div className={styles.cockpitCoverageSummary}>
                    <strong>{ref.label}</strong>
                    <span className={styles.mutedText}>{ENTITY_TYPE_LABELS[ref.entityType]}</span>
                  </div>
                  <div className={styles.badgeRow}>
                    {ref.state ? <span className={`${styles.badge} ${styles.mediaBadgemuted}`}>{ref.state}</span> : null}
                  </div>
                  <p className={styles.mutedText}>{ref.reason}</p>
                  <div className={styles.inlineActions}>
                    <Link href={ref.href} className={styles.secondaryButton}>Открыть</Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {evaluation.allowed ? (
          <section className={styles.panel}>
            <h3>Выполнение</h3>
            <p className={styles.helpText}>
              Сначала будут деактивированы опубликованные указатели для участников графа, помеченных как тестовые, затем объекты удалятся в безопасном порядке.
            </p>
            <ConfirmActionForm
              action={`/api/admin/entities/${normalizedType}/${entityId}/test-graph-teardown`}
              confirmMessage="Удалить тестовый граф? Действие необратимо."
              className={styles.inlineActions}
            >
              <input type="hidden" name="redirectTo" value={successRedirectTo} />
              <input type="hidden" name="failureRedirectTo" value={failureRedirectTo} />
              <button type="submit" className={styles.dangerButton}>Удалить тестовый граф</button>
            </ConfirmActionForm>
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
