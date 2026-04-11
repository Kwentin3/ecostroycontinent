"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { StandalonePage } from "../public/PublicRenderers";
import { LANDING_PAGE_THEME_REGISTRY } from "../../lib/landing-composition/visual-semantics.js";
import { PAGE_TYPES } from "../../lib/content-core/content-types.js";
import {
  buildPageWorkspaceAiActionModel,
  buildPageWorkspaceEmptyState,
  buildPageWorkspaceFullInput,
  buildPageWorkspaceLookupResolvers,
  buildPageWorkspacePreviewPayload
} from "../../lib/admin/page-workspace.js";
import { normalizeLegacyCopy } from "../../lib/ui-copy.js";
import { PageMetadataModal } from "./PageMetadataModal";
import { PreviewViewport } from "./PreviewViewport";
import adminStyles from "./admin-ui.module.css";
import styles from "./PageWorkspaceScreen.module.css";

function toneClassName(tone = "") {
  if (tone === "healthy") {
    return styles.tonehealthy;
  }

  if (tone === "warning") {
    return styles.tonewarning;
  }

  if (tone === "danger") {
    return styles.tonedanger;
  }

  return styles.toneunknown;
}

function arrayMove(list = [], fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= list.length || fromIndex === toIndex) {
    return list;
  }

  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function listKey(list = []) {
  return JSON.stringify(list);
}

function getTargetLabel(target, pageType) {
  if (target === "connective_copy") {
    return "Связочный текст";
  }

  if (target === "cta") {
    return pageType === PAGE_TYPES.CONTACTS ? "Контактный блок" : "Финальный CTA";
  }

  if (target === "page_copy") {
    return "Вся видимая копия";
  }

  return "Hero";
}

function MediaPickerModal({
  open,
  metadata,
  mediaOptions,
  galleryOptions,
  onClose,
  onApply
}) {
  const [query, setQuery] = useState("");
  const [heroAssetId, setHeroAssetId] = useState(metadata.primaryMediaAssetId || "");
  const [galleryIds, setGalleryIds] = useState(metadata.galleryIds || []);

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuery("");
    setHeroAssetId(metadata.primaryMediaAssetId || "");
    setGalleryIds(metadata.galleryIds || []);
  }, [metadata.galleryIds, metadata.primaryMediaAssetId, open]);

  if (!open) {
    return null;
  }

  const loweredQuery = query.trim().toLowerCase();
  const filteredAssets = mediaOptions.filter((item) => {
    if (!loweredQuery) {
      return true;
    }

    return `${item.title || ""} ${item.alt || ""} ${item.meta || ""}`.toLowerCase().includes(loweredQuery);
  });
  const filteredGalleries = galleryOptions.filter((item) => {
    if (!loweredQuery) {
      return true;
    }

    return `${item.label || ""} ${item.meta || ""}`.toLowerCase().includes(loweredQuery);
  });

  return (
    <>
      <button type="button" className={styles.pickerOverlay} aria-label="Закрыть медиамодалку" onClick={onClose} />
      <section className={styles.pickerCard} role="dialog" aria-modal="true" aria-labelledby="media-picker-title">
        <header className={styles.pickerHead}>
          <div>
            <p className={styles.eyebrow}>Источник</p>
            <h3 id="media-picker-title" className={styles.pickerTitle}>Медиа</h3>
            <p className={styles.pickerLegend}>Главный кадр и галерея управляются отсюда, но truth остаётся у `Page`.</p>
          </div>
          <button type="button" className={styles.ghostButton} onClick={onClose}>Закрыть</button>
        </header>
        <div className={styles.pickerSearch}>
          <input
            className={styles.input}
            placeholder="Поиск по медиа и коллекциям"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className={styles.pickerBody}>
          <section className={styles.pickerList}>
            <div>
              <p className={styles.eyebrow}>Главный кадр</p>
              <p className={styles.inlineHint}>Один asset для hero и карточки страницы.</p>
            </div>
            {filteredAssets.map((item) => (
              <article key={item.id} className={styles.pickerItem}>
                <div className={styles.pickerMarker}>
                  {item.previewUrl ? <img src={item.previewUrl} alt={item.alt || item.title} className={styles.pickerThumb} /> : "М"}
                </div>
                <div className={styles.pickerMain}>
                  <strong>{item.title || item.id}</strong>
                  <p className={styles.selectedMeta}>{item.alt || item.meta || "Без подписи"}</p>
                </div>
                <label className={styles.pickerSelection}>
                  <input
                    type="radio"
                    name="heroAsset"
                    checked={heroAssetId === item.id}
                    onChange={() => setHeroAssetId(item.id)}
                  />
                  <span>Главный</span>
                </label>
              </article>
            ))}
          </section>
          <section className={styles.pickerList}>
            <div>
              <p className={styles.eyebrow}>Коллекции</p>
              <p className={styles.inlineHint}>Коллекции формируют canonical gallery block и работают с review/public preview без обходного рендера.</p>
            </div>
            {filteredGalleries.map((item) => (
              <article key={item.id} className={styles.pickerItem}>
                <div className={styles.pickerMarker}>Г</div>
                <div className={styles.pickerMain}>
                  <strong>{item.label || item.id}</strong>
                  <p className={styles.selectedMeta}>{item.meta || "Коллекция"}</p>
                </div>
                <label className={styles.pickerSelection}>
                  <input
                    type="checkbox"
                    checked={galleryIds.includes(item.id)}
                    onChange={() => {
                      setGalleryIds((current) => (
                        current.includes(item.id)
                          ? current.filter((id) => id !== item.id)
                          : [...current, item.id]
                      ));
                    }}
                  />
                  <span>{galleryIds.includes(item.id) ? "В галерее" : "Добавить"}</span>
                </label>
              </article>
            ))}
          </section>
        </div>
        <footer className={styles.pickerFoot}>
          <p className={styles.inlineHint}>Ничего не публикуется автоматически. После выбора сохраните страницу явным действием.</p>
          <div className={styles.selectedActions}>
            <button type="button" className={styles.ghostButton} onClick={onClose}>Отмена</button>
            <button
              type="button"
              className={styles.applyButton}
              onClick={() => onApply({
                primaryMediaAssetId: heroAssetId,
                galleryIds
              })}
            >
              Применить
            </button>
          </div>
        </footer>
      </section>
    </>
  );
}

