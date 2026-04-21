"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useRef, useState } from "react";

// Media is value-sensitive in this project. Avoid creating test media here unless
// it is strictly necessary for verification, and always prefix disposable assets
// with `test__...` so they stay safely classifiable for later cleanup.
import { ConfirmActionForm } from "./ConfirmActionForm";
import {
  COLLECTION_FILTER_ALL,
  COLLECTION_FILTER_ORPHAN,
  matchesCollectionFilter
} from "../../lib/admin/media-gallery-filters";
import { appendAdminReturnTo } from "../../lib/admin/relation-navigation.js";
import {
  getRemovalMarkHref,
  getRemovalSweepHref,
  getRemovalUnmarkHref
} from "../../lib/admin/removal-quarantine.js";
import { MediaCollectionOverlay } from "./MediaCollectionOverlay";
import { MediaImageEditorPanel } from "./MediaImageEditorPanel";
import styles from "./admin-ui.module.css";

const FILTERS = [
  { key: "test-only", label: "Только тестовые" },
  { key: "all", label: "Все" },
  { key: "recent", label: "Недавние" },
  { key: "mine", label: "Мои" },
  { key: "missing-alt", label: "Нет альтернативного текста" },
  { key: "orphan", label: "Сироты" },
  { key: "used", label: "Используется" },
  { key: "unused", label: "Не используется" },
  { key: "draft", label: "Черновики" },
  { key: "review", label: "На проверке" },
  { key: "published", label: "Опубликовано" },
  { key: "archived", label: "В архиве" },
  { key: "broken", label: "Проблемные" }
];

const STATUS_SORT_ORDER = {
  review: 0,
  draft: 1,
  published: 2
};

function getTestGraphTeardownHref(entityType, entityId) {
  return `/admin/entities/${entityType}/${entityId}/test-graph-teardown`;
}

function getDeletePreviewHref(entityType, entityId, returnTo = "") {
  return appendAdminReturnTo(`/admin/entities/${entityType}/${entityId}/delete`, returnTo);
}

function buildTitleFromFilename(filename) {
  const base = (filename || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return base || "Медиафайл";
}

function formatBytes(value) {
  const bytes = Number(value || 0);

  if (!bytes) {
    return "Размер не указан";
  }

  if (bytes < 1024) {
    return `${bytes} Б`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} КБ`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function formatDate(value) {
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

function matchesFilter(item, filterKey, currentUsername) {
  switch (filterKey) {
    case "test-only":
      return item.isTestData;
    case "recent":
      return item.recent;
    case "mine":
      return Boolean(item.uploadedBy) && item.uploadedBy === currentUsername;
    case "missing-alt":
      return item.missingAlt;
    case "orphan":
      return item.orphaned;
    case "used":
      return item.usageCount > 0;
    case "unused":
      return item.usageCount === 0;
    case "draft":
    case "review":
    case "published":
      return item.statusKey === filterKey;
    case "archived":
      return item.archived;
    case "broken":
      return item.brokenBinary;
    default:
      return true;
  }
}

function matchesQuery(item, normalizedQuery) {
  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    item.title,
    item.alt,
    item.caption,
    item.originalFilename,
    item.sourceNote,
    item.ownershipNote,
    ...(item.collectionEntries ?? []).map((entry) => entry.title)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function getActiveCollectionFilterLabel(collectionFilterId, collections) {
  if (!collectionFilterId) {
    return "Все коллекции";
  }

  if (collectionFilterId === COLLECTION_FILTER_ORPHAN) {
    return "Без коллекции";
  }

  return collections.find((item) => item.id === collectionFilterId)?.title || "Выбранная коллекция";
}

function summarizeOverlayCollections(collectionIds, collections) {
  const selected = collections.filter((item) => collectionIds.includes(item.id));

  if (selected.length === 0) {
    return "Не состоит в коллекциях";
  }

  if (selected.length === 1) {
    return selected[0].title;
  }

  return `${selected[0].title} +${selected.length - 1}`;
}

function compareItems(left, right, sortMode) {
  switch (sortMode) {
    case "oldest":
      return left.updatedAtTs - right.updatedAtTs;
    case "title":
      return left.title.localeCompare(right.title, "ru");
    case "status": {
      const leftRank = STATUS_SORT_ORDER[left.statusKey] ?? 99;
      const rightRank = STATUS_SORT_ORDER[right.statusKey] ?? 99;

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return right.updatedAtTs - left.updatedAtTs;
    }
    default:
      return right.updatedAtTs - left.updatedAtTs;
  }
}

function getToneForItem(item) {
  if (item.brokenBinary) {
    return "danger";
  }

  if (item.archived) {
    return "muted";
  }

  if (item.statusKey === "review") {
    return "warning";
  }

  if (item.statusKey === "published") {
    return "success";
  }

  return "muted";
}

function getWarningNote(item) {
  if (item.brokenBinary) {
    return "Бинарник не читается через предпросмотр администратора.";
  }

  if (item.archived) {
    return "Карточка уже в архиве и не должна участвовать в новых привязках, пока вы не вернёте её в активный список.";
  }

  if (item.publishedRevisionNumber) {
    return `У карточки есть действующая опубликованная версия (ревизия #${item.publishedRevisionNumber}). Удаление и прямые правки теперь идут через отдельную проверку перед действием.`;
  }

  if (item.missingAlt) {
    return "Нужно добавить alt, чтобы не оставлять ассет сырым.";
  }

  if (item.orphaned) {
    return "Карточка пока сирота: её можно оставить отдельным ассетом или быстро включить в одну из коллекций.";
  }

  if (!item.ownershipNote) {
    return "Стоит добавить заметку о правах, чтобы не потерять происхождение файла.";
  }

  return "Карточка выглядит рабочей. При необходимости откройте расширенное редактирование или коллекции.";
}

function getGridColumns(nodes) {
  const first = nodes.find(Boolean);

  if (!first) {
    return 1;
  }

  const firstTop = first.offsetTop;
  let count = 0;

  for (const node of nodes) {
    if (!node) {
      continue;
    }

    if (node.offsetTop !== firstTop) {
      break;
    }

    count += 1;
  }

  return Math.max(1, count);
}

function updateWorkspaceUrl({ assetId, compose, collectionId }) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);

  if (assetId) {
    url.searchParams.set("asset", assetId);
  } else {
    url.searchParams.delete("asset");
  }

  if (compose) {
    url.searchParams.set("compose", compose);
  } else {
    url.searchParams.delete("compose");
  }

  if (collectionId) {
    url.searchParams.set("collection", collectionId);
  } else {
    url.searchParams.delete("collection");
  }

  window.history.replaceState({}, "", url);
}

