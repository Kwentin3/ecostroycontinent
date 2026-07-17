"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  filterRemovalSweepWorkspaceItems,
  getPrimaryRemovalSweepBlocker,
  getRemovalSweepBlockers,
  getRemovalSweepWorkspaceCardKey,
  REMOVAL_SWEEP_WORKSPACE_TABS
} from "../../lib/admin/removal-sweep-workspace.js";
import { getEntityTypeLabel } from "../../lib/ui-copy.js";
import { RemovalSweepBatchDialog } from "./RemovalSweepBatchDialog";
import styles from "./admin-ui.module.css";

const TAB_COPY = Object.freeze({
  [REMOVAL_SWEEP_WORKSPACE_TABS.READY]: "Можно удалить",
  [REMOVAL_SWEEP_WORKSPACE_TABS.BLOCKED]: "Пока нельзя",
  [REMOVAL_SWEEP_WORKSPACE_TABS.HISTORY]: "История"
});

function formatDateTime(value) {
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

function getOutcomeLabel(outcome) {
  if (outcome === "executed") {
    return "Удалено";
  }

  if (outcome === "blocked") {
    return "Не удалено";
  }

  return "Зафиксировано";
}

function RemovalEntityVisual({ root }) {
  return (
    <span className={styles.removalSweepCardVisual} aria-hidden="true">
      <span>{getEntityTypeLabel(root.entityType).slice(0, 1)}</span>
      {root.thumbnailUrl ? (
        <img
          src={root.thumbnailUrl}
          alt=""
          decoding="async"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      ) : null}
    </span>
  );
}

function RemovalMemberList({ title, items }) {
  return (
    <section className={styles.removalSweepDetailSection}>
      <h4>{title}</h4>
      <ul className={styles.removalSweepDetailList}>
        {items.map((item) => (
          <li key={`${item.entityType}:${item.entityId}:${item.reason ?? "member"}`}>
            <div>
              <strong>{item.label}</strong>
              <span>{getEntityTypeLabel(item.entityType)}</span>
              {item.reason ? <p>{item.reason}</p> : null}
            </div>
            {item.href ? <Link href={item.href}>Открыть</Link> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RemovalSweepCard({ component, ready, canPurge, selected, expanded, onSelect, onToggle }) {
  const cardKey = getRemovalSweepWorkspaceCardKey(component);
  const blockers = getRemovalSweepBlockers(component);
  const primaryBlocker = getPrimaryRemovalSweepBlocker(component);
  const detailId = `removal-sweep-detail-${cardKey.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const relatedCount = Math.max(0, component.memberCount - 1);

  return (
    <article className={`${styles.removalSweepCard} ${ready ? styles.removalSweepCardReady : styles.removalSweepCardBlocked}`}>
      <div className={styles.removalSweepCardMain}>
        {ready && canPurge ? (
          <label className={styles.removalSweepCardCheckbox}>
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect(cardKey)}
              aria-label={`Выбрать «${component.root.label}» для удаления`}
            />
            <span aria-hidden="true" />
          </label>
        ) : null}

        <RemovalEntityVisual root={component.root} />

        <div className={styles.removalSweepCardContent}>
          <div className={styles.removalSweepCardHeading}>
            <div>
              <span className={styles.removalSweepCardType}>{getEntityTypeLabel(component.root.entityType)}</span>
              <h3>{component.root.label}</h3>
            </div>
            <span className={`${styles.removalSweepStatus} ${ready ? styles.removalSweepStatusReady : styles.removalSweepStatusBlocked}`}>
              {ready ? "Можно удалить" : "Пока нельзя"}
            </span>
          </div>

          <p className={styles.removalSweepCardSummary}>
            {ready ? component.summary : (primaryBlocker?.reason || component.summary)}
          </p>

          <div className={styles.removalSweepCardMeta}>
            <span>{component.memberCount === 1 ? "Удаляется 1 объект" : `Объектов в группе: ${component.memberCount}`}</span>
            {relatedCount > 0 ? <span>Связанных объектов: {relatedCount}</span> : null}
            {!ready && blockers.length > 1 ? <span>Причин: {blockers.length}</span> : null}
          </div>
        </div>

        <div className={styles.removalSweepCardActions}>
          {!ready && primaryBlocker?.href ? (
            <Link href={primaryBlocker.href} className={styles.secondaryButton}>Открыть причину</Link>
          ) : (
            <Link href={component.root.href} className={styles.secondaryButton}>Открыть объект</Link>
          )}
          <button
            type="button"
            className={styles.removalSweepDisclosureButton}
            aria-expanded={expanded}
            aria-controls={detailId}
            onClick={() => onToggle(cardKey)}
          >
            {expanded ? "Скрыть подробности" : "Подробнее"}
          </button>
        </div>
      </div>

      {expanded ? (
        <div id={detailId} className={styles.removalSweepCardDetails}>
          {!ready ? (
            blockers.length > 0
              ? <RemovalMemberList title="Почему пока нельзя удалить" items={blockers} />
              : <p className={styles.helpText}>{component.summary}</p>
          ) : null}
          <RemovalMemberList title={ready ? "Что будет удалено" : "Заявлено на удаление"} items={component.members} />
        </div>
      ) : null}
    </article>
  );
}

function RemovalSweepHistory({ events }) {
  if (events.length === 0) {
    return (
      <div className={styles.removalSweepEmptyState}>
        <h3>История пока пуста</h3>
        <p>Здесь появятся выполненные и заблокированные операции очистки.</p>
      </div>
    );
  }

  return (
    <ul className={styles.removalSweepHistoryList}>
      {events.map((event) => {
        const outcomeLabel = getOutcomeLabel(event.outcome);

        return (
          <li key={event.id}>
            <div>
              <strong>{event.rootEntityLabel || event.summary}</strong>
              <span>{outcomeLabel} • {formatDateTime(event.createdAt)}</span>
            </div>
            <span className={`${styles.removalSweepStatus} ${event.outcome === "executed" ? styles.removalSweepStatusReady : styles.removalSweepStatusBlocked}`}>
              {outcomeLabel}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function RemovalSweepWorkspace({
  initialComponents,
  initialEvents,
  canPurge,
  initialMessage = "",
  initialError = ""
}) {
  const router = useRouter();
  const selectAllRef = useRef(null);
  const [components, setComponents] = useState(initialComponents);
  const [activeTab, setActiveTab] = useState(REMOVAL_SWEEP_WORKSPACE_TABS.READY);
  const [query, setQuery] = useState("");
  const [expandedKey, setExpandedKey] = useState("");
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [preview, setPreview] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [executeBusy, setExecuteBusy] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const [error, setError] = useState(initialError);

  useEffect(() => {
    setComponents(initialComponents);
  }, [initialComponents]);

  useEffect(() => {
    setSelectedKeys([]);
    setExpandedKey("");
  }, [activeTab, query]);

  const readyComponents = useMemo(
    () => components.filter((component) => component.verdict === "ready"),
    [components]
  );
  const blockedComponents = useMemo(
    () => components.filter((component) => component.verdict !== "ready"),
    [components]
  );
  const visibleReadyComponents = useMemo(
    () => filterRemovalSweepWorkspaceItems(readyComponents, query),
    [readyComponents, query]
  );
  const visibleBlockedComponents = useMemo(
    () => filterRemovalSweepWorkspaceItems(blockedComponents, query),
    [blockedComponents, query]
  );
  const visibleReadyKeys = visibleReadyComponents.map(getRemovalSweepWorkspaceCardKey);
  const allVisibleSelected = visibleReadyKeys.length > 0 && visibleReadyKeys.every((key) => selectedKeys.includes(key));
  const someVisibleSelected = visibleReadyKeys.some((key) => selectedKeys.includes(key));
  const busy = previewBusy || executeBusy;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
    }
  }, [allVisibleSelected, someVisibleSelected]);

  function toggleSelection(cardKey) {
    setSelectedKeys((current) => (
      current.includes(cardKey)
        ? current.filter((key) => key !== cardKey)
        : [...current, cardKey]
    ));
  }

  function toggleAllVisible() {
    setSelectedKeys(allVisibleSelected ? [] : visibleReadyKeys);
  }

  function makeBatchFormData(intent) {
    const formData = new FormData();
    formData.set("intent", intent);

    for (const componentKey of selectedKeys) {
      formData.append("componentKey", componentKey);
    }

    return formData;
  }

  async function openBatchDialog() {
    if (selectedKeys.length === 0) {
      return;
    }

    setPreviewBusy(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/removal-sweep/bulk-purge", {
        method: "POST",
        body: makeBatchFormData("preview")
      });
      const payload = await response.json().catch(() => ({
        error: response.redirected
          ? "Сессия завершена. Обновите страницу и войдите снова."
          : "Сервер вернул неожиданный ответ."
      }));

      if (!response.ok) {
        throw new Error(payload.error || "Не удалось проверить выбранные карточки.");
      }

      setPreview(payload);
      setDialogOpen(true);
    } catch (previewError) {
      setError(previewError.message || "Не удалось проверить выбранные карточки.");
    } finally {
      setPreviewBusy(false);
    }
  }

  async function executeBatchRemoval() {
    setExecuteBusy(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/removal-sweep/bulk-purge", {
        method: "POST",
        body: makeBatchFormData("execute")
      });
      const payload = await response.json().catch(() => ({
        error: response.redirected
          ? "Сессия завершена. Обновите страницу и войдите снова."
          : "Сервер вернул неожиданный ответ.",
        deletedComponentCount: 0,
        failedComponentCount: 0
      }));
      const deletedRootKeys = (payload.deletedComponents ?? [])
        .map((component) => getRemovalSweepWorkspaceCardKey(component))
        .filter(Boolean);

      if (payload.deletedComponentCount > 0) {
        setComponents((current) => current.filter((component) => (
          !deletedRootKeys.includes(getRemovalSweepWorkspaceCardKey(component))
        )));
        setMessage(payload.message || "Выбранные объекты удалены.");
      }

      if (payload.failedComponentCount > 0 || !response.ok) {
        const failureDetails = (payload.failedComponents ?? [])
          .map((component) => component.error)
          .filter(Boolean)
          .join(" ");
        setError(failureDetails || payload.error || "Не все выбранные объекты удалось удалить.");
      }

      setSelectedKeys([]);
      setDialogOpen(false);
      setPreview(null);
      router.refresh();
    } catch (executeError) {
      setError(executeError.message || "Не удалось удалить выбранные объекты.");
      setDialogOpen(false);
      setPreview(null);
      router.refresh();
    } finally {
      setExecuteBusy(false);
    }
  }

  function changeTab(tab) {
    if (!busy) {
      setActiveTab(tab);
      setMessage("");
      setError("");
    }
  }

  function toggleExpanded(cardKey) {
    setExpandedKey((current) => current === cardKey ? "" : cardKey);
  }

  const activeItems = activeTab === REMOVAL_SWEEP_WORKSPACE_TABS.READY
    ? visibleReadyComponents
    : visibleBlockedComponents;

  return (
    <div className={styles.removalSweepWorkspace}>
      <section className={styles.removalSweepOverview}>
        <div>
          <h2>Очередь безопасного удаления</h2>
          <p>Удаляйте готовые карточки или откройте понятную причину, если объект пока удалить нельзя.</p>
        </div>
        <div className={styles.removalSweepOverviewCounts} aria-label="Сводка очереди">
          <span><strong>{readyComponents.length}</strong> можно удалить</span>
          <span><strong>{blockedComponents.length}</strong> пока нельзя</span>
        </div>
      </section>

      {message ? <div className={styles.statusPanelInfo} role="status">{message}</div> : null}
      {error ? <div className={styles.statusPanelBlocking} role="alert">{error}</div> : null}

      <div className={styles.removalSweepTabs} role="tablist" aria-label="Разделы очистки">
        {Object.values(REMOVAL_SWEEP_WORKSPACE_TABS).map((tab) => {
          const count = tab === REMOVAL_SWEEP_WORKSPACE_TABS.READY
            ? readyComponents.length
            : tab === REMOVAL_SWEEP_WORKSPACE_TABS.BLOCKED
              ? blockedComponents.length
              : initialEvents.length;

          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`removal-sweep-panel-${tab}`}
              className={activeTab === tab ? styles.removalSweepTabActive : ""}
              onClick={() => changeTab(tab)}
              disabled={busy}
            >
              {TAB_COPY[tab]} <span>{count}</span>
            </button>
          );
        })}
      </div>

      {activeTab !== REMOVAL_SWEEP_WORKSPACE_TABS.HISTORY ? (
        <label className={styles.removalSweepSearch}>
          <span>Найти объект</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Название объекта или причина"
            disabled={busy}
          />
        </label>
      ) : null}

      {activeTab === REMOVAL_SWEEP_WORKSPACE_TABS.READY && canPurge ? (
        <section className={styles.removalSweepBulkBar} aria-label="Групповые действия">
          <label>
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleAllVisible}
              disabled={busy || visibleReadyKeys.length === 0}
            />
            <span>Выбрать все видимые</span>
          </label>
          <strong>Выбрано: {selectedKeys.length}</strong>
          <div className={styles.inlineActions}>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={openBatchDialog}
              disabled={busy || selectedKeys.length === 0}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-1 11H8L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" />
              </svg>
              {previewBusy ? "Проверяем..." : "Удалить выбранные"}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setSelectedKeys([])}
              disabled={busy || selectedKeys.length === 0}
            >
              Снять выделение
            </button>
          </div>
        </section>
      ) : null}

      {activeTab === REMOVAL_SWEEP_WORKSPACE_TABS.READY && !canPurge ? (
        <div className={styles.statusPanelInfo}>Просматривать очередь могут редакторы. Окончательное удаление доступно только superadmin.</div>
      ) : null}

      <section
        id={`removal-sweep-panel-${activeTab}`}
        role="tabpanel"
        className={styles.removalSweepPanel}
      >
        {activeTab === REMOVAL_SWEEP_WORKSPACE_TABS.HISTORY ? (
          <RemovalSweepHistory events={initialEvents} />
        ) : activeItems.length > 0 ? (
          <div className={styles.removalSweepCardList}>
            {activeItems.map((component) => {
              const cardKey = getRemovalSweepWorkspaceCardKey(component);

              return (
                <RemovalSweepCard
                  key={cardKey}
                  component={component}
                  ready={activeTab === REMOVAL_SWEEP_WORKSPACE_TABS.READY}
                  canPurge={canPurge}
                  selected={selectedKeys.includes(cardKey)}
                  expanded={expandedKey === cardKey}
                  onSelect={toggleSelection}
                  onToggle={toggleExpanded}
                />
              );
            })}
          </div>
        ) : (
          <div className={styles.removalSweepEmptyState}>
            <h3>{query ? "Ничего не найдено" : activeTab === REMOVAL_SWEEP_WORKSPACE_TABS.READY ? "Нет готовых к удалению объектов" : "Нет объектов, ожидающих действий"}</h3>
            <p>{query ? "Измените поисковый запрос." : activeTab === REMOVAL_SWEEP_WORKSPACE_TABS.READY ? "Безопасные карточки появятся здесь после автоматической проверки." : "Все заявленные объекты либо готовы к удалению, либо очередь пуста."}</p>
          </div>
        )}
      </section>

      <RemovalSweepBatchDialog
        open={dialogOpen}
        busy={executeBusy}
        preview={preview}
        onClose={() => {
          if (!executeBusy) {
            setDialogOpen(false);
            setPreview(null);
          }
        }}
        onConfirm={executeBatchRemoval}
      />
    </div>
  );
}