function EntityPickerModal({
  open,
  title,
  marker,
  items,
  emptyHint,
  emptyHref,
  emptyHrefLabel,
  selectedIds,
  onClose,
  onApply
}) {
  const [query, setQuery] = useState("");
  const [draftIds, setDraftIds] = useState(selectedIds);

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuery("");
    setDraftIds(selectedIds);
  }, [open, selectedIds]);

  if (!open) {
    return null;
  }

  const loweredQuery = query.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    if (!loweredQuery) {
      return true;
    }

    return `${item.label || ""} ${item.meta || ""}`.toLowerCase().includes(loweredQuery);
  });

  return (
    <>
      <button type="button" className={styles.pickerOverlay} aria-label="Закрыть модалку выбора" onClick={onClose} />
      <section className={styles.pickerCard} role="dialog" aria-modal="true" aria-labelledby={`${title}-picker-title`}>
        <header className={styles.pickerHead}>
          <div>
            <p className={styles.eyebrow}>Источник</p>
            <h3 id={`${title}-picker-title`} className={styles.pickerTitle}>{title}</h3>
            <p className={styles.pickerLegend}>Выбор возвращает только page-owned refs и их порядок. Никакого второго truth artifact здесь нет.</p>
          </div>
          <button type="button" className={styles.ghostButton} onClick={onClose}>Закрыть</button>
        </header>
        <div className={styles.pickerSearch}>
          <input
            className={styles.input}
            placeholder={`Поиск по ${title.toLowerCase()}`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className={styles.pickerBody}>
          <div className={styles.pickerList}>
            {filteredItems.length > 0 ? filteredItems.map((item) => (
              <article key={item.id} className={styles.pickerItem}>
                <div className={styles.pickerMarker}>{marker}</div>
                <div className={styles.pickerMain}>
                  <strong>{item.label || item.id}</strong>
                  <p className={styles.selectedMeta}>{item.meta || "Без описания"}</p>
                </div>
                <label className={styles.pickerSelection}>
                  <input
                    type="checkbox"
                    checked={draftIds.includes(item.id)}
                    onChange={() => {
                      setDraftIds((current) => (
                        current.includes(item.id)
                          ? current.filter((id) => id !== item.id)
                          : [...current, item.id]
                      ));
                    }}
                  />
                  <span>{draftIds.includes(item.id) ? "Выбрано" : "Добавить"}</span>
                </label>
              </article>
            )) : (
              <div className={styles.pickerEmpty}>
                <strong>{query.trim() ? "По этому запросу ничего не найдено." : `${title} пока не заведены.`}</strong>
                <p className={styles.inlineHint}>
                  {query.trim()
                    ? "Снимите или уточните поиск, чтобы снова увидеть доступные записи."
                    : emptyHint}
                </p>
                {!query.trim() && emptyHref ? <Link href={emptyHref} className={styles.inlineLink}>{emptyHrefLabel}</Link> : null}
              </div>
            )}
          </div>
        </div>
        <footer className={styles.pickerFoot}>
          <p className={styles.inlineHint}>Порядок можно будет уточнить уже на мольберте страницы.</p>
          <div className={styles.selectedActions}>
            <button type="button" className={styles.ghostButton} onClick={onClose}>Отмена</button>
            <button type="button" className={styles.applyButton} onClick={() => onApply(draftIds)}>Применить</button>
          </div>
        </footer>
      </section>
    </>
  );
}