function getImageEditAvailability({ mode, item, file }) {
  if (mode === "create") {
    return {
      canEdit: Boolean(file),
      reason: file ? "" : "Сначала выберите изображение для загрузки."
    };
  }

  if (!item) {
    return {
      canEdit: false,
      reason: "Сначала выберите карточку для редактирования."
    };
  }

  if (item.archived) {
    return {
      canEdit: false,
      reason: "Архивные ассеты сначала нужно вернуть в активный список."
    };
  }

  if (item.publishedRevisionNumber) {
    return {
      canEdit: false,
      reason: "Для опубликованных медиа прямое перезаписывание запрещено. Для них нужен отдельный сценарий правок."
    };
  }

  if (item.statusKey !== "draft") {
    return {
      canEdit: false,
      reason: "Изображение можно править только в черновике."
    };
  }

  if (!item.hasPreview && mode === "edit") {
    return {
      canEdit: false,
      reason: "Нет доступного предпросмотра, поэтому редактирование изображения сейчас недоступно."
    };
  }

  return {
    canEdit: true,
    reason: ""
  };
}

function mergeById(currentItems, nextItems) {
  const map = new Map(currentItems.map((item) => [item.id, item]));

  for (const item of nextItems) {
    map.set(item.id, item);
  }

  return Array.from(map.values());
}

function isEditorRole(role) {
  return role === "superadmin" || role === "seo_manager";
}

function canSubmitMediaForReview(item, currentUserRole) {
  return Boolean(item?.currentRevisionId) && item?.statusKey === "draft" && isEditorRole(currentUserRole);
}

function isWaitingForOwnerApproval(item) {
  return Boolean(
    item?.currentRevisionId
    && item?.statusKey === "review"
    && item?.ownerReviewRequired
    && item?.ownerApprovalStatus !== "approved"
  );
}

function canOpenMediaPublishReadiness(item, currentUserRole) {
  return Boolean(
    item?.currentRevisionId
    && item?.statusKey === "review"
    && currentUserRole === "superadmin"
    && (!item?.ownerReviewRequired || item?.ownerApprovalStatus === "approved")
  );
}

function getPublicationNote(item, currentUserRole) {
  if (item?.statusKey === "published") {
    return "У файла уже есть опубликованная версия. Его можно использовать как основное медиа в технике, услуге, кейсе или странице.";
  }

  if (canOpenMediaPublishReadiness(item, currentUserRole)) {
    return "Версия уже на проверке. Откройте задачу на экране проверки и завершите публикацию оттуда.";
  }

  if (isWaitingForOwnerApproval(item)) {
    return "Версия на проверке, но публикация откроется только после согласования владельца.";
  }

  if (item?.statusKey === "review") {
    return "Версия уже на проверке. Опубликовать медиафайл может только superadmin.";
  }

  return "Связанные техника, услуги, кейсы и страницы могут ссылаться только на опубликованное медиа. Сначала отправьте текущую версию на проверку.";
}

