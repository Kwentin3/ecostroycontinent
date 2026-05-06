import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "../../../../../../../components/admin/AdminShell";
import { ConfirmActionForm } from "../../../../../../../components/admin/ConfirmActionForm";
import styles from "../../../../../../../components/admin/admin-ui.module.css";
import { requireEditorUser } from "../../../../../../../lib/admin/page-helpers.js";
import { isDeleteToolEntityTypeSupported } from "../../../../../../../lib/admin/entity-delete.js";
import { appendAdminReturnTo, normalizeAdminReturnTo } from "../../../../../../../lib/admin/relation-navigation.js";
import { buildSafeRemovalPlan } from "../../../../../../../lib/admin/safe-removal-plan.js";
import { userCanEditContent, userCanPublish } from "../../../../../../../lib/auth/session.js";
import { ENTITY_TYPES, ENTITY_TYPE_LABELS } from "../../../../../../../lib/content-core/content-types.js";
import { assertEntityType } from "../../../../../../../lib/content-core/service.js";
import { normalizeLegacyCopy } from "../../../../../../../lib/ui-copy.js";

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

function getActionClassName(action) {
  if (action?.tone === "primary") {
    return styles.primaryButton;
  }

  if (action?.tone === "danger") {
    return styles.dangerButton;
  }

  return styles.secondaryButton;
}

function getStepStatusLabel(status) {
  switch (status) {
    case "done":
      return "готово";
    case "current":
      return "сейчас";
    case "blocked":
      return "блокер";
    default:
      return "дальше";
  }
}

function getStepStatusClass(status) {
  switch (status) {
    case "done":
      return styles.mediaBadgesuccess;
    case "current":
      return styles.mediaBadgewarning;
    case "blocked":
      return styles.mediaBadgedanger;
    default:
      return styles.mediaBadgemuted;
  }
}

function canUsePlanAction(action, permissions) {
  if (!action?.permission) {
    return true;
  }

  if (action.permission === "publish") {
    return permissions.canPublish;
  }

  if (action.permission === "edit") {
    return permissions.canEdit;
  }

  return true;
}

function renderPlanAction(action, permissions) {
  if (!action) {
    return null;
  }

  if (!canUsePlanAction(action, permissions)) {
    return (
      <p className={styles.mutedText}>
        {action.permission === "publish"
          ? "Для этого шага нужны права публикации."
          : "Для этого шага нужны редакторские права."}
      </p>
    );
  }

  if (action.type === "link") {
    return (
      <div className={styles.inlineActions}>
        <Link href={action.href} className={getActionClassName(action)}>
          {action.label}
        </Link>
      </div>
    );
  }

  if (action.type === "form") {
    return (
      <ConfirmActionForm
        action={action.action}
        confirmMessage={action.confirmMessage}
        className={styles.inlineActions}
      >
        {action.fields.map((field) => (
          <input key={`${field.name}:${field.value}`} type="hidden" name={field.name} value={field.value} />
        ))}
        <button type="submit" className={getActionClassName(action)}>
          {action.label}
        </button>
      </ConfirmActionForm>
    );
  }

  return null;
}

