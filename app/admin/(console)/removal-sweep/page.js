import Link from "next/link";

import { AdminShell } from "../../../../components/admin/AdminShell";
import { ConfirmActionForm } from "../../../../components/admin/ConfirmActionForm";
import styles from "../../../../components/admin/admin-ui.module.css";
import { getEntityAdminHref } from "../../../../lib/admin/entity-links.js";
import { requireEditorUser } from "../../../../lib/admin/page-helpers.js";
import { listRemovalSweepComponents } from "../../../../lib/admin/removal-sweep-analysis.js";
import { getRemovalSweepHref } from "../../../../lib/admin/removal-quarantine.js";
import { listRecentDestructiveEvents } from "../../../../lib/content-ops/destructive-forensics.js";
import { getEntityTypeLabel, normalizeLegacyCopy } from "../../../../lib/ui-copy.js";
import { userIsSuperadmin } from "../../../../lib/auth/roles.js";

function renderItemList(items = [], emptyLabel = "Ничего не найдено.") {
  if (items.length === 0) {
    return <p className={styles.mutedText}>{emptyLabel}</p>;
  }

  return (
    <ul className={styles.stack}>
      {items.map((item) => (
        <li key={`${item.entityType}:${item.entityId}:${item.reason ?? item.label ?? "item"}`} className={styles.timelineItem}>
          <div className={styles.cockpitCoverageSummary}>
            <strong>{item.label}</strong>
            <span className={styles.mutedText}>{getEntityTypeLabel(item.entityType)}</span>
          </div>
          {item.reason ? <p className={styles.mutedText}>{item.reason}</p> : null}
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

function formatDateTime(value) {
  if (!value) {
    return "Дата не указана";
  }

  const parsed = Date.parse(value);

  if (!Number.isFinite(parsed)) {
    return "Дата не указана";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow"
  }).format(new Date(parsed));
}

function getOperationLabel(operationKind) {
  switch (operationKind) {
    case "safe_delete":
      return "Безопасное удаление";
    case "live_deactivation":
      return "Снятие с live";
    case "test_graph_teardown":
      return "Удаление тестового графа";
    case "removal_sweep":
      return "Очистка помеченного графа";
    default:
      return operationKind || "Destructive operation";
  }
}

function getOutcomeLabel(outcome) {
  if (outcome === "executed") {
    return "Выполнено";
  }

  if (outcome === "blocked") {
    return "Заблокировано";
  }

  return outcome || "Зафиксировано";
}

function renderDestructiveEvents(events = []) {
  if (events.length === 0) {
    return <p className={styles.mutedText}>Событий destructive ledger пока нет.</p>;
  }

  return (
    <ul className={styles.stack}>
      {events.map((event) => {
        const rootHref = event.rootEntityType && event.rootEntityId
          ? getEntityAdminHref(event.rootEntityType, event.rootEntityId)
          : null;

        return (
          <li key={event.id} className={styles.timelineItem}>
            <div className={styles.cockpitCoverageSummary}>
              <div>
                <strong>{event.summary}</strong>
                <p className={styles.mutedText}>
                  {getOperationLabel(event.operationKind)} • {getOutcomeLabel(event.outcome)} • {formatDateTime(event.createdAt)}
                </p>
              </div>
              <span className={`${styles.badge} ${event.outcome === "executed" ? styles.mediaBadgesuccess : styles.mediaBadgewarning}`}>
                {getOutcomeLabel(event.outcome)}
              </span>
            </div>
            <p className={styles.helpText}>
              Корень: {event.rootEntityLabel || event.rootEntityId || "не указан"}
              {event.rootEntityType ? ` (${getEntityTypeLabel(event.rootEntityType)})` : ""}
            </p>
            {rootHref ? (
              <div className={styles.inlineActions}>
                <Link href={rootHref} className={styles.secondaryButton}>Открыть корень</Link>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function renderComponent(component, { canPurge }) {
  return (
    <section key={`${component.root.entityType}:${component.root.entityId}`} className={`${styles.panel} ${styles.panelMuted}`}>
      <div className={styles.cockpitCoverageSummary}>
        <div>
          <h3>{component.root.label}</h3>
          <p className={styles.mutedText}>{component.summary}</p>
        </div>
        <div className={styles.badgeRow}>
          <span className={`${styles.badge} ${component.verdict === "ready" ? styles.mediaBadgesuccess : styles.mediaBadgedanger}`}>
            {component.verdict === "ready" ? "Готов к очистке" : "Есть блокеры"}
          </span>
          <span className={`${styles.badge} ${styles.mediaBadgemuted}`}>Объектов: {component.memberCount}</span>
        </div>
      </div>

      <div className={styles.inlineActions}>
        <Link href={component.root.href} className={styles.secondaryButton}>Открыть корневой объект</Link>
        {canPurge && component.verdict === "ready" ? (
          <ConfirmActionForm
            action="/api/admin/removal-sweep/purge"
            confirmMessage="Очистить весь помеченный граф? Действие необратимо."
            className={styles.inlineActions}
          >
            <input type="hidden" name="entityType" value={component.root.entityType} />
            <input type="hidden" name="entityId" value={component.root.entityId} />
            <input type="hidden" name="redirectTo" value={getRemovalSweepHref()} />
            <input type="hidden" name="failureRedirectTo" value={getRemovalSweepHref()} />
            <button type="submit" className={styles.dangerButton}>Очистить граф</button>
          </ConfirmActionForm>
        ) : null}
        {!canPurge && component.verdict === "ready" ? (
          <span className={styles.mutedText}>Финальная очистка доступна только superadmin.</span>
        ) : null}
      </div>

      <div className={styles.gridTwo}>
        <section className={styles.panel}>
          <h4>Участники графа</h4>
          {renderItemList(component.members, "В этом компоненте пока нет участников.")}
        </section>
        <section className={styles.panel}>
          <h4>Порядок очистки</h4>
          {renderItemList(component.purgePlan, "План очистки не собран.")}
        </section>
      </div>

      <div className={styles.gridTwo}>
        <section className={styles.panel}>
          <h4>Опубликованные входящие ссылки</h4>
          {renderItemList(component.publishedIncomingRefs, "Опубликованных внешних ссылок нет.")}
        </section>
        <section className={styles.panel}>
          <h4>Рабочие входящие черновики</h4>
          {renderItemList(component.draftIncomingRefs, "Рабочих внешних черновиков нет.")}
        </section>
      </div>

      <div className={styles.gridTwo}>
        <section className={styles.panel}>
          <h4>State-blockers</h4>
          {renderItemList(component.stateBlockers, "Внутренних state-blockers нет.")}
        </section>
        <section className={styles.panel}>
          <h4>Выжившие исходящие ссылки</h4>
          {renderItemList(component.survivingRefs, "Исходящих ссылок вне графа нет.")}
        </section>
      </div>
    </section>
  );
}

export default async function RemovalSweepPage({ searchParams }) {
  const user = await requireEditorUser();
  const query = await searchParams;
  const [components, recentEvents] = await Promise.all([
    listRemovalSweepComponents(),
    listRecentDestructiveEvents({ limit: 12 })
  ]);
  const readyComponents = components.filter((component) => component.verdict === "ready");
  const blockedComponents = components.filter((component) => component.verdict !== "ready");

  return (
    <AdminShell
      user={user}
      title="Центр очистки"
      breadcrumbs={[
        { label: "Админка", href: "/admin" },
        { label: "Очистка" }
      ]}
      activeHref={getRemovalSweepHref()}
    >
      <div className={styles.stack}>
        {query?.message ? <div className={styles.statusPanelInfo}>{normalizeLegacyCopy(query.message)}</div> : null}
        {query?.error ? <div className={styles.statusPanelBlocking}>{normalizeLegacyCopy(query.error)}</div> : null}

        <section className={styles.panel}>
          <h3>Новый cleanup-контур</h3>
          <p className={styles.helpText}>
            Здесь собираются все объекты, помеченные на удаление. Система строит связанный граф, показывает внешние блокеры и позволяет очищать только те компоненты, которые действительно готовы.
          </p>
          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${styles.mediaBadgesuccess}`}>Готово: {readyComponents.length}</span>
            <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>С блокерами: {blockedComponents.length}</span>
            <span className={`${styles.badge} ${styles.mediaBadgemuted}`}>Всего компонентов: {components.length}</span>
          </div>
        </section>

        <section className={styles.panel}>
          <h3>Destructive ledger</h3>
          <p className={styles.helpText}>
            Здесь видны последние blocked и executed destructive operations. Этот журнал переживает hard delete и помогает восстановить картину после очистки.
          </p>
          {renderDestructiveEvents(recentEvents)}
        </section>

        {components.length === 0 ? (
          <section className={styles.panel}>
            <div className={styles.emptyState}>
              <p className={styles.mutedText}>Сейчас нет объектов, помеченных на удаление.</p>
              <p className={styles.helpText}>
                Пометьте услугу, кейс, технику, медиафайл, коллекцию или страницу на экране самой сущности, и она появится здесь вместе со связанным графом.
              </p>
            </div>
          </section>
        ) : null}

        {readyComponents.length > 0 ? (
          <section className={styles.stack}>
            <h3>Готовы к очистке</h3>
            {readyComponents.map((component) => renderComponent(component, { canPurge: userIsSuperadmin(user) }))}
          </section>
        ) : null}

        {blockedComponents.length > 0 ? (
          <section className={styles.stack}>
            <h3>Пока заблокированы</h3>
            {blockedComponents.map((component) => renderComponent(component, { canPurge: userIsSuperadmin(user) }))}
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
