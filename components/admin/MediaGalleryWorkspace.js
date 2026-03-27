"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useRef, useState } from "react";

import styles from "./admin-ui.module.css";

const FILTERS = [
  { key: "all", label: "Все" },
  { key: "recent", label: "Недавние" },
  { key: "mine", label: "Мои" },
  { key: "missing-alt", label: "Без alt" },
  { key: "used", label: "Используется" },
  { key: "unused", label: "Не используется" },
  { key: "draft", label: "Черновики" },
  { key: "review", label: "На проверке" },
  { key: "published", label: "Опубликовано" },
  { key: "broken", label: "Проблемные" }
];

const STATUS_SORT_ORDER = {
  review: 0,
  draft: 1,
  published: 2
};

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
    case "recent":
      return item.recent;
    case "mine":
      return Boolean(item.uploadedBy) && item.uploadedBy === currentUsername;
    case "missing-alt":
      return item.missingAlt;
    case "used":
      return item.usageCount > 0;
    case "unused":
      return item.usageCount === 0;
    case "draft":
    case "review":
    case "published":
      return item.statusKey === filterKey;
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
    item.ownershipNote
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
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
    return "Бинарник не читается через admin preview.";
  }

  if (item.missingAlt) {
    return "Нужно добавить alt, чтобы не оставлять ассет сырым.";
  }

  if (!item.ownershipNote) {
    return "Стоит добавить заметку о правах, чтобы не потерять происхождение файла.";
  }

  return "Карточка выглядит рабочей. При необходимости откройте расширенное редактирование.";
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

function updateWorkspaceUrl({ assetId, compose }) {
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

  window.history.replaceState({}, "", url);
}

function MediaInspector({ item, onEdit }) {
  if (!item) {
    return (
      <aside className={`${styles.panel} ${styles.mediaInspector}`} aria-live="polite">
        <h3 className={styles.mediaInspectorTitle}>Карточка не выбрана</h3>
        <p className={styles.helpText}>
          Выберите превью в галерее, чтобы увидеть крупное изображение, быстрые сигналы и usage.
        </p>
      </aside>
    );
  }

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
          <img src={item.previewUrl} alt={item.alt || item.title || item.originalFilename || "Превью"} />
        ) : (
          <div className={styles.mediaInspectorPlaceholder}>Нет preview</div>
        )}
      </div>

      <div className={styles.badgeRow}>
        <span className={`${styles.badge} ${styles[`mediaBadge${getToneForItem(item)}`]}`}>{item.statusLabel}</span>
        <span className={`${styles.badge} ${item.missingAlt ? styles.mediaBadgewarning : styles.mediaBadgesuccess}`}>
          {item.missingAlt ? "Без alt" : "Alt есть"}
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
        <h4>Где используется</h4>
        {item.usageEntries.length === 0 ? (
          <p className={styles.helpText}>Пока нет ссылок на этот ассет. Это безопасный момент для дальнейшей доводки.</p>
        ) : (
          <div className={styles.mediaUsageList}>
            {item.usageEntries.map((entry) => (
              <Link key={entry.key} href={entry.href} className={styles.mediaUsageItem}>
                <strong>{entry.entityLabel}</strong>
                <span>{entry.title}</span>
                <span className={styles.mutedText}>{entry.relationLabel} · {entry.statusLabel}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className={styles.mediaInspectorSection}>
        <h4>Безопасность</h4>
        <p className={styles.helpText}>
          {item.archiveBlocked
            ? "По этой карточке уже есть ссылки, поэтому destructive path здесь не должен быть мгновенным."
            : "Карточка пока никуда не подключена. Это хороший момент спокойно довести metadata до рабочего состояния."}
        </p>
        <div className={styles.inlineActions}>
          <Link href={`/admin/entities/media_asset/${item.id}/history`} className={styles.secondaryButton}>
            История
          </Link>
        </div>
      </section>
    </aside>
  );
}

function MediaOverlay({
  mode,
  fields,
  file,
  previewUrl,
  busy,
  error,
  dragActive,
  onClose,
  onFieldChange,
  onFileSelect,
  onSubmit,
  onDragEnter,
  onDragLeave,
  onDrop
}) {
  const dialogRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    if (!mode) {
      return;
    }

    const focusTarget = mode === "create" && !file ? dialogRef.current : titleRef.current;
    focusTarget?.focus();
  }, [mode, file]);

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

        <div className={styles.mediaOverlayBody}>
          <section className={styles.mediaOverlayPreview}>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={fields.alt || fields.title || fields.originalFilename || "Превью"} />
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
                <p className={styles.helpText}>V1 остаётся image-only. Видео и документы сюда не добавляем.</p>
              </div>
            )}
          </section>

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
                <span>Alt</span>
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
            </div>

            <div className={styles.mediaOverlayMeta}>
              <span>{fields.originalFilename || "Файл пока не выбран"}</span>
              {fields.originalFilename ? <span>{formatBytes(fields.sizeBytes)}</span> : null}
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
        </div>
      </div>
    </div>
  );
}