function SelectedItem({ label, meta, previewUrl, isPrimary = false, onPromote, onMoveUp, onMoveDown, onRemove }) {
  return (
    <article className={styles.selectedItem}>
      {previewUrl ? <img src={previewUrl} alt={label} className={styles.selectedThumb} /> : <div className={styles.selectedFallback}>{label.slice(0, 1)}</div>}
      <div className={styles.selectedMain}>
        <strong>{label}</strong>
        <p className={styles.selectedMeta}>{meta}</p>
        {isPrimary ? <span className={`${styles.badge} ${styles.tonehealthy}`}>Главный</span> : null}
      </div>
      <div className={styles.selectedActions}>
        {typeof onPromote === "function" ? <button type="button" className={styles.miniButton} onClick={onPromote}>{isPrimary ? "Главный кадр" : "Сделать главным"}</button> : null}
        {typeof onMoveUp === "function" ? <button type="button" className={styles.miniButton} onClick={onMoveUp}>Выше</button> : null}
        {typeof onMoveDown === "function" ? <button type="button" className={styles.miniButton} onClick={onMoveDown}>Ниже</button> : null}
        {typeof onRemove === "function" ? <button type="button" className={styles.dangerButton} onClick={onRemove}>Убрать</button> : null}
      </div>
    </article>
  );
}