function MediaInspector({
  item,
  currentUserRole = "",
  onEdit,
  onOpenCollectionManager,
  onCreateCollection,
  onLifecycleAction,
  lifecycleBusy,
  deleteHref = "",
  returnTo = ""
}) {
  if (!item) {
    return (
      <aside className={`${styles.panel} ${styles.mediaInspector}`} aria-live="polite">
        <h3 className={styles.mediaInspectorTitle}>Карточка не выбрана</h3>
        <p className={styles.helpText}>
          Выберите карточку в медиатеке, чтобы увидеть крупное изображение, сигналы, использование и состояние коллекций.
        </p>
      </aside>
    );
  }

  const canSubmitForReview = canSubmitMediaForReview(item, currentUserRole);
  const waitingForOwnerApproval = isWaitingForOwnerApproval(item);
  const canOpenPublishReadiness = canOpenMediaPublishReadiness(item, currentUserRole);
  const reviewHref = item.currentRevisionId ? `/admin/review/${item.currentRevisionId}` : "";
  const publicationNote = getPublicationNote(item, currentUserRole);
  const reviewButtonLabel = canOpenPublishReadiness ? "Продолжить проверку" : "Открыть проверку";
  const reviewButtonClassName = canOpenPublishReadiness ? styles.primaryButton : styles.secondaryButton;

  return (
    <aside className={`${styles.panel} ${styles.mediaInspector}`} aria-live="polite">
      <div className={styles.mediaInspectorHeader}>
        <div className={styles.stack}>
          <p className={styles.eyebrow}>Инспектор</p>
          <h3 className={styles.mediaInspectorTitle}>{item.title}</h3>
          <p className={styles.helpText}>{item.originalFilename || "Имя файла пока не задано"}</p>
        </div>
        <button type="button" className={styles.primaryButton} onClick={onEdit}>
          Редактировать
        </button>
      </div>

      <div className={styles.mediaInspectorPreview}>
        {item.hasPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.previewUrl} alt={item.alt || item.title || item.originalFilename || "Предпросмотр"} />
        ) : (
          <div className={styles.mediaInspectorPlaceholder}>Нет предпросмотра</div>
        )}
      </div>

      <div className={styles.badgeRow}>
        {item.publishedRevisionNumber ? <span className={`${styles.badge} ${styles.mediaBadgesuccess}`}>Есть опубликованная версия</span> : null}
        <span className={`${styles.badge} ${styles[`mediaBadge${getToneForItem(item)}`]}`}>{item.statusLabel}</span>
        {item.isTestData ? <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Тестовые</span> : null}
        {item.markedForRemovalAt ? <span className={`${styles.badge} ${styles.mediaBadgedanger}`}>Помечено на удаление</span> : null}
        {item.archived ? <span className={`${styles.badge} ${styles.mediaBadgemuted}`}>{item.lifecycleLabel}</span> : null}
        <span className={`${styles.badge} ${item.missingAlt ? styles.mediaBadgewarning : styles.mediaBadgesuccess}`}>
          {item.missingAlt ? "Нет альтернативного текста" : "Альтернативный текст есть"}
        </span>
        <span className={`${styles.badge} ${item.orphaned ? styles.mediaBadgewarning : styles.mediaBadgesuccess}`}>
          {item.orphaned ? "Сирота" : item.collectionShortLabel}
        </span>
        <span className={`${styles.badge} ${item.usageCount ? styles.mediaBadgesuccess : styles.mediaBadgemuted}`}>
          {item.whereUsedLabel}
        </span>
        {item.brokenBinary ? <span className={`${styles.badge} ${styles.mediaBadgedanger}`}>Сломан</span> : null}
      </div>

      <dl className={styles.mediaMetaList}>
        <div>
          <dt>Формат</dt>
          <dd>{item.mimeType || "Не указан"}</dd>
        </div>
        <div>
          <dt>Размер</dt>
          <dd>{formatBytes(item.sizeBytes)}</dd>
        </div>
        <div>
          <dt>Обновлено</dt>
          <dd>{formatDate(item.updatedAt)}</dd>
        </div>
        <div>
          <dt>Загрузил</dt>
          <dd>{item.uploadedBy || "Не указано"}</dd>
        </div>
      </dl>

      <section className={styles.mediaInspectorSection}>
        <h4>Быстрые сигналы</h4>
        <p className={styles.helpText}>{getWarningNote(item)}</p>
        {item.caption ? <p className={styles.mediaSnippet}>{item.caption}</p> : null}
      </section>

      <section className={styles.mediaInspectorSection}>
        <h4>Использование</h4>
        <dl className={styles.mediaMetaList}>
          {item.usageSummaryItems.map((summaryItem) => (
            <div key={summaryItem.key}>
              <dt>{summaryItem.label}</dt>
              <dd>{summaryItem.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.mediaInspectorSection}>
        <h4>Коллекции</h4>
        {item.collectionEntries.length === 0 ? (
          <p className={styles.helpText}>
            Карточка пока никуда не входит. Это честный статус сироты: ассет живёт отдельно, пока вы не привяжете его к подборке.
          </p>
        ) : (
          <div className={styles.mediaUsageList}>
            {item.collectionEntries.map((entry) => (
              <button
                key={entry.key}
                type="button"
                className={styles.mediaUsageButton}
                onClick={() => onOpenCollectionManager({ collectionId: entry.id, seedAssetId: item.id })}
              >
                <strong>{entry.title}</strong>
                <span>{entry.memberCount} файлов</span>
                <span className={styles.mutedText}>{entry.statusLabel}</span>
              </button>
            ))}
          </div>
        )}
        <div className={styles.inlineActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => onOpenCollectionManager({ seedAssetId: item.id })}
          >
            В коллекцию
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => onCreateCollection(item.id)}
          >
            Новая коллекция
          </button>
        </div>
      </section>

      <section className={styles.mediaInspectorSection}>
        <h4>Публикация</h4>
        <p className={styles.helpText}>{publicationNote}</p>
        <div className={styles.inlineActions}>
          {canSubmitForReview ? (
            <form action={`/api/admin/revisions/${item.currentRevisionId}/submit`} method="post">
              <button type="submit" className={styles.primaryButton}>Отправить на проверку</button>
            </form>
          ) : null}
          {item.statusKey === "review" && reviewHref ? (
            <Link href={reviewHref} className={reviewButtonClassName}>{reviewButtonLabel}</Link>
          ) : null}
          {waitingForOwnerApproval ? (
            <button type="button" className={styles.secondaryButton} disabled>Ждёт согласования</button>
          ) : null}
        </div>
      </section>

      <section className={styles.mediaInspectorSection}>
        <h4>Где используется</h4>
        {item.usageEntries.length === 0 ? (
          <p className={styles.helpText}>
            Пока нет ссылок на этот ассет. Это хороший момент для спокойной доводки метаданных и коллекций.
          </p>
        ) : (
          <div className={styles.mediaUsageList}>
            {item.usageEntries.map((entry) => (
              <Link key={entry.key} href={appendAdminReturnTo(entry.href, returnTo)} className={styles.mediaUsageItem}>
                <strong>{entry.entityLabel}</strong>
                <span>{entry.title}</span>
                <span className={styles.mutedText}>{entry.relationLabel} вЂў {entry.statusLabel}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className={styles.mediaInspectorSection}>
        <h4>Безопасность</h4>
        <p className={styles.helpText}>{item.archiveReason}</p>
        {item.markedForRemovalAt ? (
          <p className={styles.helpText}>
            Этот медиафайл уже помечен на удаление. Новые ссылки на него блокируются, а финальная очистка запускается из центра очистки.
          </p>
        ) : null}
        <div className={styles.inlineActions}>
          {!item.markedForRemovalAt ? (
            <ConfirmActionForm
              action={getRemovalMarkHref("media_asset", item.id)}
              confirmMessage="Пометить медиафайл на удаление? Новые ссылки на него будут заблокированы."
            >
              <input type="hidden" name="redirectTo" value={returnTo} />
              <input type="hidden" name="failureRedirectTo" value={returnTo} />
              <button type="submit" className={styles.secondaryButton}>Пометить на удаление</button>
            </ConfirmActionForm>
          ) : null}
          {item.markedForRemovalAt ? (
            <ConfirmActionForm
              action={getRemovalUnmarkHref("media_asset", item.id)}
              confirmMessage="Снять пометку удаления?"
            >
              <input type="hidden" name="redirectTo" value={returnTo} />
              <input type="hidden" name="failureRedirectTo" value={returnTo} />
              <button type="submit" className={styles.secondaryButton}>Снять пометку удаления</button>
            </ConfirmActionForm>
          ) : null}
          <Link href={getRemovalSweepHref()} className={item.markedForRemovalAt ? styles.primaryButton : styles.secondaryButton}>
            Центр очистки
          </Link>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => onLifecycleAction(item.archived ? "restore" : "archive")}
            disabled={lifecycleBusy || (!item.canArchive && !item.canRestore)}
          >
            {lifecycleBusy ? "Сохраняем..." : item.archived ? "Вернуть из архива" : "В архив"}
          </button>
          <Link href={deleteHref} className={styles.secondaryButton}>Проверить удаление (legacy)</Link>
          {item.isTestData ? (
            <Link href={appendAdminReturnTo(getTestGraphTeardownHref("media_asset", item.id), returnTo)} className={styles.secondaryButton}>
              Удалить тестовый граф
            </Link>
          ) : null}
          <Link href={appendAdminReturnTo(`/admin/entities/media_asset/${item.id}/history`, returnTo)} className={styles.secondaryButton}>
            История
          </Link>
        </div>
      </section>
    </aside>
  );
}

function MediaOverlay({
  mode,
  item,
  fields,
  collections,
  file,
  editedBinary,
  previewUrl,
  busy,
  error,
  dragActive,
  onClose,
  onFieldChange,
  onToggleCollection,
  onFileSelect,
  onImageCommit,
  onImageReset,
  onSubmit,
  onDragEnter,
  onDragLeave,
  onDrop
}) {
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const [activeTab, setActiveTab] = useState("metadata");
  const imageEdit = getImageEditAvailability({ mode, item, file });
  const selectedCollectionsLabel = summarizeOverlayCollections(fields.collectionIds ?? [], collections ?? []);

  useEffect(() => {
    if (!mode) {
      return;
    }

    const focusTarget = mode === "create" && !file ? dialogRef.current : titleRef.current;
    focusTarget?.focus();
  }, [mode, file]);

  useEffect(() => {
    setActiveTab("metadata");
  }, [mode, item?.id]);

  if (!mode) {
    return null;
  }

  return (
    <div className={styles.mediaOverlayBackdrop}>
      <div
        ref={dialogRef}
        className={styles.mediaOverlayDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-overlay-title"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (!busy && event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
        }}
      >
        <div className={styles.mediaOverlayHeader}>
          <div>
            <p className={styles.eyebrow}>{mode === "create" ? "Новый ассет" : "Редактор ассета"}</p>
            <h3 id="media-overlay-title" className={styles.mediaOverlayTitle}>
              {mode === "create" ? "Загрузка и метаданные" : "Метаданные текущего ассета"}
            </h3>
          </div>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={busy}>
            Закрыть
          </button>
        </div>

        {error ? <div className={styles.statusPanelBlocking}>{error}</div> : null}

        <div className={styles.mediaOverlayTabs} role="tablist" aria-label="Режимы редактора медиа">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "metadata"}
            className={`${styles.filterPill} ${activeTab === "metadata" ? styles.filterPillActive : ""}`}
            onClick={() => setActiveTab("metadata")}
          >
            Метаданные
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "image"}
            className={`${styles.filterPill} ${activeTab === "image" ? styles.filterPillActive : ""}`}
            onClick={() => setActiveTab("image")}
          >
            Изображение
          </button>
        </div>

        <div className={styles.mediaOverlayBody}>
          <section className={styles.mediaOverlayPreview}>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={fields.alt || fields.title || fields.originalFilename || "Предпросмотр"} />
            ) : (
              <div
                className={`${styles.mediaOverlayDropzone} ${dragActive ? styles.mediaOverlayDropzoneActive : ""}`}
                onDragEnter={onDragEnter}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <p>Выберите изображение или перетащите его сюда</p>
                <label className={styles.secondaryButton}>
                  <span>Выбрать файл</span>
                  <input
                    type="file"
                    accept="image/*"
                    className={styles.visuallyHidden}
                    onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
                  />
                </label>
                <p className={styles.helpText}>V1 остаётся только для изображений. Видео и документы сюда не добавляем.</p>
              </div>
            )}
          </section>

          {activeTab === "metadata" ? (
            <form className={styles.mediaOverlayForm} onSubmit={onSubmit}>
              <div className={styles.gridTwo}>
                <label className={styles.label}>
                  <span>Название</span>
                  <input
                    ref={titleRef}
                    name="title"
                    value={fields.title}
                    onChange={(event) => onFieldChange("title", event.target.value)}
                  />
                </label>
                <label className={styles.label}>
                  <span>Альтернативный текст</span>
                  <input
                    name="alt"
                    value={fields.alt}
                    onChange={(event) => onFieldChange("alt", event.target.value)}
                  />
                </label>
                <label className={`${styles.label} ${styles.gridWide}`}>
                  <span>Подпись</span>
                  <textarea
                    name="caption"
                    value={fields.caption}
                    onChange={(event) => onFieldChange("caption", event.target.value)}
                  />
                </label>
                <label className={styles.label}>
                  <span>Источник</span>
                  <input
                    name="sourceNote"
                    value={fields.sourceNote}
                    onChange={(event) => onFieldChange("sourceNote", event.target.value)}
                  />
                </label>
                <label className={styles.label}>
                  <span>Права</span>
                  <input
                    name="ownershipNote"
                    value={fields.ownershipNote}
                    onChange={(event) => onFieldChange("ownershipNote", event.target.value)}
                  />
                </label>
                <label className={`${styles.label} ${styles.gridWide}`}>
                  <span>Комментарий к изменению</span>
                  <input
                    name="changeIntent"
                    value={fields.changeIntent}
                    onChange={(event) => onFieldChange("changeIntent", event.target.value)}
                  />
                  <p className={styles.helpText}>
                    Комментарий не обязателен, но он потом помогает быстрее понять смысл версии в истории и проверке.
                  </p>
                </label>
                {mode === "edit" ? (
                  <details className={`${styles.collectionField} ${styles.gridWide}`}>
                    <summary className={styles.collectionFieldSummary}>
                      <span className={styles.collectionFieldLabel}>В коллекциях</span>
                      <span className={styles.collectionFieldValue}>{selectedCollectionsLabel}</span>
                    </summary>
                    <div className={styles.collectionFieldPanel}>
                      {collections.length === 0 ? (
                      <p className={styles.helpText}>
                          Коллекций пока нет. Сначала создайте подборку в основной медиатеке, а потом вернитесь к карточке.
                        </p>
                      ) : (
                        <div className={styles.collectionFieldList} role="list">
                          {collections.map((collection) => {
                            const checked = (fields.collectionIds ?? []).includes(collection.id);

                            return (
                              <label key={collection.id} className={styles.collectionFieldOption}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => onToggleCollection(collection.id)}
                                />
                                <span className={styles.collectionFieldOptionBody}>
                                  <strong>{collection.title}</strong>
                                  <span className={styles.mutedText}>{collection.memberCount} файлов</span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                      <p className={styles.helpText}>
                        Здесь меняется только membership текущего ассета. Состав коллекции и главный кадр по-прежнему живут в редакторе коллекций.
                      </p>
                    </div>
                  </details>
                ) : null}
              </div>

              <div className={styles.mediaOverlayMeta}>
                <span>{fields.originalFilename || "Файл пока не выбран"}</span>
                {fields.originalFilename ? <span>{formatBytes(fields.sizeBytes)}</span> : null}
                {editedBinary ? <span>Изображение изменено локально</span> : null}
              </div>

              <div className={styles.mediaOverlayActions}>
                <button type="submit" className={styles.primaryButton} disabled={busy || (mode === "create" && !file)}>
                  {busy ? "Сохраняем..." : mode === "create" ? "Сохранить ассет" : "Сохранить изменения"}
                </button>
                <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={busy}>
                  Отмена
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.mediaOverlayForm}>
              <MediaImageEditorPanel
                sourceUrl={previewUrl}
                filename={fields.originalFilename}
                mimeType={item?.mimeType || file?.type || "image/png"}
                disabledReason={imageEdit.reason}
                busy={busy}
                hasEdits={Boolean(editedBinary)}
                onCommit={onImageCommit}
                onReset={onImageReset}
              />
              <div className={styles.mediaOverlayActions}>
                <button type="button" className={styles.primaryButton} onClick={() => setActiveTab("metadata")}>
                  Вернуться к метаданным
                </button>
                <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={busy}>
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MediaGalleryWorkspace({
  initialItems,
  initialCollections,
  initialSelectedId,
  initialCollectionId = "",
  initialCompose = "",
  initialFilterKey = "all",
  currentUsername,
  currentUserRole = "",
  initialMessage = "",
  initialError = "",
  workspaceContextHref = ""
}) {
  const [items, setItems] = useState(initialItems);
  const [collections, setCollections] = useState(initialCollections);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [filterKey, setFilterKey] = useState(initialFilterKey || "all");
  const [collectionFilterId, setCollectionFilterId] = useState(initialCollectionId || COLLECTION_FILTER_ALL);
  const [sortMode, setSortMode] = useState("newest");
  const [selectedId, setSelectedId] = useState(initialSelectedId || initialItems[0]?.id || "");
  const [selectedDeleteIds, setSelectedDeleteIds] = useState([]);
  const [message, setMessage] = useState(initialMessage);
  const [error, setError] = useState(initialError);
  const [recentlySavedId, setRecentlySavedId] = useState("");
  const [overlayMode, setOverlayMode] = useState(
    initialCompose === "upload"
      ? "asset-create"
      : initialCompose === "collections" || initialCompose === "collection-new"
        ? "collections"
        : null
  );
  const [overlayBusy, setOverlayBusy] = useState(false);
  const [overlayError, setOverlayError] = useState("");
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [draftFile, setDraftFile] = useState(null);
  const [editedBinaryFile, setEditedBinaryFile] = useState(null);
  const [draftPreviewUrl, setDraftPreviewUrl] = useState("");
  const [createSourceFile, setCreateSourceFile] = useState(null);
  const [createSourcePreviewUrl, setCreateSourcePreviewUrl] = useState("");
  const [editSourcePreviewUrl, setEditSourcePreviewUrl] = useState("");
  const [assetFields, setAssetFields] = useState({
    title: "",
    alt: "",
    caption: "",
    sourceNote: "",
    ownershipNote: "",
    changeIntent: "",
    collectionIds: [],
    originalFilename: "",
    sizeBytes: 0
  });
  const [collectionContext, setCollectionContext] = useState({
    selectedCollectionId: initialCollectionId || "",
    seedAssetId: initialCompose === "collection-new" ? (initialSelectedId || initialItems[0]?.id || "") : "",
    createNew: initialCompose === "collection-new"
  });
  const cardRefs = useRef([]);

  useEffect(() => {
    if (!selectedId && items[0]?.id) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  useEffect(() => {
    if (selectedId && items.length > 0 && !items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  useEffect(() => {
    setSelectedDeleteIds((current) => current.filter((entityId) => items.some((item) => item.id === entityId && item.isTestData)));
  }, [items]);

  useEffect(() => {
    if (!draftPreviewUrl.startsWith("blob:")) {
      return undefined;
    }

    return () => {
      URL.revokeObjectURL(draftPreviewUrl);
    };
  }, [draftPreviewUrl]);

  useEffect(() => {
    if (!createSourcePreviewUrl.startsWith("blob:")) {
      return undefined;
    }

    return () => {
      URL.revokeObjectURL(createSourcePreviewUrl);
    };
  }, [createSourcePreviewUrl]);

  useEffect(() => {
    setRecentlySavedId("");
  }, [query, filterKey, collectionFilterId, sortMode]);

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const collectionOptions = [...collections].sort((left, right) => left.title.localeCompare(right.title, "ru"));
  const filtered = [...items]
    .filter((item) => matchesQuery(item, normalizedQuery))
    .filter((item) => matchesFilter(item, filterKey, currentUsername))
    .filter((item) => matchesCollectionFilter(item, collectionFilterId))
    .sort((left, right) => compareItems(left, right, sortMode));
  const summaryItems = [
    { label: "Тестовые", value: items.filter((item) => item.isTestData).length },
    { label: "Всего", value: items.length },
    { label: "Нет альтернативного текста", value: items.filter((item) => item.missingAlt).length },
    { label: "Сироты", value: items.filter((item) => item.orphaned).length },
    { label: "Используется", value: items.filter((item) => item.usageCount > 0).length },
    { label: "В архиве", value: items.filter((item) => item.archived).length },
    { label: "Сломанные", value: items.filter((item) => item.brokenBinary).length }
  ];
  const selectedItem = items.find((item) => item.id === selectedId) ?? null;
  const selectedTestDeleteCount = selectedDeleteIds.length;
  const currentWorkspaceHref = typeof window === "undefined"
    ? workspaceContextHref
    : `${window.location.pathname}${window.location.search}`;
  const selectedDeleteHref = selectedItem
    ? getDeletePreviewHref("media_asset", selectedItem.id, currentWorkspaceHref)
    : "";
  const selectedHiddenByFilter = Boolean(selectedItem && !filtered.some((item) => item.id === selectedItem.id));

  const displayedItems = (() => {
    if (!recentlySavedId) {
      return filtered;
    }

    const savedItem = items.find((item) => item.id === recentlySavedId);

    if (!savedItem || filtered.some((item) => item.id === recentlySavedId)) {
      return filtered;
    }

    return [{ ...savedItem, forcedVisible: true }, ...filtered];
  })();

  function resetAssetOverlayState() {
    setOverlayBusy(false);
    setOverlayError("");
    setDraftFile(null);
    setEditedBinaryFile(null);
    setDraftPreviewUrl("");
    setCreateSourceFile(null);
    setCreateSourcePreviewUrl("");
    setEditSourcePreviewUrl("");
    setAssetFields({
      title: "",
      alt: "",
      caption: "",
      sourceNote: "",
      ownershipNote: "",
      changeIntent: "",
      collectionIds: [],
      originalFilename: "",
      sizeBytes: 0
    });
  }

  function openCreateOverlay() {
    resetAssetOverlayState();
    setOverlayMode("asset-create");
    updateWorkspaceUrl({ assetId: selectedId, compose: "upload", collectionId: "" });
  }

  function openEditOverlay(item) {
    setOverlayBusy(false);
    setOverlayError("");
    setDraftFile(null);
    setEditedBinaryFile(null);
    setDraftPreviewUrl(item?.previewUrl || "");
    setEditSourcePreviewUrl(item?.previewUrl || "");
    setAssetFields({
      title: item?.title || "",
      alt: item?.alt || "",
      caption: item?.caption || "",
      sourceNote: item?.sourceNote || "",
      ownershipNote: item?.ownershipNote || "",
      changeIntent: "",
      collectionIds: item?.collectionEntries?.map((entry) => entry.id) || [],
      originalFilename: item?.originalFilename || "",
      sizeBytes: item?.sizeBytes || 0
    });
    setOverlayMode("asset-edit");
    updateWorkspaceUrl({ assetId: item?.id || selectedId, compose: null, collectionId: "" });
  }

  function openCollectionManager({ collectionId = "", seedAssetId = "", createNew = false } = {}) {
    setOverlayBusy(false);
    setOverlayError("");
    setOverlayMode("collections");
    setCollectionContext({
      selectedCollectionId: collectionId,
      seedAssetId,
      createNew
    });
    updateWorkspaceUrl({
      assetId: seedAssetId || selectedId,
      compose: createNew ? "collection-new" : "collections",
      collectionId
    });
  }

  function closeOverlay() {
    if (overlayMode === "asset-create" || overlayMode === "asset-edit") {
      resetAssetOverlayState();
    } else {
      setOverlayBusy(false);
      setOverlayError("");
    }

    setOverlayMode(null);
    updateWorkspaceUrl({ assetId: selectedId, compose: null, collectionId: "" });
  }

  function selectCard(itemId) {
    setSelectedId(itemId);
    setMessage("");
    setError("");
    updateWorkspaceUrl({
      assetId: itemId,
      compose: overlayMode === "asset-create"
        ? "upload"
        : overlayMode === "collections"
          ? (collectionContext.createNew ? "collection-new" : "collections")
          : null,
      collectionId: overlayMode === "collections" ? collectionContext.selectedCollectionId : ""
    });
  }

  function toggleDeleteSelection(entityId) {
    setSelectedDeleteIds((current) => (
      current.includes(entityId)
        ? current.filter((value) => value !== entityId)
        : [...current, entityId]
    ));
  }

  async function performDeleteRequest(entityIds, { testOnly = false } = {}) {
    const formData = new FormData();

    for (const entityId of entityIds) {
      formData.append("entityId", entityId);
    }

    if (testOnly) {
      formData.set("testOnly", "true");
    }

    formData.set("responseMode", "json");
    const response = await fetch("/api/admin/entities/media_asset/delete", {
      method: "POST",
      body: formData
    });
    const payload = await response.json();

    if ((payload.deletedIds ?? []).length > 0) {
      setItems((current) => current.filter((item) => !(payload.deletedIds ?? []).includes(item.id)));
      setSelectedDeleteIds((current) => current.filter((entityId) => !(payload.deletedIds ?? []).includes(entityId)));
    }

    if (payload.message) {
      setMessage(payload.message);
    }

    if (payload.error) {
      setError(payload.error);
    } else {
      setError("");
    }

    if (!response.ok && (payload.deletedCount ?? 0) === 0) {
      throw new Error(payload.error || "Не удалось удалить выбранные объекты.");
    }

    return payload;
  }

  async function handleBulkDeleteTestData() {
    if (selectedDeleteIds.length === 0) {
      setError("Сначала выберите тестовые объекты для удаления.");
      return;
    }

    if (!window.confirm("Удалить выбранные тестовые объекты? Действие необратимо.")) {
      return;
    }

    setDeleteBusy(true);
    setMessage("");
    setError("");

    try {
      await performDeleteRequest(selectedDeleteIds, { testOnly: true });
    } catch (deleteError) {
      setError(deleteError.message || "Не удалось удалить тестовые объекты.");
    } finally {
      setDeleteBusy(false);
    }
  }

  function handleAssetFieldChange(field, value) {
    setAssetFields((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleCollectionToggle(collectionId) {
    setAssetFields((current) => {
      const currentIds = current.collectionIds ?? [];
      const nextIds = currentIds.includes(collectionId)
        ? currentIds.filter((value) => value !== collectionId)
        : [...currentIds, collectionId];

      return {
        ...current,
        collectionIds: nextIds
      };
    });
  }

  function handleFileSelect(file) {
    if (!file) {
      return;
    }

    const sourcePreviewUrl = URL.createObjectURL(file);
    const nextPreviewUrl = URL.createObjectURL(file);
    setCreateSourceFile(file);
    setCreateSourcePreviewUrl(sourcePreviewUrl);
    setDraftFile(file);
    setEditedBinaryFile(null);
    setDraftPreviewUrl(nextPreviewUrl);
    setAssetFields((current) => ({
      ...current,
      title: current.title || buildTitleFromFilename(file.name),
      originalFilename: file.name,
      sizeBytes: file.size
    }));
  }

  function handleImageCommit(nextFile, nextPreviewUrl) {
    if (overlayMode === "asset-create") {
      setDraftFile(nextFile);
      setDraftPreviewUrl(nextPreviewUrl);
    } else {
      setEditedBinaryFile(nextFile);
      setDraftPreviewUrl(nextPreviewUrl);
    }

    setAssetFields((current) => ({
      ...current,
      sizeBytes: nextFile.size,
      mimeType: nextFile.type || current.mimeType
    }));
  }

  function handleImageReset() {
    if (overlayMode === "asset-create") {
      if (!createSourceFile) {
        return;
      }

      setDraftFile(createSourceFile);
      setDraftPreviewUrl(URL.createObjectURL(createSourceFile));
      setAssetFields((current) => ({
        ...current,
        sizeBytes: createSourceFile.size
      }));
      return;
    }

    setEditedBinaryFile(null);
    setDraftPreviewUrl(editSourcePreviewUrl || selectedItem?.previewUrl || "");
    setAssetFields((current) => ({
      ...current,
      sizeBytes: selectedItem?.sizeBytes || current.sizeBytes
    }));
  }

  async function handleCreateSubmit(event) {
    event.preventDefault();

    if (!draftFile) {
      setOverlayError("Сначала выберите изображение.");
      return;
    }

    setOverlayBusy(true);
    setOverlayError("");

    const formData = new FormData();
    formData.set("file", draftFile);
    formData.set("title", assetFields.title);
    formData.set("alt", assetFields.alt);
    formData.set("caption", assetFields.caption);
    formData.set("sourceNote", assetFields.sourceNote);
    formData.set("ownershipNote", assetFields.ownershipNote);
    formData.set("changeIntent", assetFields.changeIntent);

    try {
      const response = await fetch("/api/admin/media/library/create", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Не удалось сохранить ассет.");
      }

      setItems((current) => [payload.item, ...current.filter((item) => item.id !== payload.item.id)]);
      setSelectedId(payload.item.id);
      setRecentlySavedId(payload.item.id);
      setMessage(payload.message || "Ассет сохранён.");
      setError("");
      closeOverlay();
      updateWorkspaceUrl({ assetId: payload.item.id, compose: null, collectionId: "" });
    } catch (submitError) {
      setOverlayError(submitError.message || "Не удалось сохранить ассет.");
    } finally {
      setOverlayBusy(false);
    }
  }

  async function handleEditSubmit(event) {
    event.preventDefault();

    if (!selectedItem) {
      setOverlayError("Сначала выберите карточку для редактирования.");
      return;
    }

    setOverlayBusy(true);
    setOverlayError("");

    const formData = new FormData();
    formData.set("title", assetFields.title);
    formData.set("alt", assetFields.alt);
    formData.set("caption", assetFields.caption);
    formData.set("sourceNote", assetFields.sourceNote);
    formData.set("ownershipNote", assetFields.ownershipNote);
    formData.set("changeIntent", assetFields.changeIntent);
    formData.set("collectionsTouched", "true");
    for (const collectionId of assetFields.collectionIds ?? []) {
      formData.append("collectionIds", collectionId);
    }
    if (editedBinaryFile) {
      formData.set("binary", editedBinaryFile);
    }

    try {
      const response = await fetch(`/api/admin/media/library/${selectedItem.id}`, {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Не удалось сохранить изменения.");
      }

      setItems((current) => current.map((item) => (item.id === payload.item.id ? payload.item : item)));
      if (payload.collections?.length) {
        setCollections((current) => {
          const updates = new Map(payload.collections.map((item) => [item.id, item]));
          const merged = current.map((item) => updates.get(item.id) ?? item);
          const knownIds = new Set(merged.map((item) => item.id));

          for (const item of payload.collections) {
            if (!knownIds.has(item.id)) {
              merged.unshift(item);
            }
          }

          return merged;
        });
      }
      setSelectedId(payload.item.id);
      setRecentlySavedId(payload.item.id);
      setMessage(payload.message || "Изменения сохранены.");
      setError(payload.warning || "");
      closeOverlay();
      updateWorkspaceUrl({ assetId: payload.item.id, compose: null, collectionId: "" });
    } catch (submitError) {
      setOverlayError(submitError.message || "Не удалось сохранить изменения.");
    } finally {
      setOverlayBusy(false);
    }
  }

  async function handleCollectionSubmit({ entityId, fields }) {
    setOverlayBusy(true);
    setOverlayError("");

    const formData = new FormData();
    formData.set("title", fields.title);
    formData.set("caption", fields.caption);
    formData.set("primaryAssetId", fields.primaryAssetId);
    formData.set("changeIntent", fields.changeIntent);
    formData.set("metaTitle", fields.metaTitle);
    formData.set("metaDescription", fields.metaDescription);
    formData.set("canonicalIntent", fields.canonicalIntent);
    formData.set("indexationFlag", fields.indexationFlag);
    formData.set("openGraphTitle", fields.openGraphTitle);
    formData.set("openGraphDescription", fields.openGraphDescription);
    formData.set("openGraphImageAssetId", fields.openGraphImageAssetId);

    for (const assetId of fields.assetIds) {
      formData.append("assetIds", assetId);
    }

    try {
      const response = await fetch(
        entityId ? `/api/admin/media/collections/${entityId}` : "/api/admin/media/collections/create",
        {
          method: "POST",
          body: formData
        }
      );
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Не удалось сохранить коллекцию.");
      }

      if (payload.collection) {
        setCollections((current) => {
          const withoutCurrent = current.filter((item) => item.id !== payload.collection.id);
          return [payload.collection, ...withoutCurrent];
        });
      }

      if (payload.affectedItems?.length) {
        setItems((current) => mergeById(current, payload.affectedItems));
        const focusItem = collectionContext.seedAssetId || payload.affectedItems[0]?.id || "";

        if (focusItem) {
          setSelectedId(focusItem);
          setRecentlySavedId(focusItem);
        }
      }

      setMessage(payload.message || "Коллекция сохранена.");
      setError("");
      closeOverlay();
    } catch (submitError) {
      setOverlayError(submitError.message || "Не удалось сохранить коллекцию.");
    } finally {
      setOverlayBusy(false);
    }
  }

  async function handleLifecycleAction(action) {
    if (!selectedItem) {
      return;
    }

    setLifecycleBusy(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.set("action", action);

      const response = await fetch(`/api/admin/media/library/${selectedItem.id}/lifecycle`, {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Не удалось обновить жизненный цикл ассета.");
      }

      setItems((current) => current.map((item) => (item.id === payload.item.id ? payload.item : item)));
      setSelectedId(payload.item.id);
      setRecentlySavedId(payload.item.id);
      setMessage(payload.message || "Жизненный цикл ассета обновлён.");
    } catch (actionError) {
      setError(actionError.message || "Не удалось обновить жизненный цикл ассета.");
    } finally {
      setLifecycleBusy(false);
    }
  }

  function handleCardKeyDown(event, index) {
    const navigableKeys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];

    if (!navigableKeys.includes(event.key)) {
      return;
    }

    event.preventDefault();
    const columns = getGridColumns(cardRefs.current);
    let nextIndex = index;

    if (event.key === "ArrowRight") {
      nextIndex = Math.min(displayedItems.length - 1, index + 1);
    }

    if (event.key === "ArrowLeft") {
      nextIndex = Math.max(0, index - 1);
    }

    if (event.key === "ArrowDown") {
      nextIndex = Math.min(displayedItems.length - 1, index + columns);
    }

    if (event.key === "ArrowUp") {
      nextIndex = Math.max(0, index - columns);
    }

    const nextNode = cardRefs.current[nextIndex];
    const nextItem = displayedItems[nextIndex];

    nextNode?.focus();

    if (nextItem) {
      selectCard(nextItem.id);
    }
  }

  const activeFilterLabel = FILTERS.find((filter) => filter.key === filterKey)?.label || "Все";
  const activeCollectionFilterLabel = getActiveCollectionFilterLabel(collectionFilterId, collectionOptions);

  return (
    <div className={styles.stack}>
      {message ? <div className={styles.statusPanelInfo}>{message}</div> : null}
      {error ? <div className={styles.statusPanelBlocking}>{error}</div> : null}

      <section className={styles.panel}>
        <div className={styles.mediaToolbar}>
          <div className={styles.mediaToolbarIntro}>
            <p className={styles.eyebrow}>Рабочее место</p>
            <h3 className={styles.mediaToolbarTitle}>Медиатека</h3>
            <p className={styles.helpText}>
              Здесь живёт библиотека медиа и встроенный слой коллекций: слева и в центре остаются карточки, справа быстрый инспектор, а большое редактирование открывается поверх того же экрана.
            </p>
            <div className={styles.mediaToolbarStats} aria-label="Сводка медиатеки">
              {summaryItems.map((item) => (
                <span key={item.label} className={styles.mediaToolbarStat}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          </div>
          <div className={styles.mediaToolbarControls}>
            <label className={styles.searchLabel}>
              <span>Поиск</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className={styles.searchInput}
                placeholder="Название, альтернативный текст, подпись, имя файла, коллекция"
              />
            </label>
            <label className={styles.label}>
              <span>Сортировка</span>
              <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
                <option value="newest">Сначала новые</option>
                <option value="oldest">Сначала старые</option>
                <option value="title">По названию</option>
                <option value="status">По статусу</option>
              </select>
            </label>
            <button type="button" className={styles.primaryButton} onClick={openCreateOverlay}>
              Загрузить
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => openCollectionManager()}>
              Коллекции
            </button>
            {selectedItem ? (
              <Link href={selectedDeleteHref} className={styles.secondaryButton}>Проверить удаление (legacy)</Link>
            ) : null}
            {selectedTestDeleteCount > 0 ? (
              <button type="button" className={styles.dangerButton} onClick={handleBulkDeleteTestData} disabled={deleteBusy}>
                {deleteBusy ? "Удаляем..." : `Удалить тестовые (${selectedTestDeleteCount})`}
              </button>
            ) : null}
          </div>
        </div>

        <div className={styles.mediaFilterRow} role="toolbar" aria-label="Быстрые фильтры медиатеки">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={`${styles.filterPill} ${filterKey === filter.key ? styles.filterPillActive : ""}`}
              onClick={() => setFilterKey(filter.key)}
            >
              {filter.label}
            </button>
          ))}
          <label className={`${styles.label} ${styles.mediaFilterSelect}`}>
            <span>Коллекция</span>
            <select value={collectionFilterId} onChange={(event) => setCollectionFilterId(event.target.value)}>
              <option value={COLLECTION_FILTER_ALL}>Все коллекции</option>
              <option value={COLLECTION_FILTER_ORPHAN}>Без коллекции</option>
              {collectionOptions.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.mediaWorkspace}>
          <section className={styles.mediaCanvas}>
            <div className={styles.mediaCanvasMeta}>
              <span>Фильтр: {activeFilterLabel}</span>
              <span>Коллекция: {activeCollectionFilterLabel}</span>
              <span>Показано: {displayedItems.length}</span>
              <span>Коллекций: {collections.length}</span>
            </div>

            {items.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Библиотека пока пустая.</p>
                <p className={styles.helpText}>
                  Начните с загрузки первого изображения, и оно сразу появится в медиатеке как рабочая карточка.
                </p>
                <div className={styles.inlineActions}>
                  <button type="button" className={styles.primaryButton} onClick={openCreateOverlay}>
                    Загрузить первое изображение
                  </button>
                </div>
              </div>
            ) : displayedItems.length === 0 ? (
              <div className={styles.emptyState}>
                <p>По текущему фильтру ничего не найдено.</p>
                <p className={styles.helpText}>
                  Сбросьте поиск или переключите быстрый фильтр, чтобы снова увидеть карточки.
                </p>
                <div className={styles.inlineActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => {
                      setQuery("");
                      setFilterKey("all");
                      setCollectionFilterId(COLLECTION_FILTER_ALL);
                    }}
                  >
                    Сбросить фильтры
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.mediaGalleryGrid}>
                {displayedItems.map((item, index) => {
                  const selected = item.id === selectedId;

                  return (
                    <button
                      key={item.id}
                      ref={(node) => {
                        cardRefs.current[index] = node;
                      }}
                      type="button"
                      className={`${styles.mediaLibraryCardButton} ${selected ? styles.mediaLibraryCardButtonActive : ""} ${item.forcedVisible ? styles.mediaLibraryCardPinned : ""}`}
                      onClick={() => selectCard(item.id)}
                      onKeyDown={(event) => handleCardKeyDown(event, index)}
                      aria-pressed={selected}
                    >
                      <span className={styles.mediaLibraryThumb}>
                        {item.isTestData ? (
                          <label
                            className={styles.mediaDeleteMarker}
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={selectedDeleteIds.includes(item.id)}
                              onChange={() => toggleDeleteSelection(item.id)}
                            />
                          </label>
                        ) : null}
                        {item.hasPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.previewUrl} alt={item.alt || item.title || item.originalFilename || "Предпросмотр"} />
                        ) : (
                          <span className={styles.mediaPlaceholder}>Нет предпросмотра</span>
                        )}
                      </span>
                      <span className={styles.mediaLibraryBody}>
                        <strong>{item.title}</strong>
                        <span className={styles.mutedText}>{item.originalFilename || "Имя файла не задано"}</span>
                        <span className={styles.mutedText}>Коллекции: {item.collectionLabel}</span>
                        <span className={styles.mediaBadgeCluster}>
                          <span className={`${styles.badge} ${styles[`mediaBadge${getToneForItem(item)}`]}`}>{item.statusLabel}</span>
                          {item.publishedRevisionNumber ? <span className={`${styles.badge} ${styles.mediaBadgesuccess}`}>Опубликовано</span> : null}
                          {item.isTestData ? <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Тест</span> : null}
                          {item.markedForRemovalAt ? <span className={`${styles.badge} ${styles.mediaBadgedanger}`}>Удаление</span> : null}
                          {item.archived ? <span className={`${styles.badge} ${styles.mediaBadgemuted}`}>Архив</span> : null}
                          <span className={`${styles.badge} ${item.missingAlt ? styles.mediaBadgewarning : styles.mediaBadgesuccess}`}>
                          {item.missingAlt ? "Нет альтернативного текста" : "Альтернативный текст"}
                          </span>
                          <span className={`${styles.badge} ${item.usageCount ? styles.mediaBadgesuccess : styles.mediaBadgemuted}`}>
                            {item.usageCount ? `Связи ${item.usageCount}` : "Не используется"}
                          </span>
                          {item.brokenBinary ? <span className={`${styles.badge} ${styles.mediaBadgedanger}`}>Сломан</span> : null}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedHiddenByFilter ? (
              <div className={styles.statusPanelWarning}>
                Выбранная карточка сейчас скрыта фильтром, но инспектор сохранён, чтобы вы не потеряли контекст.
              </div>
            ) : null}
          </section>

          <MediaInspector
            item={selectedItem}
            currentUserRole={currentUserRole}
            onEdit={() => openEditOverlay(selectedItem)}
            onOpenCollectionManager={openCollectionManager}
            onCreateCollection={(assetId) => openCollectionManager({ seedAssetId: assetId, createNew: true })}
            onLifecycleAction={handleLifecycleAction}
            lifecycleBusy={lifecycleBusy}
            deleteHref={selectedDeleteHref}
            returnTo={currentWorkspaceHref}
          />
        </div>
      </section>

      <MediaOverlay
        mode={overlayMode === "asset-create" ? "create" : overlayMode === "asset-edit" ? "edit" : null}
        item={selectedItem}
        fields={assetFields}
        collections={collectionOptions}
        file={draftFile}
        editedBinary={editedBinaryFile}
        previewUrl={draftPreviewUrl}
        busy={overlayBusy}
        error={overlayError}
        dragActive={dragActive}
        onClose={closeOverlay}
        onFieldChange={handleAssetFieldChange}
        onToggleCollection={handleCollectionToggle}
        onFileSelect={handleFileSelect}
        onImageCommit={handleImageCommit}
        onImageReset={handleImageReset}
        onSubmit={overlayMode === "asset-create" ? handleCreateSubmit : handleEditSubmit}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          handleFileSelect(event.dataTransfer.files?.[0] ?? null);
        }}
      />

      <MediaCollectionOverlay
        open={overlayMode === "collections"}
        busy={overlayBusy}
        error={overlayError}
        collections={collections}
        mediaItems={items}
        initialCollectionId={collectionContext.selectedCollectionId}
        seedAssetId={collectionContext.seedAssetId}
        createNew={collectionContext.createNew}
        returnTo={currentWorkspaceHref}
        onClose={closeOverlay}
        onSave={handleCollectionSubmit}
      />
    </div>
  );
}