export function MediaGalleryWorkspace({
  initialItems,
  initialSelectedId,
  initialCompose = "",
  currentUsername,
  initialMessage = "",
  initialError = ""
}) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [filterKey, setFilterKey] = useState("all");
  const [sortMode, setSortMode] = useState("newest");
  const [selectedId, setSelectedId] = useState(initialSelectedId || initialItems[0]?.id || "");
  const [message, setMessage] = useState(initialMessage);
  const [error, setError] = useState(initialError);
  const [recentlySavedId, setRecentlySavedId] = useState("");
  const [overlayMode, setOverlayMode] = useState(initialCompose === "upload" ? "create" : null);
  const [overlayBusy, setOverlayBusy] = useState(false);
  const [overlayError, setOverlayError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [draftFile, setDraftFile] = useState(null);
  const [draftPreviewUrl, setDraftPreviewUrl] = useState("");
  const [fields, setFields] = useState({
    title: "",
    alt: "",
    caption: "",
    sourceNote: "",
    ownershipNote: "",
    changeIntent: "",
    originalFilename: "",
    sizeBytes: 0
  });
  const cardRefs = useRef([]);

  useEffect(() => {
    if (!selectedId && items[0]?.id) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  useEffect(() => {
    if (!draftPreviewUrl.startsWith("blob:")) {
      return undefined;
    }

    return () => {
      URL.revokeObjectURL(draftPreviewUrl);
    };
  }, [draftPreviewUrl]);

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const filtered = [...items]
    .filter((item) => matchesQuery(item, normalizedQuery))
    .filter((item) => matchesFilter(item, filterKey, currentUsername))
    .sort((left, right) => compareItems(left, right, sortMode));
  const selectedItem = items.find((item) => item.id === selectedId) ?? null;
  const selectedHiddenByFilter = Boolean(
    selectedItem &&
    !filtered.some((item) => item.id === selectedItem.id)
  );

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

  function resetOverlayState() {
    setOverlayBusy(false);
    setOverlayError("");
    setDraftFile(null);
    setDraftPreviewUrl("");
    setFields({
      title: "",
      alt: "",
      caption: "",
      sourceNote: "",
      ownershipNote: "",
      changeIntent: "",
      originalFilename: "",
      sizeBytes: 0
    });
  }

  function openCreateOverlay() {
    resetOverlayState();
    setOverlayMode("create");
    updateWorkspaceUrl({ assetId: selectedId, compose: "upload" });
  }

  function openEditOverlay(item) {
    setOverlayError("");
    setDraftFile(null);
    setDraftPreviewUrl(item?.previewUrl || "");
    setFields({
      title: item?.title || "",
      alt: item?.alt || "",
      caption: item?.caption || "",
      sourceNote: item?.sourceNote || "",
      ownershipNote: item?.ownershipNote || "",
      changeIntent: "",
      originalFilename: item?.originalFilename || "",
      sizeBytes: item?.sizeBytes || 0
    });
    setOverlayMode("edit");
    updateWorkspaceUrl({ assetId: item?.id || selectedId, compose: null });
  }

  function closeOverlay() {
    resetOverlayState();
    setOverlayMode(null);
    updateWorkspaceUrl({ assetId: selectedId, compose: null });
  }

  function selectCard(itemId) {
    setSelectedId(itemId);
    setMessage("");
    setError("");
    updateWorkspaceUrl({ assetId: itemId, compose: overlayMode === "create" ? "upload" : null });
  }

  function handleFieldChange(field, value) {
    setFields((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleFileSelect(file) {
    if (!file) {
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setDraftFile(file);
    setDraftPreviewUrl(nextPreviewUrl);
    setFields((current) => ({
      ...current,
      title: current.title || buildTitleFromFilename(file.name),
      originalFilename: file.name,
      sizeBytes: file.size
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
    formData.set("title", fields.title);
    formData.set("alt", fields.alt);
    formData.set("caption", fields.caption);
    formData.set("sourceNote", fields.sourceNote);
    formData.set("ownershipNote", fields.ownershipNote);
    formData.set("changeIntent", fields.changeIntent);

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
      updateWorkspaceUrl({ assetId: payload.item.id, compose: null });
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
    formData.set("title", fields.title);
    formData.set("alt", fields.alt);
    formData.set("caption", fields.caption);
    formData.set("sourceNote", fields.sourceNote);
    formData.set("ownershipNote", fields.ownershipNote);
    formData.set("changeIntent", fields.changeIntent);

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
      setSelectedId(payload.item.id);
      setRecentlySavedId(payload.item.id);
      setMessage(payload.message || "Изменения сохранены.");
      setError("");
      closeOverlay();
      updateWorkspaceUrl({ assetId: payload.item.id, compose: null });
    } catch (submitError) {
      setOverlayError(submitError.message || "Не удалось сохранить изменения.");
    } finally {
      setOverlayBusy(false);
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

  return (
    <div className={styles.stack}>
      {message ? <div className={styles.statusPanelInfo}>{message}</div> : null}
      {error ? <div className={styles.statusPanelBlocking}>{error}</div> : null}

      <section className={styles.panel}>
        <div className={styles.mediaToolbar}>
          <div className={styles.mediaToolbarIntro}>
            <p className={styles.eyebrow}>Рабочее место</p>
            <h3 className={styles.mediaToolbarTitle}>Медиагалерея</h3>
            <p className={styles.helpText}>
              Слева и в центре остаётся библиотека превью, справа быстрый inspector, а большое редактирование открывается поверх того же экрана.
            </p>
          </div>
          <div className={styles.mediaToolbarControls}>
            <label className={styles.searchLabel}>
              <span>Поиск</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className={styles.searchInput}
                placeholder="Название, alt, подпись, имя файла"
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
          </div>
        </div>

        <div className={styles.mediaFilterRow} role="toolbar" aria-label="Быстрые фильтры медиагалереи">
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
        </div>

        <div className={styles.mediaWorkspace}>
          <section className={styles.mediaCanvas}>
            <div className={styles.mediaCanvasMeta}>
              <span>Фильтр: {activeFilterLabel}</span>
              <span>Показано: {displayedItems.length}</span>
            </div>

            {items.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Библиотека пока пустая.</p>
                <p className={styles.helpText}>Начните с загрузки первого изображения, и оно сразу появится в галерее как рабочая карточка.</p>
                <div className={styles.inlineActions}>
                  <button type="button" className={styles.primaryButton} onClick={openCreateOverlay}>
                    Загрузить первое изображение
                  </button>
                </div>
              </div>
            ) : displayedItems.length === 0 ? (
              <div className={styles.emptyState}>
                <p>По текущему фильтру ничего не найдено.</p>
                <p className={styles.helpText}>Сбросьте поиск или переключите быстрый фильтр, чтобы снова увидеть карточки.</p>
                <div className={styles.inlineActions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => {
                    setQuery("");
                    setFilterKey("all");
                  }}>
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
                        {item.hasPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.previewUrl} alt={item.alt || item.title || item.originalFilename || "Превью"} />
                        ) : (
                          <span className={styles.mediaPlaceholder}>Нет preview</span>
                        )}
                      </span>
                      <span className={styles.mediaLibraryBody}>
                        <strong>{item.title}</strong>
                        <span className={styles.mutedText}>{item.originalFilename || "Имя файла не задано"}</span>
                        <span className={styles.mediaBadgeCluster}>
                          <span className={`${styles.badge} ${styles[`mediaBadge${getToneForItem(item)}`]}`}>{item.statusLabel}</span>
                          <span className={`${styles.badge} ${item.missingAlt ? styles.mediaBadgewarning : styles.mediaBadgesuccess}`}>
                            {item.missingAlt ? "Без alt" : "Alt"}
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
                Выбранная карточка сейчас скрыта фильтром, но inspector сохранён, чтобы вы не потеряли контекст.
              </div>
            ) : null}
          </section>

          <MediaInspector item={selectedItem} onEdit={() => openEditOverlay(selectedItem)} />
        </div>
      </section>

      <MediaOverlay
        mode={overlayMode}
        fields={fields}
        file={draftFile}
        previewUrl={draftPreviewUrl}
        busy={overlayBusy}
        error={overlayError}
        dragActive={dragActive}
        onClose={closeOverlay}
        onFieldChange={handleFieldChange}
        onFileSelect={handleFileSelect}
        onSubmit={overlayMode === "create" ? handleCreateSubmit : handleEditSubmit}
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
    </div>
  );
}
