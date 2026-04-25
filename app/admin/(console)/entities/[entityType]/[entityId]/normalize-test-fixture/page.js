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
    return "Есть активная опубликованная версия";
  }

  if (root?.hasReviewRevision) {
    return "Есть ревизия на проверке";
  }

  return "Активной опубликованной версии нет";
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

  return (
    <AdminShell
      user={user}
      title="Нормализовать как тестовый набор"
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: ENTITY_TYPE_LABELS[normalizedType], href: `/admin/entities/${normalizedType}` },
        { label: evaluation.root?.label || "Нормализация тестового набора" }
      ]}
      activeHref={`/admin/entities/${normalizedType}`}
      actions={<Link href={sourceHref} className={styles.secondaryButton}>Вернуться к объекту</Link>}
    >
      <div className={styles.stack}>
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}

        <section className={styles.panel}>
          <p className={styles.helpText}>
            Это корректирующий экран только для подтвержденных устаревших тестовых наборов. Он меняет сохраненную метку происхождения на
            <code> agent_test </code>,
            чтобы существующий путь безопасного удаления мог честно считать объект тестовым. Это не удаление, не снятие с публикации и не обход дисциплины публикации.
          </p>
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${evaluation.allowed ? styles.mediaBadgesuccess : styles.mediaBadgedanger}`}>
              {evaluation.allowed ? "Нормализация разрешена" : "Нормализация заблокирована"}
            </span>
            {evaluation.root?.published ? <span className={`${styles.badge} ${styles.mediaBadgesuccess}`}>Есть опубликованная версия</span> : null}
            {evaluation.root?.hasReviewRevision ? <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Есть остаток проверки</span> : null}
            <span className={`${styles.badge} ${styles.mediaBadgemuted}`}>
              Метка: {evaluation.root?.creationOrigin || "null"} → {evaluation.root?.resultingCreationOrigin || "agent_test"}
            </span>
          </div>
        </section>

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Предпросмотр операции</h3>
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
              <p className={styles.mutedText}>После операции объект станет помеченным как тестовый, и в операторском интерфейсе станет доступен путь удаления тестового графа, если остальные условия безопасности тоже выполнены.</p>
            </li>
            <li className={styles.timelineItem}>
              <strong>Что не изменится</strong>
              <p className={styles.mutedText}>Нормализация сама по себе не удаляет объект, не снимает его с публикации, не закрывает остатки проверки и не убирает publish-обязательства.</p>
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
          <h3>Связанные сущности с собственным маршрутом</h3>
          {evaluation.relatedTargets.length === 0 ? (
            <p className={styles.mutedText}>Связанных страниц, услуг и кейсов в этом срезе не найдено.</p>
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
                      {target.isTestData ? "Уже помечен как тестовый" : "Без тестовой метки"}
                    </span>
                    {target.published ? <span className={`${styles.badge} ${styles.mediaBadgesuccess}`}>Опубликовано</span> : null}
                    {target.hasReviewRevision ? <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Остаток проверки</span> : null}
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
            <strong>Что еще может заблокировать последующее удаление</strong>
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
              Используйте это только для подтвержденных устаревших тестовых наборов. После пометки объект войдет в тестовый контур удаления, но не будет удален автоматически.
            </p>
            <ConfirmActionForm
              action={`/api/admin/entities/${normalizedType}/${entityId}/normalize-test-fixture`}
              confirmMessage="Пометить объект как устаревший тестовый набор? Это изменит путь безопасного удаления и запишется в форензик-журнал."
              className={styles.inlineActions}
            >
              <input type="hidden" name="redirectTo" value={sourceHref} />
              <input type="hidden" name="failureRedirectTo" value={failureRedirectTo} />
              <button type="submit" className={styles.dangerButton}>Пометить как тестовый</button>
            </ConfirmActionForm>
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
