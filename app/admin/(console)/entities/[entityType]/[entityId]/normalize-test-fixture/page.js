import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "../../../../../../../components/admin/AdminShell";
import { ConfirmActionForm } from "../../../../../../../components/admin/ConfirmActionForm";
import styles from "../../../../../../../components/admin/admin-ui.module.css";
import {
  evaluateLegacyTestFixtureNormalization,
  isLegacyTestFixtureNormalizationEntityTypeSupported
} from "../../../../../../../lib/admin/legacy-test-fixture-normalization.js";
import { normalizeLegacyCopy } from "../../../../../../../lib/ui-copy.js";
import { requireSuperadminUser } from "../../../../../../../lib/admin/page-helpers.js";
import { assertEntityType } from "../../../../../../../lib/content-core/service.js";
import { ENTITY_TYPE_LABELS } from "../../../../../../../lib/content-core/content-types.js";

function getCurrentStateLabel(root) {
  if (root?.published) {
    return "Есть active published truth";
  }

  if (root?.hasReviewRevision) {
    return "Есть review-state revision";
  }

  return "Live truth нет";
}

export default async function NormalizeLegacyTestFixturePage({ params, searchParams }) {
  const { entityType, entityId } = await params;
  const query = await searchParams;
  const user = await requireSuperadminUser();
  const normalizedType = assertEntityType(entityType);

  if (!isLegacyTestFixtureNormalizationEntityTypeSupported(normalizedType)) {
    notFound();
  }

  const evaluation = await evaluateLegacyTestFixtureNormalization({
    entityType: normalizedType,
    entityId
  });

  if (!evaluation.exists) {
    notFound();
  }

  const sourceHref = `/admin/entities/${normalizedType}/${entityId}`;
  const failureRedirectTo = `/admin/entities/${normalizedType}/${entityId}/normalize-test-fixture`;
  // This bridge is only for already-existing legacy fixtures that were created before
  // the explicit `test__...` naming canon. New temporary entities must be test-marked
  // at creation time instead of relying on post-hoc normalization.

  return (
    <AdminShell
      user={user}
      title="Нормализовать как тестовый fixture"
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: ENTITY_TYPE_LABELS[normalizedType], href: `/admin/entities/${normalizedType}` },
        { label: evaluation.root?.label || "Нормализация test fixture" }
      ]}
      activeHref={`/admin/entities/${normalizedType}`}
      actions={<Link href={sourceHref} className={styles.secondaryButton}>Вернуться к объекту</Link>}
    >
      <div className={styles.stack}>
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}

        <section className={styles.panel}>
          <p className={styles.helpText}>
            Это корректирующий bridge только для подтверждённых legacy test fixtures. Он меняет persisted marker на
            <code> agent_test </code>, чтобы существующий teardown-путь мог честно рассматривать объект как тестовый.
            Это не delete, не unpublish и не casual tag.
          </p>
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${evaluation.allowed ? styles.mediaBadgesuccess : styles.mediaBadgedanger}`}>
              {evaluation.allowed ? "Нормализация разрешена" : "Нормализация заблокирована"}
            </span>
            {evaluation.root?.published ? <span className={`${styles.badge} ${styles.mediaBadgesuccess}`}>Есть published truth</span> : null}
            {evaluation.root?.hasReviewRevision ? <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Есть review residue</span> : null}
            <span className={`${styles.badge} ${styles.mediaBadgemuted}`}>
              marker: {evaluation.root?.creationOrigin || "null"} → {evaluation.root?.resultingCreationOrigin || "agent_test"}
            </span>
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
              <strong>Что изменится</strong>
              <p className={styles.mutedText}>После операции объект станет test-marked и в editor UI появится вход в `Удалить тестовый граф`, если остальные условия тоже соблюдены.</p>
            </li>
            <li className={styles.timelineItem}>
              <strong>Что не изменится</strong>
              <p className={styles.mutedText}>Нормализация сама по себе не удаляет объект, не снимает review residue и не обходит published/ref safety rules.</p>
            </li>
          </ul>
        </section>

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Входящие опубликованные ссылки</h3>
          {evaluation.publishedIncomingRefs.length === 0 ? (
            <p className={styles.mutedText}>Опубликованных нетестовых ссылок не найдено.</p>
          ) : (
            <ul className={styles.stack}>
              {evaluation.publishedIncomingRefs.map((ref) => (
                <li key={`${ref.entityType}:${ref.entityId}:published`} className={styles.timelineItem}>
                  <div className={styles.cockpitCoverageSummary}>
                    <strong>{ref.label}</strong>
                    <span className={styles.mutedText}>{ENTITY_TYPE_LABELS[ref.entityType]}</span>
                  </div>
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
                  <div className={styles.inlineActions}>
                    <Link href={ref.href} className={styles.secondaryButton}>Открыть</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Связанные Page / Service / Case</h3>
          {evaluation.relatedTargets.length === 0 ? (
            <p className={styles.mutedText}>Связанных route-owning сущностей в этом срезе не найдено.</p>
          ) : (
            <ul className={styles.stack}>
              {evaluation.relatedTargets.map((target) => (
                <li key={`${target.entityType}:${target.entityId}`} className={styles.timelineItem}>
                  <div className={styles.cockpitCoverageSummary}>
                    <strong>{target.label}</strong>
                    <span className={styles.mutedText}>{ENTITY_TYPE_LABELS[target.entityType]}</span>
                  </div>
                  <div className={styles.badgeRow}>
                    <span className={`${styles.badge} ${target.isTestData ? styles.mediaBadgewarning : styles.mediaBadgemuted}`}>
                      {target.isTestData ? "Уже test-marked" : "Без test marker"}
                    </span>
                    {target.published ? <span className={`${styles.badge} ${styles.mediaBadgesuccess}`}>Published</span> : null}
                    {target.hasReviewRevision ? <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Review residue</span> : null}
                  </div>
                  <div className={styles.inlineActions}>
                    <Link href={target.href} className={styles.secondaryButton}>Открыть</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {evaluation.warnings.length > 0 ? (
          <section className={styles.statusPanelWarning}>
            <strong>Что всё ещё может блокировать teardown</strong>
            <ul className={styles.stack}>
              {evaluation.warnings.map((warning) => (
                <li key={warning} className={styles.timelineItem}>{warning}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {evaluation.blockers.length > 0 ? (
          <section className={styles.statusPanelBlocking}>
            <strong>Нормализация остановлена.</strong>
            <ul className={styles.stack}>
              {evaluation.blockers.map((blocker) => (
                <li key={blocker} className={styles.timelineItem}>{blocker}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {evaluation.allowed ? (
          <section className={styles.panel}>
            <h3>Подтверждение</h3>
            <p className={styles.helpText}>
              Используйте это только для подтверждённых legacy test fixtures. После пометки объект войдёт в test-marked teardown path, но не будет удалён автоматически.
            </p>
            <ConfirmActionForm
              action={`/api/admin/entities/${normalizedType}/${entityId}/normalize-test-fixture`}
              confirmMessage="Пометить объект как legacy test fixture? Это изменит teardown eligibility и запишется в аудит."
              className={styles.inlineActions}
            >
              <input type="hidden" name="redirectTo" value={sourceHref} />
              <input type="hidden" name="failureRedirectTo" value={failureRedirectTo} />
              <button type="submit" className={styles.dangerButton}>Пометить как тестовые</button>
            </ConfirmActionForm>
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