function renderStateItems(items = [], typeLabel = "Состояние") {
  if (items.length === 0) {
    return <p className={styles.mutedText}>Дополнительных блокировок не найдено.</p>;
  }

  return (
    <ul className={styles.stack}>
      {items.map((item) => (
        <li key={`${item.kind ?? item.entityType}:${item.reason ?? item.label}:${item.href ?? ""}`} className={styles.timelineItem}>
          <div className={styles.cockpitCoverageSummary}>
            <strong>{item.label}</strong>
            <span className={styles.mutedText}>{typeLabel}</span>
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

function renderReferenceItems(items = [], typeLabel) {
  if (items.length === 0) {
    return <p className={styles.mutedText}>Ничего не найдено.</p>;
  }

  return (
    <ul className={styles.stack}>
      {items.map((item) => (
        <li key={`${item.entityType}:${item.entityId}:${item.state ?? "ref"}`} className={styles.timelineItem}>
          <div className={styles.cockpitCoverageSummary}>
            <strong>{item.label}</strong>
            <span className={styles.mutedText}>{ENTITY_TYPE_LABELS[item.entityType] || typeLabel}</span>
          </div>
          {"reason" in item && item.reason ? <p className={styles.mutedText}>{item.reason}</p> : null}
          {"state" in item ? <p className={styles.helpText}>Состояние ссылки: {item.state === "published" ? "опубликована" : "черновик"}</p> : null}
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

function renderRouteEffects(routeEffects) {
  if (!routeEffects) {
    return null;
  }

  return (
    <section className={`${styles.panel} ${styles.panelMuted}`}>
      <h3>Что изменится после снятия с публикации</h3>
      <ul className={styles.stack}>
        <li className={styles.timelineItem}>
          <strong>Маршрут</strong>
          <p className={styles.mutedText}>{routeEffects.routePath || "Маршрут не удалось определить."}</p>
        </li>
        <li className={styles.timelineItem}>
          <strong>Публичный результат</strong>
          <p className={styles.mutedText}>{routeEffects.routeOutcome || "Публичный результат не рассчитан."}</p>
        </li>
        <li className={styles.timelineItem}>
          <strong>Листинг</strong>
          <p className={styles.mutedText}>{routeEffects.listImpact || "Отдельного листинга в этом срезе нет."}</p>
        </li>
        <li className={styles.timelineItem}>
          <strong>Карта сайта</strong>
          <p className={styles.mutedText}>{routeEffects.sitemapImpact || "Изменений sitemap в этом сценарии не ожидается."}</p>
        </li>
        <li className={styles.timelineItem}>
          <strong>Какие адреса обновятся</strong>
          <p className={styles.mutedText}>
            {(routeEffects.revalidationPaths ?? []).length > 0
              ? routeEffects.revalidationPaths.join(", ")
              : "Дополнительного обновления страниц не требуется."}
          </p>
        </li>
      </ul>
    </section>
  );
}

export default async function DeleteEntityPage({ params, searchParams }) {
  const { entityType, entityId } = await params;
  const query = await searchParams;
  const user = await requireEditorUser();
  const normalizedType = assertEntityType(entityType);

  if (!isDeleteToolEntityTypeSupported(normalizedType)) {
    notFound();
  }

  const normalizedReturnTo = normalizeAdminReturnTo(query?.returnTo);
  const fallbackSourceHref = getEntitySourceHref(normalizedType, entityId);
  const sourceHref = normalizedReturnTo || fallbackSourceHref;
  const redirectTo = normalizedReturnTo || getEntityListHref(normalizedType);
  const currentDeleteHref = appendAdminReturnTo(`/admin/entities/${normalizedType}/${entityId}/delete`, normalizedReturnTo);
  const failureRedirectTo = currentDeleteHref;
  const plan = await buildSafeRemovalPlan({
    entityType: normalizedType,
    entityId,
    currentHref: currentDeleteHref,
    redirectTo,
    failureRedirectTo
  });

  if (!plan.exists) {
    notFound();
  }

  const permissions = {
    canEdit: userCanEditContent(user),
    canPublish: userCanPublish(user)
  };
  const stateBlockers = plan.deleteEvaluation?.stateBlockers ?? [];
  const publishedIncomingRefs = plan.deleteEvaluation?.publishedIncomingRefs ?? [];
  const draftIncomingRefs = plan.deleteEvaluation?.draftIncomingRefs ?? [];

  return (
    <AdminShell
      user={user}
      title="Безопасно убрать объект"
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: ENTITY_TYPE_LABELS[normalizedType], href: `/admin/entities/${normalizedType}` },
        { label: plan.root?.label || "Безопасно убрать объект" }
      ]}
      activeHref={`/admin/entities/${normalizedType}`}
      actions={<Link href={sourceHref} className={styles.secondaryButton}>Вернуться к объекту</Link>}
    >
      <div className={styles.stack}>
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}

        <section className={styles.panel}>
          <p className={styles.helpText}>
            Один экран для безопасного удаления: здесь видно, что именно мешает, какой шаг нужно сделать следующим и где подтвердить финальное действие.
          </p>
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${plan.mode === "delete_ready" || plan.mode === "test_graph_ready" ? styles.mediaBadgesuccess : styles.mediaBadgewarning}`}>
              {plan.mode === "delete_ready" || plan.mode === "test_graph_ready"
                ? "Готово к следующему действию"
                : "Нужны промежуточные шаги"}
            </span>
            {plan.root?.published ? <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Есть live-версия</span> : null}
            {plan.root?.hasReviewRevision ? <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Есть ревизия на проверке</span> : null}
            {(plan.root?.openObligationsCount ?? 0) > 0 ? <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Есть открытые обязательства</span> : null}
            {plan.root?.isTestData ? <span className={`${styles.badge} ${styles.mediaBadgesuccess}`}>Тестовый объект</span> : null}
          </div>
          <p className={styles.helpText}>{plan.summary}</p>
          {renderPlanAction(plan.primaryAction, permissions)}
          {plan.fallbackPlan ? (
            <>
              <p className={styles.helpText}>{plan.fallbackPlan.label}</p>
              {renderPlanAction(plan.fallbackPlan.action, permissions)}
            </>
          ) : null}
        </section>

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Пошаговый план</h3>
          <ul className={styles.stack}>
            {plan.steps.map((step, index) => (
              <li key={step.id} className={styles.timelineItem}>
                <div className={styles.cockpitCoverageSummary}>
                  <strong>{`${index + 1}. ${step.title}`}</strong>
                  <span className={`${styles.badge} ${getStepStatusClass(step.status)}`}>{getStepStatusLabel(step.status)}</span>
                </div>
                <p className={styles.mutedText}>{step.description}</p>
                {renderPlanAction(step.action, permissions)}
              </li>
            ))}
          </ul>
        </section>

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Текущий статус объекта</h3>
          <ul className={styles.stack}>
            <li className={styles.timelineItem}>
              <strong>Объект</strong>
              <p className={styles.mutedText}>{plan.root?.label || entityId}</p>
            </li>
            <li className={styles.timelineItem}>
              <strong>Состояние</strong>
              <p className={styles.mutedText}>{plan.currentStateLabel}</p>
            </li>
            <li className={styles.timelineItem}>
              <strong>Что будет финалом</strong>
              <p className={styles.mutedText}>
                {plan.root?.isTestData
                  ? "Тестовый граф будет снят с публикации там, где это нужно, и удалён в безопасном порядке."
                  : "После снятия всех блокировок объект можно будет удалить необратимо."}
              </p>
            </li>
          </ul>
        </section>

        {renderRouteEffects(plan.liveDeactivationEvaluation?.routeEffects ?? null)}

        {plan.deleteEvaluation?.reasons?.length > 0 ? (
          <section className={styles.statusPanelBlocking}>
            <strong>Почему удаление сейчас не идёт в один шаг</strong>
            <ul className={styles.stack}>
              {plan.deleteEvaluation.reasons.map((reason) => (
                <li key={reason} className={styles.timelineItem}>{reason}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Состояния, которые мешают удалению</h3>
          {stateBlockers.length === 0
            ? <p className={styles.mutedText}>State-blockers не найдены.</p>
            : renderStateItems(stateBlockers, "Состояние объекта")}
        </section>

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Входящие опубликованные ссылки</h3>
          {publishedIncomingRefs.length === 0
            ? <p className={styles.mutedText}>Опубликованных входящих ссылок не найдено.</p>
            : renderReferenceItems(publishedIncomingRefs, "Связанная сущность")}
        </section>

        <section className={`${styles.panel} ${styles.panelMuted}`}>
          <h3>Входящие рабочие черновики</h3>
          {draftIncomingRefs.length === 0
            ? <p className={styles.mutedText}>Нет нетестовых черновиков, которые держат этот объект.</p>
            : renderReferenceItems(draftIncomingRefs, "Черновик")}
        </section>

        {plan.liveDeactivationEvaluation?.reviewResidue?.length > 0 ? (
          <section className={`${styles.panel} ${styles.panelMuted}`}>
            <h3>Ревизии на проверке</h3>
            {renderStateItems(plan.liveDeactivationEvaluation.reviewResidue, "Проверка и публикация")}
          </section>
        ) : null}

        {plan.liveDeactivationEvaluation?.openObligations?.length > 0 ? (
          <section className={`${styles.panel} ${styles.panelMuted}`}>
            <h3>Открытые обязательства</h3>
            {renderStateItems(plan.liveDeactivationEvaluation.openObligations, "Publish-обязательство")}
          </section>
        ) : null}

        {plan.testGraphEvaluation?.members?.length > 0 ? (
          <section className={`${styles.panel} ${styles.panelMuted}`}>
            <h3>Что войдёт в удаление тестового графа</h3>
            {renderReferenceItems(plan.testGraphEvaluation.members, "Участник графа")}
          </section>
        ) : null}

        {plan.testGraphEvaluation?.blockingRefs?.length > 0 ? (
          <section className={`${styles.panel} ${styles.panelMuted}`}>
            <h3>Что сейчас удерживает тестовый граф</h3>
            {renderReferenceItems(plan.testGraphEvaluation.blockingRefs, "Блокирующая сущность")}
          </section>
        ) : null}

        {plan.testGraphEvaluation?.survivingRefs?.length > 0 ? (
          <section className={`${styles.panel} ${styles.panelMuted}`}>
            <h3>Что останется вне тестового графа</h3>
            {renderReferenceItems(plan.testGraphEvaluation.survivingRefs, "Останется в системе")}
          </section>
        ) : null}

        {plan.secondaryAction ? (
          <section className={styles.panel}>
            <h3>Если это старый тестовый объект без метки</h3>
            <p className={styles.helpText}>
              Этот путь нужен только для подтверждённых исторических test-fixture объектов. После пометки откроется управляемый путь удаления тестового графа.
            </p>
            {renderPlanAction(plan.secondaryAction, permissions)}
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