export function PageWorkspaceScreen({
  pageId,
  pageLabel,
  initialBaseValue,
  initialComposition,
  initialMetadata,
  initialRevision,
  reviewHref,
  historyHref,
  saveUrl,
  signalLabel,
  signalTone,
  signalReason,
  mediaOptions,
  relationOptions,
  publishedLookupRecords,
  globalSettings,
  lifecycle = null,
  initialMessage = "",
  initialError = ""
}) {
  const [baseValue, setBaseValue] = useState(initialBaseValue);
  const [composition, setComposition] = useState(initialComposition);
  const [savedComposition, setSavedComposition] = useState(initialComposition);
  const [metadata, setMetadata] = useState(initialMetadata);
  const [savedMetadata, setSavedMetadata] = useState(initialMetadata);
  const [revision, setRevision] = useState(initialRevision);
  const [currentReviewHref, setCurrentReviewHref] = useState(reviewHref);
  const [saveBusy, setSaveBusy] = useState(false);
  const [status, setStatus] = useState(initialMessage);
  const [error, setError] = useState(initialError);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [pickerFamily, setPickerFamily] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("hero");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiIntent, setAiIntent] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiProgressLabel, setAiProgressLabel] = useState("");
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [currentSignal, setCurrentSignal] = useState({
    label: signalLabel,
    tone: signalTone,
    reason: signalReason
  });
  const [lifecycleState, setLifecycleState] = useState(lifecycle);
  const [lifecycleBusy, setLifecycleBusy] = useState("");
  const [lifecycleMenuOpen, setLifecycleMenuOpen] = useState(false);
  const lookupResolvers = useMemo(
    () => buildPageWorkspaceLookupResolvers(publishedLookupRecords),
    [publishedLookupRecords]
  );
  const previewPayload = useMemo(
    () => buildPageWorkspacePreviewPayload({ baseValue, composition, metadata }),
    [baseValue, composition, metadata]
  );
  const emptyState = useMemo(
    () => buildPageWorkspaceEmptyState(composition),
    [composition]
  );
  const compositionDirty = listKey(composition.serviceIds) !== listKey(savedComposition.serviceIds)
    || listKey(composition.caseIds) !== listKey(savedComposition.caseIds)
    || listKey(composition.galleryIds) !== listKey(savedComposition.galleryIds)
    || composition.title !== savedComposition.title
    || composition.h1 !== savedComposition.h1
    || composition.intro !== savedComposition.intro
    || composition.body !== savedComposition.body
    || composition.contactNote !== savedComposition.contactNote
    || composition.ctaTitle !== savedComposition.ctaTitle
    || composition.ctaBody !== savedComposition.ctaBody
    || composition.defaultBlockCtaLabel !== savedComposition.defaultBlockCtaLabel
    || composition.primaryMediaAssetId !== savedComposition.primaryMediaAssetId;
  const metadataDirty = JSON.stringify(metadata) !== JSON.stringify(savedMetadata);
  const pageThemeLabel = LANDING_PAGE_THEME_REGISTRY[metadata.pageThemeKey]?.label || metadata.pageThemeKey;
  const activeTargetLabel = getTargetLabel(selectedTarget, metadata.pageType);
  const mediaSelections = composition.galleryIds.map((id) => relationOptions.galleries.find((item) => item.id === id)).filter(Boolean);
  const serviceSelections = composition.serviceIds.map((id) => relationOptions.services.find((item) => item.id === id)).filter(Boolean);
  const caseSelections = composition.caseIds.map((id) => relationOptions.cases.find((item) => item.id === id)).filter(Boolean);
  const heroMedia = mediaOptions.find((item) => item.id === composition.primaryMediaAssetId) || null;
  const canSaveFirstDraft = Boolean(composition.title.trim()) && Boolean(composition.h1.trim());
  const aiActionModels = [
    buildPageWorkspaceAiActionModel({ aiAction: "rewrite_selected", selectedTarget, pageType: metadata.pageType }),
    buildPageWorkspaceAiActionModel({ aiAction: "suggest_connective_copy", selectedTarget, pageType: metadata.pageType }),
    buildPageWorkspaceAiActionModel({ aiAction: "strengthen_cta", selectedTarget, pageType: metadata.pageType }),
    buildPageWorkspaceAiActionModel({ aiAction: "compact_wording", selectedTarget, pageType: metadata.pageType })
  ];

  const applyComposition = (patch) => {
    setComposition((current) => ({
      ...current,
      ...patch
    }));
  };

  const handleJsonAction = async (payload) => {
    const response = await fetch(saveUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Не удалось выполнить действие рабочего экрана.");
    }

    return result;
  };

  const handleSaveComposition = async () => {
    setSaveBusy(true);
    setError("");
    setStatus("");

    try {
      const result = await handleJsonAction({
        action: "save_composition",
        composition
      });
      const nextComposition = result.composition || composition;
      const nextMetadata = result.metadata || metadata;

      setComposition(nextComposition);
      setSavedComposition(nextComposition);
      setMetadata(nextMetadata);
      setSavedMetadata(nextMetadata);
      setBaseValue((current) => buildPageWorkspaceFullInput({
        baseValue: current,
        composition: nextComposition,
        metadata: nextMetadata
      }));
      setRevision(result.revision || revision);
      setCurrentReviewHref(result.reviewHref || currentReviewHref);
      setStatus(result.message || "Черновик страницы сохранён.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaveBusy(false);
    }
  };

  const handleArchivePage = async () => {
    if (!lifecycleState?.canArchive || lifecycleBusy) {
      return;
    }

    if (!window.confirm("Снять страницу с live? История и сама сущность останутся в админке.")) {
      return;
    }

    setLifecycleBusy("archive");
    setLifecycleMenuOpen(false);
    setError("");
    setStatus("");

    try {
      const formData = new FormData();
      formData.set("responseMode", "json");
      const response = await fetch(lifecycleState.archiveUrl, {
        method: "POST",
        body: formData
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Не удалось снять страницу с публикации.");
      }

      setLifecycleState((current) => current ? {
        ...current,
        canArchive: false,
        hasLivePublishedRevision: false,
        canDelete: false
      } : current);
      setCurrentSignal({
        label: "Вне live",
        tone: "warning",
        reason: "Страница снята с публикации и остаётся доступной в админке как историческая truth."
      });
      setStatus(result.message || "Страница снята с публикации.");
    } catch (lifecycleError) {
      setError(lifecycleError.message);
    } finally {
      setLifecycleBusy("");
    }
  };

  const handleDeletePage = async () => {
    if (!lifecycleState?.canDelete || lifecycleBusy) {
      return;
    }

    if (!window.confirm("Удалить страницу целиком? Это действие необратимо.")) {
      return;
    }

    setLifecycleBusy("delete");
    setLifecycleMenuOpen(false);
    setError("");
    setStatus("");

    try {
      const formData = new FormData();
      formData.set("responseMode", "json");
      formData.append("entityId", pageId);
      const response = await fetch(lifecycleState.deleteUrl, {
        method: "POST",
        body: formData
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Не удалось удалить страницу.");
      }

      const location = new URL(lifecycleState.registryHref, window.location.origin);
      location.searchParams.set("message", result.message || "Страница удалена.");
      window.location.assign(location.toString());
    } catch (lifecycleError) {
      setError(lifecycleError.message);
      setLifecycleBusy("");
    }
  };

  const handleSaveMetadata = async (nextMetadata) => {
    const result = await handleJsonAction({
      action: "save_metadata",
      metadata: nextMetadata
    });
    const appliedMetadata = result.metadata || nextMetadata;

    setMetadata(appliedMetadata);
    setSavedMetadata(appliedMetadata);
    setBaseValue((current) => buildPageWorkspaceFullInput({
      baseValue: current,
      composition,
      metadata: appliedMetadata
    }));
    setRevision(result.revision || revision);

    return result;
  };

  const handleSendToReview = async () => {
    if (compositionDirty) {
      setError("Сначала сохраните изменения мольберта, а потом отправляйте страницу на проверку.");
      return;
    }

    setSaveBusy(true);
    setError("");

    try {
      const result = await handleJsonAction({ action: "send_to_review" });
      setRevision(result.revision || revision);
      setCurrentReviewHref(result.reviewHref || currentReviewHref);
      window.location.assign(result.reviewHref);
    } catch (reviewError) {
      setError(reviewError.message);
      setSaveBusy(false);
    }
  };

  const handleAiAction = async (aiAction) => {
    const actionModel = buildPageWorkspaceAiActionModel({
      aiAction,
      selectedTarget,
      pageType: metadata.pageType
    });

    setAiBusy(true);
    setError("");
    setAiSuggestion(null);
    setAiProgressLabel(actionModel.progressLabel);
    setStatus("");

    try {
      const result = await handleJsonAction({
        action: "suggest_patch",
        aiAction: actionModel.aiAction,
        target: actionModel.target,
        changeIntent: aiIntent,
        composition,
        metadata
      });
      setAiSuggestion({
        ...result.suggestion,
        actionLabel: actionModel.label,
        actionHint: actionModel.hint,
        targetLabel: getTargetLabel(actionModel.target, metadata.pageType)
      });
      setStatus(`AI подготовил patch для зоны «${getTargetLabel(actionModel.target, metadata.pageType)}». Он попадёт в truth только после явного применения и сохранения.`);
    } catch (aiError) {
      setError(aiError.message);
    } finally {
      setAiProgressLabel("");
      setAiBusy(false);
    }
  };

  return (
    <div className={styles.workspace}>
      <section className={styles.header}>
        <div className={styles.headerMain}>
          <p className={styles.eyebrow}>Страницы · единый рабочий экран</p>
          <h1 className={styles.title}>{pageLabel}</h1>
          <p className={styles.meta}>
            {emptyState.isEmptyWorkspace
              ? "У страницы пока нет сохранённой версии. Заполните базовый текст, при необходимости подберите источники и сохраните первый draft."
              : "В центре остаётся page-owned composition. Метаданные, review и publish по-прежнему живут отдельными управленческими действиями."}
          </p>
          <div className={styles.statusRow}>
            <span className={`${styles.badge} ${toneClassName(currentSignal.tone)}`}>{currentSignal.label}</span>
            <span className={`${styles.badge} ${styles.toneunknown}`}>{revision ? `Версия №${revision.revisionNumber} · ${revision.state}` : "Черновика пока нет"}</span>
            <span className={`${styles.badge} ${styles.toneunknown}`}>{metadata.pageType === PAGE_TYPES.CONTACTS ? "Контакты" : "О нас"}</span>
            {lifecycleState?.hasLivePublishedRevision ? (
              <span className={`${styles.badge} ${styles.tonehealthy}`}>В live</span>
            ) : null}
            <span className={`${styles.badge} ${styles.toneunknown}`}>{pageThemeLabel}</span>
            {compositionDirty ? <span className={`${styles.badge} ${styles.tonewarning}`}>Есть несохранённые изменения</span> : null}
            {metadataDirty ? <span className={`${styles.badge} ${styles.tonewarning}`}>Metadata changed</span> : null}
          </div>
          <p className={styles.metaCompact}>{currentSignal.reason}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={adminStyles.secondaryButton} onClick={() => setMetadataOpen(true)}>
            Метаданные
          </button>
          {historyHref ? <Link href={historyHref} className={adminStyles.secondaryButton}>История</Link> : null}
          {currentReviewHref ? <Link href={currentReviewHref} className={adminStyles.secondaryButton}>Открыть проверку</Link> : null}
          {lifecycleState?.canArchive || lifecycleState?.canDelete ? (
            <div className={styles.lifecycleWrap}>
              <button
                type="button"
                className={adminStyles.secondaryButton}
                onClick={() => setLifecycleMenuOpen((current) => !current)}
                disabled={Boolean(lifecycleBusy)}
              >
                Управление
              </button>
              {lifecycleMenuOpen ? (
                <div className={styles.lifecycleMenu}>
                  {lifecycleState?.canArchive ? (
                    <button type="button" className={styles.lifecycleAction} onClick={handleArchivePage} disabled={Boolean(lifecycleBusy)}>
                      Снять с live
                    </button>
                  ) : null}
                  {lifecycleState?.canDelete ? (
                    <button type="button" className={styles.lifecycleDanger} onClick={handleDeletePage} disabled={Boolean(lifecycleBusy)}>
                      Удалить страницу
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            className={adminStyles.primaryButton}
            onClick={handleSaveComposition}
            disabled={saveBusy || aiBusy || (emptyState.isEmptyWorkspace && !canSaveFirstDraft)}
          >
            {saveBusy ? "Сохраняем..." : "Сохранить страницу"}
          </button>
          <button type="button" className={adminStyles.secondaryButton} onClick={handleSendToReview} disabled={saveBusy || aiBusy || Boolean(lifecycleBusy) || !revision}>
            Передать на проверку
          </button>
        </div>
      </section>

      {error ? <div className={adminStyles.statusPanelBlocking}>{normalizeLegacyCopy(error)}</div> : null}
      {status ? <div className={adminStyles.statusPanelInfo}>{normalizeLegacyCopy(status)}</div> : null}

      <div className={styles.shell}>
        <aside className={styles.rail}>
          <h2 className={styles.railTitle}>Источники</h2>
          <button type="button" className={styles.launcher} onClick={() => setPickerFamily("media")}>
            <span className={styles.launcherIcon}>М</span>
            <span className={styles.launcherLabel}>Медиа</span>
            <span className={styles.launcherMeta}>{composition.galleryIds.length} коллекц.</span>
          </button>
          <button type="button" className={styles.launcher} onClick={() => setPickerFamily("cases")}>
            <span className={styles.launcherIcon}>К</span>
            <span className={styles.launcherLabel}>Кейсы</span>
            <span className={styles.launcherMeta}>{composition.caseIds.length} выбрано</span>
          </button>
          <button type="button" className={styles.launcher} onClick={() => setPickerFamily("services")}>
            <span className={styles.launcherIcon}>У</span>
            <span className={styles.launcherLabel}>Услуги</span>
            <span className={styles.launcherMeta}>{composition.serviceIds.length} выбрано</span>
          </button>
        </aside>

        <div className={styles.canvasColumn}>
          <div className={styles.canvasTop}>
            <div className={styles.canvasTitleWrap}>
              <p className={styles.eyebrow}>Мольберт</p>
              <h2 className={styles.canvasTitle}>Сборка страницы</h2>
              <p className={styles.canvasLegend}>Частая работа остаётся в центре, а редкое и служебное скрыто в metadata layer.</p>
            </div>
          </div>

          <div className={styles.canvas}>
            {emptyState.isEmptyWorkspace ? (
              <section className={`${styles.sectionCard} ${styles.emptyWorkspaceCard}`}>
                <div className={styles.sectionHead}>
                  <div>
                    <h3 className={styles.sectionTitle}>Версии пока нет</h3>
                    <p className={styles.sectionMeta}>Это честный пустой state: страница уже заведена в реестре, но её first draft ещё не сохранён.</p>
                  </div>
                </div>
                <ul className={styles.emptyChecklist}>
                  <li>{emptyState.titleReady ? "Название страницы задано" : "Добавьте название страницы"}</li>
                  <li>{emptyState.h1Ready ? "H1 задан" : "Добавьте H1 для первого экрана"}</li>
                  <li>{emptyState.introReady ? "Интро уже есть" : "При желании добавьте краткое интро"}</li>
                  <li>{emptyState.mediaReady || emptyState.sourceCount > 0 ? "Источники уже подобраны" : "При необходимости подберите медиа, кейсы или услуги через launcher-слева"}</li>
                </ul>
                <p className={styles.inlineHint}>Первый draft появится только после явного сохранения. Простое открытие страницы ничего не создаёт.</p>
              </section>
            ) : null}
            <section className={`${styles.sectionCard} ${selectedTarget === "hero" ? styles.sectionCardActive : ""}`} onClick={() => setSelectedTarget("hero")}>
              <div className={styles.sectionHead}>
                <div>
                  <h3 className={styles.sectionTitle}>Hero и первый экран</h3>
                  <p className={styles.sectionMeta}>Название, H1, подводка и главный кадр. Это часть visible page copy, а не metadata shell.</p>
                </div>
              </div>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Название страницы</span>
                  <input className={styles.input} value={composition.title} onChange={(event) => applyComposition({ title: event.target.value })} />
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>H1</span>
                  <input className={styles.input} value={composition.h1} onChange={(event) => applyComposition({ h1: event.target.value })} />
                </div>
                <div className={`${styles.field} ${styles.fieldWide}`}>
                  <span className={styles.fieldLabel}>Интро</span>
                  <textarea className={styles.textarea} value={composition.intro} onChange={(event) => applyComposition({ intro: event.target.value })} />
                </div>
              </div>
              <div className={styles.selectedStack}>
                <SelectedItem
                  label={heroMedia?.title || "Главный кадр не выбран"}
                  meta={heroMedia?.alt || "Откройте Медиа, чтобы выбрать главный кадр"}
                  previewUrl={heroMedia?.previewUrl || ""}
                  isPrimary
                  onRemove={() => applyComposition({ primaryMediaAssetId: "" })}
                />
              </div>
            </section>

            <section className={styles.sectionCard}>
              <div className={styles.sectionHead}>
                <div>
                  <h3 className={styles.sectionTitle}>Подобранные источники</h3>
                  <p className={styles.sectionMeta}>Левый rail только открывает источники. Сам выбор и порядок остаются page-owned внутри страницы.</p>
                </div>
              </div>

              <div className={styles.selectedStack}>
                {mediaSelections.map((item, index) => (
                  <SelectedItem
                    key={`gallery-${item.id}`}
                    label={item.label || item.id}
                    meta={item.meta || "Коллекция"}
                    onMoveUp={() => applyComposition({ galleryIds: arrayMove(composition.galleryIds, index, index - 1) })}
                    onMoveDown={() => applyComposition({ galleryIds: arrayMove(composition.galleryIds, index, index + 1) })}
                    onRemove={() => applyComposition({ galleryIds: composition.galleryIds.filter((id) => id !== item.id) })}
                  />
                ))}
                {serviceSelections.map((item, index) => (
                  <SelectedItem
                    key={`service-${item.id}`}
                    label={item.label || item.id}
                    meta={item.meta || "Услуга"}
                    onMoveUp={() => applyComposition({ serviceIds: arrayMove(composition.serviceIds, index, index - 1) })}
                    onMoveDown={() => applyComposition({ serviceIds: arrayMove(composition.serviceIds, index, index + 1) })}
                    onRemove={() => applyComposition({ serviceIds: composition.serviceIds.filter((id) => id !== item.id) })}
                  />
                ))}
                {caseSelections.map((item, index) => (
                  <SelectedItem
                    key={`case-${item.id}`}
                    label={item.label || item.id}
                    meta={item.meta || "Кейс"}
                    onMoveUp={() => applyComposition({ caseIds: arrayMove(composition.caseIds, index, index - 1) })}
                    onMoveDown={() => applyComposition({ caseIds: arrayMove(composition.caseIds, index, index + 1) })}
                    onRemove={() => applyComposition({ caseIds: composition.caseIds.filter((id) => id !== item.id) })}
                  />
                ))}
                {mediaSelections.length === 0 && serviceSelections.length === 0 && caseSelections.length === 0 ? (
                  <p className={styles.inlineHint}>Добавьте материалы через launcher-иконки слева. Они откроют модалки выбора вместо старого scrolling warehouse.</p>
                ) : null}
              </div>
            </section>

            <section className={`${styles.sectionCard} ${styles.bridgeCard} ${selectedTarget === "connective_copy" ? styles.sectionCardActive : ""}`} onClick={() => setSelectedTarget("connective_copy")}>
              <div className={styles.sectionHead}>
                <div>
                  <h3 className={styles.sectionTitle}>Связочный текст</h3>
                  <p className={styles.sectionMeta}>Connective copy остаётся частью `Page`, а не отдельной detached entity. Здесь собирается переход между доказательствами и финальным предложением.</p>
                </div>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Основная связка</span>
                <textarea className={styles.textarea} value={composition.body} onChange={(event) => applyComposition({ body: event.target.value })} />
              </div>
            </section>

            <section className={`${styles.sectionCard} ${selectedTarget === "cta" ? styles.sectionCardActive : ""}`} onClick={() => setSelectedTarget("cta")}>
              <div className={styles.sectionHead}>
                <div>
                  <h3 className={styles.sectionTitle}>{metadata.pageType === PAGE_TYPES.CONTACTS ? "Контактный блок" : "CTA и финальный переход"}</h3>
                  <p className={styles.sectionMeta}>AI может помогать здесь только узко и явно. Никакого silent ownership over page truth.</p>
                </div>
              </div>
              {metadata.pageType === PAGE_TYPES.CONTACTS ? (
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Контактная подводка</span>
                  <textarea className={styles.textarea} value={composition.contactNote} onChange={(event) => applyComposition({ contactNote: event.target.value })} />
                </div>
              ) : (
                <div className={styles.fieldGrid}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>CTA title</span>
                    <input className={styles.input} value={composition.ctaTitle} onChange={(event) => applyComposition({ ctaTitle: event.target.value })} />
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>CTA label</span>
                    <input className={styles.input} value={composition.defaultBlockCtaLabel} onChange={(event) => applyComposition({ defaultBlockCtaLabel: event.target.value })} />
                  </div>
                  <div className={`${styles.field} ${styles.fieldWide}`}>
                    <span className={styles.fieldLabel}>CTA body</span>
                    <textarea className={styles.textarea} value={composition.ctaBody} onChange={(event) => applyComposition({ ctaBody: event.target.value })} />
                  </div>
                </div>
              )}
            </section>
          </div>

          <section className={styles.previewCard}>
            {previewPayload ? (
              <PreviewViewport
                title="Предпросмотр"
                hint="Viewport-переключатель меняет только рамку устройства. Сам preview остаётся на canonical renderer `StandalonePage`."
                device={previewDevice}
                onDeviceChange={setPreviewDevice}
              >
                <StandalonePage
                  page={previewPayload}
                  globalSettings={globalSettings}
                  services={lookupResolvers.services}
                  cases={lookupResolvers.cases}
                  galleries={lookupResolvers.galleries}
                  resolveMedia={lookupResolvers.media}
                />
              </PreviewViewport>
            ) : (
              <div className={styles.previewEmpty}>
                <p className={styles.eyebrow}>Предпросмотр</p>
                <h3 className={styles.previewTitle}>Предпросмотр появится после базового заполнения</h3>
                <p className={styles.previewLegend}>Чтобы canonical preview стал доступен, задайте название страницы и H1. После этого можно сохранять первый draft и продолжать сборку.</p>
                <div className={styles.previewChecklist}>
                  <span className={`${styles.badge} ${emptyState.titleReady ? styles.tonehealthy : styles.tonewarning}`}>Название: {emptyState.titleReady ? "готово" : "нужно"}</span>
                  <span className={`${styles.badge} ${emptyState.h1Ready ? styles.tonehealthy : styles.tonewarning}`}>H1: {emptyState.h1Ready ? "готово" : "нужно"}</span>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className={styles.aiPanel}>
          <div className={styles.panelSection}>
            <p className={styles.eyebrow}>AI-панель</p>
            <h2 className={styles.panelTitle}>Встроенный помощник</h2>
            <p className={styles.supportCopy}>AI встроен как assistive tool: он предлагает bounded patch, но не сохраняет truth молча и не перехватывает ownership страницы.</p>
          </div>

          <div className={styles.panelSection}>
            <strong>Текущая зона редактирования</strong>
            <p className={styles.inlineHint}>Сейчас выделено: <strong>{activeTargetLabel}</strong>. Часть AI-действий всегда работают по собственной узкой зоне и явно показывают это ниже.</p>
            <div className={styles.targetPills}>
              {[
                ["hero", "Hero"],
                ["connective_copy", "Связка"],
                ["cta", metadata.pageType === PAGE_TYPES.CONTACTS ? "Контакты" : "CTA"],
                ["page_copy", "Вся видимая копия"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={selectedTarget === value ? styles.pillActive : styles.pill}
                  onClick={() => setSelectedTarget(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.panelSection}>
            <strong>Контекст запроса</strong>
            <textarea
              className={styles.textarea}
              value={aiIntent}
              onChange={(event) => setAiIntent(event.target.value)}
              placeholder="Например: сделать переход мягче и короче."
            />
          </div>

          <div className={styles.panelSection}>
            <strong>Разрешённые действия</strong>
            <div className={styles.actionGrid}>
              {aiActionModels.map((actionModel) => (
                <button
                  key={actionModel.aiAction}
                  type="button"
                  className={styles.actionButton}
                  disabled={aiBusy || (emptyState.isEmptyWorkspace && !canSaveFirstDraft)}
                  onClick={() => handleAiAction(actionModel.aiAction)}
                >
                  <span>{actionModel.label}</span>
                  <small>{getTargetLabel(actionModel.target, metadata.pageType)}</small>
                </button>
              ))}
            </div>
            {emptyState.isEmptyWorkspace && !canSaveFirstDraft ? <p className={styles.inlineHint}>Сначала задайте название страницы и H1, чтобы AI работал с понятным page context.</p> : null}
          </div>

          {aiBusy ? <div className={styles.aiProgress}>{aiProgressLabel || "AI готовит предложение..."}</div> : null}

          {aiSuggestion ? (
            <section className={styles.suggestion}>
              <strong>Предложение для зоны «{aiSuggestion.targetLabel}»</strong>
              <p className={styles.inlineHint}>{aiSuggestion.actionHint}</p>
              <p className={styles.inlineHint}>{aiSuggestion.label}</p>
              <div className={styles.suggestionList}>
                {Object.entries(aiSuggestion.patch || {}).map(([field, value]) => (
                  <article key={field} className={styles.suggestionItem}>
                    <span className={styles.suggestionLabel}>{field}</span>
                    <strong>{String(value || "—")}</strong>
                  </article>
                ))}
              </div>
              <div className={styles.selectedActions}>
                <button type="button" className={styles.ghostButton} onClick={() => setAiSuggestion(null)}>Не применять</button>
                <button
                  type="button"
                  className={styles.applyButton}
                  onClick={() => {
                    applyComposition(aiSuggestion.patch || {});
                    setAiSuggestion(null);
                    setStatus(`AI-патч для зоны «${aiSuggestion.targetLabel}» применён локально. Страница станет truth только после явного сохранения.`);
                  }}
                >
                  Применить патч
                </button>
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      <PageMetadataModal
        open={metadataOpen}
        pageLabel={pageLabel}
        metadata={metadata}
        onClose={() => setMetadataOpen(false)}
        onSave={handleSaveMetadata}
      />

      <MediaPickerModal
        open={pickerFamily === "media"}
        metadata={{
          primaryMediaAssetId: composition.primaryMediaAssetId,
          galleryIds: composition.galleryIds
        }}
        mediaOptions={mediaOptions}
        galleryOptions={relationOptions.galleries}
        onClose={() => setPickerFamily("")}
        onApply={(nextMedia) => {
          applyComposition(nextMedia);
          setPickerFamily("");
        }}
      />

      <EntityPickerModal
        open={pickerFamily === "services"}
        title="Услуги"
        marker="У"
        items={relationOptions.services}
        emptyHint="В реестре услуг пока нет записей для подбора. Сначала заведите услугу, затем вернитесь к странице."
        emptyHref="/admin/entities/service"
        emptyHrefLabel="Открыть реестр услуг"
        selectedIds={composition.serviceIds}
        onClose={() => setPickerFamily("")}
        onApply={(serviceIds) => {
          applyComposition({ serviceIds });
          setPickerFamily("");
        }}
      />

      <EntityPickerModal
        open={pickerFamily === "cases"}
        title="Кейсы"
        marker="К"
        items={relationOptions.cases}
        emptyHint="В реестре кейсов пока нет записей для подбора. Сначала заведите кейс, затем вернитесь к странице."
        emptyHref="/admin/entities/case"
        emptyHrefLabel="Открыть реестр кейсов"
        selectedIds={composition.caseIds}
        onClose={() => setPickerFamily("")}
        onApply={(caseIds) => {
          applyComposition({ caseIds });
          setPickerFamily("");
        }}
      />
    </div>
  );
}
