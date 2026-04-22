"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { PagePreview } from "./PagePreview";
import {
  buildDefaultSectionsForPageType,
  buildPageWorkspaceEmptyState,
  buildPageWorkspaceFullInput,
  buildPageWorkspacePreviewPayload,
  getRequiredSectionTypes,
  PAGE_SECTION_LABELS,
  PAGE_TYPE_LABELS
} from "../../lib/admin/page-workspace.js";
import {
  getPageThemeFieldHint,
  getPageWorkspaceVisualSettingsHint,
  getPrimarySourceEmptyState,
  getSourceChecklistEmptyState
} from "../../lib/admin/page-workspace-copy.js";
import {
  formatPreviewViewportWidth,
  PREVIEW_VIEWPORT_OPTIONS,
  getPreviewViewportOption
} from "../../lib/admin/preview-viewport.js";
import { serializePagePreviewLookupRecords } from "../../lib/admin/page-preview.js";
import {
  PAGE_SECTION_TYPES,
  PAGE_TYPES
} from "../../lib/content-core/content-types.js";
import {
  arePageMediaSettingsEqual,
  getDefaultPageMediaSettings,
  PAGE_MEDIA_GALLERY_ASPECT_RATIO_LABELS,
  PAGE_MEDIA_GALLERY_ASPECT_RATIOS,
  PAGE_MEDIA_GALLERY_GROUPING_LABELS,
  PAGE_MEDIA_GALLERY_GROUPINGS,
  PAGE_MEDIA_GALLERY_LAYOUT_LABELS,
  PAGE_MEDIA_GALLERY_LAYOUTS,
  PAGE_MEDIA_HERO_LAYOUT_LABELS,
  PAGE_MEDIA_HERO_LAYOUTS
} from "../../lib/content-core/page-media.js";
import { LANDING_PAGE_THEME_REGISTRY } from "../../lib/landing-composition/visual-semantics.js";
import { getWorkspaceQuestionHint } from "../../lib/admin/question-model.js";
import { getOwnerApprovalStatusLabel, getRevisionStateLabel, normalizeLegacyCopy } from "../../lib/ui-copy.js";
import {
  getLivePublicationStatusModel,
  getPublishActionCopy,
  getWorkingRevisionStatusModel
} from "../../lib/admin/workflow-status.js";
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

function buildPresenceAudit(label, isReady, readyText, missingText, fallbackTone = "warning") {
  return {
    label,
    tone: isReady ? "healthy" : fallbackTone,
    detail: isReady ? readyText : missingText
  };
}

function buildLengthAudit(label, value, { min = 1, max = Infinity, emptyText, shortText, longText }) {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    return {
      label,
      tone: "warning",
      detail: emptyText
    };
  }

  if (normalized.length < min) {
    return {
      label,
      tone: "warning",
      detail: `${shortText} · ${normalized.length} симв.`
    };
  }

  if (normalized.length > max) {
    return {
      label,
      tone: "warning",
      detail: `${longText} · ${normalized.length} симв.`
    };
  }

  return {
    label,
    tone: "healthy",
    detail: `${normalized.length} симв.`
  };
}

const DEFAULT_PREVIEW_ZOOM_BY_DEVICE = Object.freeze({
  desktop: 0.7,
  tablet: 0.82,
  mobile: 1
});

function cloneSections(sections = []) {
  return sections.map((section) => ({ ...section }));
}

function normalizeSectionsForType(pageType, sections) {
  const current = cloneSections(sections);
  const required = buildDefaultSectionsForPageType(pageType);
  const byType = new Map(current.map((section) => [section.type, section]));
  const result = [];

  for (const template of required) {
    result.push({
      ...template,
      ...(byType.get(template.type) || {}),
      type: template.type
    });
  }

  return result.map((section, index) => ({
    ...section,
    order: index
  }));
}

function updateSectionList(sections = [], type, patch) {
  return sections.map((section) => (
    section.type === type
      ? { ...section, ...patch }
      : section
  ));
}

function moveSection(sections = [], type, direction) {
  const index = sections.findIndex((section) => section.type === type);

  if (index < 0) {
    return sections;
  }

  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= sections.length) {
    return sections;
  }

  const next = [...sections];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);

  return next.map((section, currentIndex) => ({
    ...section,
    order: currentIndex
  }));
}

function getMediaRecommendationSummary(pageType) {
  if (pageType === PAGE_TYPES.SERVICE_LANDING) {
    return "Раздельная обложка, ровная доказательная галерея и группировка по коллекциям.";
  }

  if (pageType === PAGE_TYPES.EQUIPMENT_LANDING) {
    return "Крупный главный кадр, один ведущий фотоакцент и поддерживающие галереи по коллекциям.";
  }

  if (pageType === PAGE_TYPES.CONTACTS) {
    return "Спокойная подача без визуального перегруза: базовый главный блок и вторичная лента фотографий.";
  }

  return "Баланс текста и визуала: раздельная обложка, акцентный первый кадр и галереи по коллекциям.";
}

function SourceChecklistLegacy({ title, items, selectedIds, onToggle, emptyState = null }) {
  return (
    <div className={styles.selectedStack}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {items.length === 0 ? <p className={styles.inlineHint}>Пока нет доступных записей.</p> : null}
      {items.map((item) => (
        <label key={item.id} className={styles.selectedItem}>
          <div className={styles.selectedMain}>
            <strong>{item.label}</strong>
            <p className={styles.selectedMeta}>{item.meta || item.subtitle || ""}</p>
          </div>
          <input
            type="checkbox"
            checked={selectedIds.includes(item.id)}
            onChange={() => onToggle(item.id)}
          />
        </label>
      ))}
    </div>
  );
}

function RichSourceChecklist({ title, items, selectedIds, onToggle, emptyState = null }) {
  return (
    <div className={styles.selectedStack}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {items.length === 0 ? (
        <p className={styles.inlineHint}>
          {emptyState?.text || "Пока нет доступных записей."}{" "}
          {emptyState?.href ? (
            <Link href={emptyState.href} className={styles.inlineLink}>
              {emptyState.linkLabel}
            </Link>
          ) : null}
        </p>
      ) : null}
      {items.map((item) => (
        <label key={item.id} className={styles.selectedItem}>
          <div className={styles.selectedMain}>
            <strong>{item.label}</strong>
            <p className={styles.selectedMeta}>{item.meta || item.subtitle || ""}</p>
          </div>
          <input
            type="checkbox"
            checked={selectedIds.includes(item.id)}
            onChange={() => onToggle(item.id)}
          />
        </label>
      ))}
    </div>
  );
}

function getPickerSearchValue(item) {
  return [
    item.label,
    item.title,
    item.meta,
    item.subtitle,
    item.alt,
    item.slug
  ].filter(Boolean).join(" ").toLowerCase();
}

function SourcePickerModal({
  open,
  title,
  legend,
  items,
  query,
  onQueryChange,
  selectedIds,
  onToggle,
  onClose,
  emptyState = null,
  selectionMode = "single",
  onClear = null,
  clearLabel = "Очистить выбор"
}) {
  if (!open) {
    return null;
  }

  const filteredItems = items.filter((item) => getPickerSearchValue(item).includes(query.trim().toLowerCase()));

  return (
    <>
      <button type="button" className={styles.pickerOverlay} aria-label="Закрыть выбор источника" onClick={onClose} />
      <section className={styles.pickerCard} role="dialog" aria-modal="true" aria-labelledby="workspace-picker-title">
        <header className={styles.pickerHead}>
          <div>
            <p className={styles.eyebrow}>Подбор источника</p>
            <h2 id="workspace-picker-title" className={styles.pickerTitle}>{title}</h2>
            <p className={styles.pickerLegend}>{legend}</p>
          </div>
          <button type="button" className={adminStyles.secondaryButton} onClick={onClose}>
            Закрыть
          </button>
        </header>

        <div className={styles.pickerSearch}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Поиск внутри выбора</span>
            <input
              className={styles.input}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Название, slug, подпись"
            />
          </label>
        </div>

        <div className={styles.pickerBody}>
          {filteredItems.length === 0 ? (
            <div className={styles.pickerEmpty}>
              <p className={styles.pickerLegend}>
                {emptyState?.text || "Под эти условия ничего не найдено."}{" "}
                {emptyState?.href ? (
                  <Link href={emptyState.href} className={styles.inlineLink}>
                    {emptyState.linkLabel}
                  </Link>
                ) : null}
              </p>
            </div>
          ) : (
            <div className={styles.pickerList}>
              {filteredItems.map((item) => {
                const selected = selectedIds.includes(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.pickerItem} ${selected ? styles.pickerItemSelected : ""}`}
                    onClick={() => onToggle(item.id)}
                  >
                    <div className={styles.pickerMarker}>
                      {item.previewUrl ? <img src={item.previewUrl} alt={item.alt || item.label || item.title || "Предпросмотр"} className={styles.pickerThumb} /> : (item.marker || item.label || item.title || "?").slice(0, 1)}
                    </div>
                    <div className={styles.pickerMain}>
                      <strong>{item.label || item.title || item.id}</strong>
                      <p className={styles.selectedMeta}>{item.meta || item.subtitle || item.slug || ""}</p>
                    </div>
                    <span className={styles.pickerSelection}>
                      {selectionMode === "single" ? (selected ? "Выбрано" : "Выбрать") : (selected ? "Подключено" : "Подключить")}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <footer className={styles.pickerFoot}>
          {onClear ? (
            <button type="button" className={styles.ghostButton} onClick={onClear}>
              {clearLabel}
            </button>
          ) : <span className={styles.pickerLegend}>Выбор применяется сразу и остается в черновике до сохранения страницы.</span>}
          <button type="button" className={adminStyles.secondaryButton} onClick={onClose}>
            Готово
          </button>
        </footer>
      </section>
    </>
  );
}

function renderSectionEditor(section, onChange) {
  switch (section.type) {
    case PAGE_SECTION_TYPES.HERO_OFFER:
      return (
        <div className={styles.fieldGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Подпись к кнопке на первом экране</span>
            <input className={styles.input} value={section.ctaLabel || ""} onChange={(event) => onChange({ ctaLabel: event.target.value })} />
          </label>
          <label className={`${styles.field} ${styles.fieldWide}`}>
            <span className={styles.fieldLabel}>Доверительный акцент</span>
            <textarea className={styles.textarea} value={section.trustText || ""} onChange={(event) => onChange({ trustText: event.target.value })} />
          </label>
        </div>
      );
    case PAGE_SECTION_TYPES.EQUIPMENT_SPECS:
      return (
        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span className={styles.fieldLabel}>Характеристики</span>
          <textarea
            className={styles.textarea}
            value={(section.items || []).join("\n")}
            onChange={(event) => onChange({
              items: event.target.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
            })}
          />
        </label>
      );
    case PAGE_SECTION_TYPES.PROOF_CASES:
      return (
        <p className={styles.inlineHint}>Кейсы и галереи управляются в колонке «Источники» и автоматически попадают в этот блок.</p>
      );
    default:
      return (
        <div className={styles.fieldGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Заголовок секции</span>
            <input className={styles.input} value={section.title || ""} onChange={(event) => onChange({ title: event.target.value })} />
          </label>
          <label className={`${styles.field} ${styles.fieldWide}`}>
            <span className={styles.fieldLabel}>Текст секции</span>
            <textarea className={styles.textarea} value={section.body || ""} onChange={(event) => onChange({ body: event.target.value })} />
          </label>
          {section.type === PAGE_SECTION_TYPES.CTA ? (
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Подпись кнопки</span>
              <input className={styles.input} value={section.ctaLabel || ""} onChange={(event) => onChange({ ctaLabel: event.target.value })} />
            </label>
          ) : null}
        </div>
      );
  }
}

export function PageWorkspaceScreen({
  pageId,
  pageLabel,
  initialBaseValue,
  initialComposition,
  initialMetadata,
  initialRevision,
  reviewHref,
  publishHref,
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
  const [composition, setComposition] = useState(() => ({
    ...initialComposition,
    sections: normalizeSectionsForType(initialMetadata.pageType, initialComposition.sections)
  }));
  const [savedComposition, setSavedComposition] = useState(() => ({
    ...initialComposition,
    sections: normalizeSectionsForType(initialMetadata.pageType, initialComposition.sections)
  }));
  const [metadata, setMetadata] = useState(initialMetadata);
  const [savedMetadata, setSavedMetadata] = useState(initialMetadata);
  const [revision, setRevision] = useState(initialRevision);
  const [currentReviewHref, setCurrentReviewHref] = useState(reviewHref);
  const [saveBusy, setSaveBusy] = useState(false);
  const [status, setStatus] = useState(initialMessage);
  const [error, setError] = useState(initialError);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [metadataBusy, setMetadataBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [previewZoomByDevice, setPreviewZoomByDevice] = useState(() => ({
    ...DEFAULT_PREVIEW_ZOOM_BY_DEVICE
  }));
  const [currentSignal, setCurrentSignal] = useState({
    label: signalLabel,
    tone: signalTone,
    reason: signalReason
  });
  const [lifecycleState, setLifecycleState] = useState(lifecycle);
  const [lifecycleBusy, setLifecycleBusy] = useState("");
  const [activePicker, setActivePicker] = useState("");
  const [pickerQuery, setPickerQuery] = useState("");
  const previewDialogRef = useRef(null);
  const previousPageTypeRef = useRef(initialMetadata.pageType);
  const draftMediaRecords = useMemo(
    () => Object.fromEntries(mediaOptions.map((item) => [item.id, item])),
    [mediaOptions]
  );
  const previewLookupRecords = useMemo(
    () => serializePagePreviewLookupRecords({
      publishedLookupRecords,
      media: draftMediaRecords
    }),
    [draftMediaRecords, publishedLookupRecords]
  );

  useEffect(() => {
    setComposition((current) => ({
      ...current,
      sections: normalizeSectionsForType(metadata.pageType, current.sections),
      mediaSettings: previousPageTypeRef.current !== metadata.pageType
        && arePageMediaSettingsEqual(current.mediaSettings, getDefaultPageMediaSettings(previousPageTypeRef.current))
        ? getDefaultPageMediaSettings(metadata.pageType)
        : current.mediaSettings
    }));
    previousPageTypeRef.current = metadata.pageType;
  }, [metadata.pageType]);

  useEffect(() => {
    if (!previewOpen) {
      return undefined;
    }

    const focusDialog = window.requestAnimationFrame(() => {
      previewDialogRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setPreviewOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusDialog);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewOpen]);

  useEffect(() => {
    if (!activePicker) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setActivePicker("");
      }
    };

    setPickerQuery("");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePicker]);

  const previewPayload = useMemo(
    () => buildPageWorkspacePreviewPayload({ baseValue, composition, metadata }),
    [baseValue, composition, metadata]
  );
  const emptyState = useMemo(
    () => buildPageWorkspaceEmptyState(composition),
    [composition]
  );
  const compositionDirty = JSON.stringify(composition) !== JSON.stringify(savedComposition);
  const metadataDirty = JSON.stringify(metadata) !== JSON.stringify(savedMetadata);
  const heroMedia = mediaOptions.find((item) => item.id === composition.primaryMediaAssetId) || null;
  const serviceItems = relationOptions.services || [];
  const equipmentItems = relationOptions.equipment || [];
  const caseItems = relationOptions.cases || [];
  const galleryItems = relationOptions.galleries || [];
  const canSaveFirstDraft = Boolean(composition.title.trim()) && Boolean(composition.h1.trim());
  const requiredSectionTypes = getRequiredSectionTypes(metadata.pageType);
  const serviceEmptyState = getPrimarySourceEmptyState("service");
  const equipmentEmptyState = getPrimarySourceEmptyState("equipment");
  const mediaEmptyState = getPrimarySourceEmptyState("media");
  const caseEmptyState = getSourceChecklistEmptyState("cases");
  const galleryEmptyState = getSourceChecklistEmptyState("galleries");
  const previewOption = useMemo(() => getPreviewViewportOption(previewDevice), [previewDevice]);
  const previewZoom = previewZoomByDevice[previewDevice] || DEFAULT_PREVIEW_ZOOM_BY_DEVICE[previewDevice] || 1;
  const themeDefinition = LANDING_PAGE_THEME_REGISTRY[metadata.pageThemeKey] || LANDING_PAGE_THEME_REGISTRY.earth_sand;
  const themeDirty = metadata.pageThemeKey !== savedMetadata.pageThemeKey;
  const revisionStateLabel = revision ? getRevisionStateLabel(revision.state) : "Черновика пока нет";
  const ownerApprovalTone = revision?.ownerApprovalStatus === "approved"
    ? "healthy"
    : revision?.ownerApprovalStatus === "pending"
      ? "warning"
      : revision?.ownerApprovalStatus === "rejected"
        ? "danger"
        : "unknown";
  const ownerApprovalLabel = revision?.ownerReviewRequired
    ? getOwnerApprovalStatusLabel(revision.ownerApprovalStatus)
    : "Согласование не требуется";
  const ownerApprovalPending = Boolean(revision?.ownerReviewRequired && revision.ownerApprovalStatus === "pending");
  const canOpenPublishReadiness = Boolean(publishHref && revision?.state === "review");
  const activePublishedRevision = lifecycleState?.hasLivePublishedRevision
    ? {
      id: revision?.state === "published" ? revision.id : "__live__",
      revisionNumber: revision?.state === "published" ? revision.revisionNumber : null
    }
    : null;
  const workflowStatus = getWorkingRevisionStatusModel({ currentRevision: revision, activePublishedRevision });
  const liveStatus = getLivePublicationStatusModel({ currentRevision: revision, activePublishedRevision });
  const publishAction = getPublishActionCopy({ activePublishedRevision });
  const recommendedMediaSettings = useMemo(() => getDefaultPageMediaSettings(metadata.pageType), [metadata.pageType]);
  const usingRecommendedMediaSettings = useMemo(
    () => arePageMediaSettingsEqual(composition.mediaSettings, recommendedMediaSettings),
    [composition.mediaSettings, recommendedMediaSettings]
  );
  const mediaRecommendationSummary = useMemo(() => getMediaRecommendationSummary(metadata.pageType), [metadata.pageType]);
  const primaryService = serviceItems.find((item) => item.id === composition.sourceRefs.primaryServiceId) || null;
  const primaryEquipment = equipmentItems.find((item) => item.id === composition.sourceRefs.primaryEquipmentId) || null;
  const selectedCaseItems = caseItems.filter((item) => (composition.sourceRefs.caseIds || []).includes(item.id));
  const selectedGalleryItems = galleryItems.filter((item) => (composition.sourceRefs.galleryIds || []).includes(item.id));
  const pageStatusItems = useMemo(() => ([
    {
      label: "Рабочий статус",
      tone: workflowStatus.tone,
      detail: workflowStatus.label
    },
    {
      label: "Публикация",
      tone: liveStatus.tone,
      detail: liveStatus.label
    },
    {
      label: "Версия",
      tone: revision ? "healthy" : "warning",
      detail: revision ? `Версия №${revision.revisionNumber} · ${revisionStateLabel}` : "Черновик ещё не сохранён"
    },
    {
      label: "Согласование",
      tone: revision?.ownerReviewRequired ? ownerApprovalTone : "unknown",
      detail: ownerApprovalLabel
    },
    {
      label: "Готовность контента",
      tone: currentSignal.tone || "unknown",
      detail: currentSignal.label || "Статус пока не определён"
    },
    {
      label: "Изменения",
      tone: compositionDirty || metadataDirty ? "warning" : "healthy",
      detail: compositionDirty || metadataDirty ? "Есть несохранённые правки" : "Все изменения сохранены"
    },
    {
      label: "Тип страницы",
      tone: "unknown",
      detail: PAGE_TYPE_LABELS[metadata.pageType] || metadata.pageType
    }
  ]), [
    compositionDirty,
    currentSignal.label,
    currentSignal.tone,
    liveStatus.label,
    liveStatus.tone,
    metadata.pageType,
    metadataDirty,
    ownerApprovalLabel,
    ownerApprovalTone,
    revision,
    revisionStateLabel,
    workflowStatus.label,
    workflowStatus.tone
  ]);
  const seoAuditItems = useMemo(() => ([
    buildPresenceAudit(
      "Короткий адрес",
      Boolean(metadata.slug.trim()),
      `/${metadata.slug.trim()}`,
      "Маршрут не задан"
    ),
    buildLengthAudit("Основной заголовок", composition.h1, {
      min: 10,
      max: 90,
      emptyText: "Основной заголовок не заполнен",
      shortText: "Основной заголовок слишком короткий",
      longText: "Основной заголовок слишком длинный"
    }),
    buildLengthAudit("Заголовок для поиска", metadata.seo?.metaTitle || "", {
      min: 35,
      max: 65,
      emptyText: "Заголовок для поиска не заполнен",
      shortText: "Заголовок для поиска короткий",
      longText: "Заголовок для поиска длинный"
    }),
    buildLengthAudit("Описание для поиска", metadata.seo?.metaDescription || "", {
      min: 80,
      max: 170,
      emptyText: "Описание для поиска не заполнено",
      shortText: "Описание для поиска короткое",
      longText: "Описание для поиска длинное"
    }),
    buildPresenceAudit(
      "Главное медиа",
      Boolean(heroMedia),
      heroMedia?.title || "Выбрано",
      "Главное медиа не выбрано"
    )
  ]), [composition.h1, heroMedia, metadata.seo?.metaDescription, metadata.seo?.metaTitle, metadata.slug]);
  const contentAuditItems = useMemo(() => ([
    buildPresenceAudit("Название страницы", emptyState.titleReady, "Название заполнено", "Добавьте название страницы"),
    buildPresenceAudit("Подводка", Boolean(composition.intro.trim()), "Подводка заполнена", "Добавьте подводку"),
    buildPresenceAudit("Главное медиа", emptyState.mediaReady, "Главное медиа выбрано", "Выберите главное медиа"),
    buildPresenceAudit(
      "Источники",
      emptyState.sourceCount > 0,
      `Подключено источников: ${emptyState.sourceCount}`,
      "Источники пока не подключены",
      "unknown"
    ),
    buildPresenceAudit(
      "Секции",
      composition.sections.length >= requiredSectionTypes.length,
      `Секции собраны: ${composition.sections.length}`,
      "Нужно собрать обязательные секции"
    )
  ]), [composition.intro, composition.sections.length, emptyState.mediaReady, emptyState.sourceCount, emptyState.titleReady, requiredSectionTypes.length]);

  const launcherModels = useMemo(() => {
    const items = [];

    if (metadata.pageType === PAGE_TYPES.SERVICE_LANDING) {
      items.push({
        key: "service",
        icon: "У",
        label: "Услуга",
        meta: primaryService ? primaryService.label : (serviceItems.length > 0 ? "Выбрать основу" : "Нет доступных")
      });
    }

    if (metadata.pageType === PAGE_TYPES.EQUIPMENT_LANDING) {
      items.push({
        key: "equipment",
        icon: "Т",
        label: "Техника",
        meta: primaryEquipment ? primaryEquipment.label : (equipmentItems.length > 0 ? "Выбрать основу" : "Нет доступных")
      });
    }

    items.push({
      key: "media",
      icon: "М",
      label: "Медиа",
      meta: heroMedia ? "Обложка выбрана" : (mediaOptions.length > 0 ? "Выбрать обложку" : "Нет доступных")
    });
    items.push({
      key: "cases",
      icon: "К",
      label: "Кейсы",
      meta: selectedCaseItems.length > 0 ? `Подключено: ${selectedCaseItems.length}` : "Подобрать кейсы"
    });
    items.push({
      key: "galleries",
      icon: "Г",
      label: "Галереи",
      meta: selectedGalleryItems.length > 0 ? `Подключено: ${selectedGalleryItems.length}` : "Подобрать галереи"
    });

    return items;
  }, [equipmentItems.length, heroMedia, mediaOptions.length, metadata.pageType, primaryEquipment, primaryService, selectedCaseItems.length, selectedGalleryItems.length, serviceItems.length]);
  const pickerModel = useMemo(() => {
    switch (activePicker) {
      case "service":
        return {
          title: "Основная услуга",
          legend: "Выберите одну услугу, которая будет основой этой страницы. Остальные связи остаются в кейсах и галереях.",
          items: serviceItems.map((item) => ({ ...item, marker: "У" })),
          selectedIds: composition.sourceRefs.primaryServiceId ? [composition.sourceRefs.primaryServiceId] : [],
          selectionMode: "single",
          emptyState: serviceEmptyState,
          onToggle: (id) => {
            setComposition((current) => ({
              ...current,
              sourceRefs: {
                ...current.sourceRefs,
                primaryServiceId: current.sourceRefs.primaryServiceId === id ? "" : id
              }
            }));
          },
          onClear: () => {
            setComposition((current) => ({
              ...current,
              sourceRefs: {
                ...current.sourceRefs,
                primaryServiceId: ""
              }
            }));
          }
        };
      case "equipment":
        return {
          title: "Основная техника",
          legend: "Выберите одну карточку техники как основу страницы. Технические подробности и медиа потом дополняются в рабочем полотне.",
          items: equipmentItems.map((item) => ({ ...item, marker: "Т" })),
          selectedIds: composition.sourceRefs.primaryEquipmentId ? [composition.sourceRefs.primaryEquipmentId] : [],
          selectionMode: "single",
          emptyState: equipmentEmptyState,
          onToggle: (id) => {
            setComposition((current) => ({
              ...current,
              sourceRefs: {
                ...current.sourceRefs,
                primaryEquipmentId: current.sourceRefs.primaryEquipmentId === id ? "" : id
              }
            }));
          },
          onClear: () => {
            setComposition((current) => ({
              ...current,
              sourceRefs: {
                ...current.sourceRefs,
                primaryEquipmentId: ""
              }
            }));
          }
        };
      case "media":
        return {
          title: "Главное медиа",
          legend: "Здесь выбирается обложка страницы и главное изображение для публичного превью.",
          items: mediaOptions.map((item) => ({ ...item, label: item.title || item.id, meta: item.alt || "Без описания", marker: "М" })),
          selectedIds: composition.primaryMediaAssetId ? [composition.primaryMediaAssetId] : [],
          selectionMode: "single",
          emptyState: mediaEmptyState,
          onToggle: (id) => {
            setComposition((current) => ({
              ...current,
              primaryMediaAssetId: current.primaryMediaAssetId === id ? "" : id
            }));
          },
          onClear: () => {
            setComposition((current) => ({
              ...current,
              primaryMediaAssetId: ""
            }));
          }
        };
      case "cases":
        return {
          title: "Кейсы",
          legend: "Подключите доказательства и реальные сценарии работ. Они попадут в proof-блок страницы.",
          items: caseItems.map((item) => ({ ...item, marker: "К" })),
          selectedIds: composition.sourceRefs.caseIds || [],
          selectionMode: "multiple",
          emptyState: caseEmptyState,
          onToggle: (id) => toggleRelation("caseIds", id)
        };
      case "galleries":
        return {
          title: "Галереи",
          legend: "Подберите галереи с фотографиями и визуальным подтверждением. Они появятся в proof-блоке рядом с кейсами.",
          items: galleryItems.map((item) => ({ ...item, marker: "Г" })),
          selectedIds: composition.sourceRefs.galleryIds || [],
          selectionMode: "multiple",
          emptyState: galleryEmptyState,
          onToggle: (id) => toggleRelation("galleryIds", id)
        };
      default:
        return null;
    }
  }, [activePicker, caseEmptyState, caseItems, composition.primaryMediaAssetId, composition.sourceRefs.caseIds, composition.sourceRefs.galleryIds, composition.sourceRefs.primaryEquipmentId, composition.sourceRefs.primaryServiceId, equipmentEmptyState, equipmentItems, galleryEmptyState, galleryItems, mediaEmptyState, mediaOptions, serviceEmptyState, serviceItems]);

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
      const nextComposition = {
        ...(result.composition || composition),
        sections: normalizeSectionsForType((result.metadata || metadata).pageType, (result.composition || composition).sections)
      };
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
      setStatus(result.message || "Черновик страницы сохранен.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaveBusy(false);
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
    setComposition((current) => ({
      ...current,
      sections: normalizeSectionsForType(appliedMetadata.pageType, current.sections)
    }));
    setSavedComposition((current) => ({
      ...current,
      sections: normalizeSectionsForType(appliedMetadata.pageType, current.sections)
    }));
    setBaseValue((current) => buildPageWorkspaceFullInput({
      baseValue: current,
      composition,
      metadata: appliedMetadata
    }));
    setRevision(result.revision || revision);

    return result;
  };

  const handleOpenPreview = (device) => {
    setPreviewDevice(device);
    setPreviewOpen(true);
  };

  const handlePreviewZoomChange = (nextZoom) => {
    setPreviewZoomByDevice((current) => ({
      ...current,
      [previewDevice]: nextZoom
    }));
  };

  const handleThemeChange = (nextThemeKey) => {
    setMetadata((current) => ({
      ...current,
      pageThemeKey: nextThemeKey
    }));
  };

  const handleSaveTheme = async () => {
    if (!themeDirty) {
      return;
    }

    setMetadataBusy(true);
    setError("");
    setStatus("");

    try {
      const result = await handleSaveMetadata(metadata);
      setStatus(result?.message || "Тема страницы сохранена.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setMetadataBusy(false);
    }
  };

  const handleSendToReview = async () => {
    if (compositionDirty) {
      setError("Сначала сохраните изменения рабочего полотна, а потом отправляйте страницу на проверку.");
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

  const handleArchivePage = async () => {
    if (!lifecycleState?.canArchive || lifecycleBusy) {
      return;
    }

    if (!window.confirm("Снять страницу с публикации? История сохранится.")) {
      return;
    }

    setLifecycleBusy("archive");
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
        label: "Вне публикации",
        tone: "warning",
        reason: "Страница снята с публикации и остается доступной в редакторе."
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

  const toggleRelation = (field, id) => {
    setComposition((current) => ({
      ...current,
      sourceRefs: {
        ...current.sourceRefs,
        [field]: current.sourceRefs[field].includes(id)
          ? current.sourceRefs[field].filter((item) => item !== id)
          : [...current.sourceRefs[field], id]
      },
      sections: updateSectionList(current.sections, PAGE_SECTION_TYPES.PROOF_CASES, {
        [field]: current.sourceRefs[field].includes(id)
          ? current.sourceRefs[field].filter((item) => item !== id)
          : [...current.sourceRefs[field], id]
      })
    }));
  };

  return (
    <div className={styles.workspace}>
      <section className={styles.header}>
        <div className={styles.headerMain}>
          <p className={styles.eyebrow}>Страницы · единый рабочий экран</p>
          <h1 className={styles.title}>{pageLabel}</h1>
          <p className={styles.meta}>
            Страница собирается из готовых сущностей в этом же экране: без второго редактора и без свободного конструктора.
          </p>
          <div className={styles.statusRow}>
            <span className={`${styles.badge} ${toneClassName(workflowStatus.tone)}`}>{workflowStatus.label}</span>
            <span className={`${styles.badge} ${toneClassName(liveStatus.tone)}`}>{liveStatus.label}</span>
            <span className={`${styles.badge} ${styles.toneunknown}`}>{revision ? `Версия №${revision.revisionNumber} · ${revisionStateLabel}` : "Черновика пока нет"}</span>
            <span className={`${styles.badge} ${styles.toneunknown}`}>{PAGE_TYPE_LABELS[metadata.pageType] || metadata.pageType}</span>
            {revision?.ownerReviewRequired ? (
              <span className={`${styles.badge} ${toneClassName(ownerApprovalTone)}`}>{ownerApprovalLabel}</span>
            ) : null}
            {compositionDirty ? <span className={`${styles.badge} ${styles.tonewarning}`}>Есть несохраненные изменения</span> : null}
            {metadataDirty ? <span className={`${styles.badge} ${styles.tonewarning}`}>Есть несохраненные метаданные</span> : null}
          </div>
          <p className={styles.metaCompact}>{workflowStatus.description}</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.headerPrimaryActions}>
            <button
              type="button"
              className={adminStyles.primaryButton}
              onClick={handleSaveComposition}
              disabled={saveBusy || (emptyState.isEmptyWorkspace && !canSaveFirstDraft)}
            >
              {saveBusy ? "Сохраняем..." : "Сохранить страницу"}
            </button>
            <button type="button" className={adminStyles.secondaryButton} onClick={handleSendToReview} disabled={saveBusy || Boolean(lifecycleBusy) || !revision}>
              Передать на проверку
            </button>
            {canOpenPublishReadiness ? <Link href={publishHref} className={adminStyles.primaryButton}>{publishAction.label}</Link> : null}
            <button type="button" className={adminStyles.secondaryButton} onClick={() => handleOpenPreview(previewDevice)}>
              Превью
            </button>
          </div>
          <details className={`${adminStyles.compactDisclosure} ${styles.headerServiceDisclosure}`}>
            <summary className={adminStyles.compactDisclosureSummary}>
              <div className={adminStyles.compactDisclosureSummaryMain}>
                <strong>Служебные действия</strong>
                <span className={adminStyles.compactDisclosureSummaryMeta}>
                  Метаданные, история и жизненный цикл остаются доступны, но не перегружают основной поток сборки.
                </span>
              </div>
              <span className={adminStyles.compactDisclosureMarker} aria-hidden="true" />
            </summary>
            <div className={`${adminStyles.compactDisclosureBody} ${styles.headerServiceBody}`}>
              <div className={styles.headerServiceActions}>
                <button type="button" className={adminStyles.secondaryButton} onClick={() => setMetadataOpen(true)} disabled={metadataBusy}>
                  Метаданные
                </button>
                {historyHref ? <Link href={historyHref} className={adminStyles.secondaryButton}>История</Link> : null}
                {currentReviewHref ? <Link href={currentReviewHref} className={adminStyles.secondaryButton}>Проверка</Link> : null}
                {revision?.state === "review" && ownerApprovalPending ? (
                  <button type="button" className={adminStyles.secondaryButton} disabled>
                    Ждет согласования
                  </button>
                ) : null}
                {lifecycleState?.canArchive ? (
                  <button type="button" className={adminStyles.secondaryButton} onClick={handleArchivePage} disabled={Boolean(lifecycleBusy)}>
                    {lifecycleBusy === "archive" ? "Снимаем..." : "Снять с публикации"}
                  </button>
                ) : null}
                {lifecycleState?.canDelete ? (
                  <button type="button" className={adminStyles.secondaryButton} onClick={handleDeletePage} disabled={Boolean(lifecycleBusy)}>
                    {lifecycleBusy === "delete" ? "Удаляем..." : "Удалить страницу"}
                  </button>
                ) : null}
              </div>
              <p className={styles.headerServiceNote}>
                Редкие и инженерные действия вынесены отдельно: рабочее полотно остается про сборку страницы, а не про обслуживание.
              </p>
            </div>
          </details>
        </div>
      </section>

      {error ? <div className={adminStyles.statusPanelBlocking}>{normalizeLegacyCopy(error)}</div> : null}
      {status ? <div className={adminStyles.statusPanelInfo}>{normalizeLegacyCopy(status)}</div> : null}

      <div className={styles.shell}>
        <aside className={styles.rail} data-layout-zone="sources">
          <h2 className={styles.railTitle}>Источники</h2>
          <p className={styles.inlineHint}>{getWorkspaceQuestionHint("sources")}</p>
          <div className={styles.launcherGrid}>
            {launcherModels.map((launcher) => (
              <button
                key={launcher.key}
                type="button"
                className={styles.launcher}
                onClick={() => setActivePicker(launcher.key)}
              >
                <span className={styles.launcherIcon}>{launcher.icon}</span>
                <span className={styles.launcherLabel}>{launcher.label}</span>
                <span className={styles.launcherMeta}>{launcher.meta}</span>
              </button>
            ))}
          </div>

          <div className={styles.selectedStack}>
            {primaryService ? (
              <div className={styles.selectedItem}>
                <div className={styles.selectedFallback}>У</div>
                <div className={styles.selectedMain}>
                  <strong>{primaryService.label}</strong>
                  <p className={styles.selectedMeta}>{primaryService.meta || "Основная услуга страницы"}</p>
                </div>
              </div>
            ) : null}
            {primaryEquipment ? (
              <div className={styles.selectedItem}>
                <div className={styles.selectedFallback}>Т</div>
                <div className={styles.selectedMain}>
                  <strong>{primaryEquipment.label}</strong>
                  <p className={styles.selectedMeta}>{primaryEquipment.meta || "Основная техника страницы"}</p>
                </div>
              </div>
            ) : null}
            {heroMedia ? (
              <div className={styles.selectedItem}>
                {heroMedia.previewUrl ? <img src={heroMedia.previewUrl} alt={heroMedia.title} className={styles.selectedThumb} /> : <div className={styles.selectedFallback}>М</div>}
                <div className={styles.selectedMain}>
                  <strong>{heroMedia.title || heroMedia.id}</strong>
                  <p className={styles.selectedMeta}>{heroMedia.alt || "Главное медиа страницы"}</p>
                </div>
              </div>
            ) : null}
            {selectedCaseItems.length > 0 ? (
              <div className={styles.selectedItem}>
                <div className={styles.selectedFallback}>К</div>
                <div className={styles.selectedMain}>
                  <strong>Кейсы: {selectedCaseItems.length}</strong>
                  <p className={styles.selectedMeta}>{selectedCaseItems.slice(0, 2).map((item) => item.label).join(" · ")}</p>
                </div>
              </div>
            ) : null}
            {selectedGalleryItems.length > 0 ? (
              <div className={styles.selectedItem}>
                <div className={styles.selectedFallback}>Г</div>
                <div className={styles.selectedMain}>
                  <strong>Галереи: {selectedGalleryItems.length}</strong>
                  <p className={styles.selectedMeta}>{selectedGalleryItems.slice(0, 2).map((item) => item.label).join(" · ")}</p>
                </div>
              </div>
            ) : null}
            {!primaryService && !primaryEquipment && !heroMedia && selectedCaseItems.length === 0 && selectedGalleryItems.length === 0 ? (
              <div className={styles.pickerEmpty}>
                <p className={styles.pickerLegend}>Слева остаются только источники и быстрый контекст. Полный выбор открывается в крупных модалках.</p>
              </div>
            ) : null}
          </div>
          {false ? (<>
          {(metadata.pageType === PAGE_TYPES.SERVICE_LANDING) ? (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Основная услуга</span>
              <select
                className={styles.select}
                value={composition.sourceRefs.primaryServiceId || ""}
                onChange={(event) => setComposition((current) => ({
                  ...current,
                  sourceRefs: {
                    ...current.sourceRefs,
                    primaryServiceId: event.target.value
                  }
                }))}
              >
                <option value="">Выберите услугу</option>
                {relationOptions.services.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
              {relationOptions.services.length === 0 ? (
                <p className={styles.inlineHint}>
                  {serviceEmptyState.text}{" "}
                  <Link href={serviceEmptyState.href} className={styles.inlineLink}>
                    {serviceEmptyState.linkLabel}
                  </Link>
                </p>
              ) : null}
            </div>
          ) : null}

          {(metadata.pageType === PAGE_TYPES.EQUIPMENT_LANDING) ? (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Основная техника</span>
              <select
                className={styles.select}
                value={composition.sourceRefs.primaryEquipmentId || ""}
                onChange={(event) => setComposition((current) => ({
                  ...current,
                  sourceRefs: {
                    ...current.sourceRefs,
                    primaryEquipmentId: event.target.value
                  }
                }))}
              >
                <option value="">Выберите технику</option>
                {(relationOptions.equipment || []).map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
              {(relationOptions.equipment || []).length === 0 ? (
                <p className={styles.inlineHint}>
                  {equipmentEmptyState.text}{" "}
                  <Link href={equipmentEmptyState.href} className={styles.inlineLink}>
                    {equipmentEmptyState.linkLabel}
                  </Link>
                </p>
              ) : null}
            </div>
          ) : null}

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Главное медиа</span>
            <select
              className={styles.select}
              value={composition.primaryMediaAssetId || ""}
              onChange={(event) => setComposition((current) => ({
                ...current,
                primaryMediaAssetId: event.target.value
              }))}
            >
              <option value="">Не выбрано</option>
              {mediaOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.title || item.id}</option>
              ))}
            </select>
            {mediaOptions.length === 0 ? (
              <p className={styles.inlineHint}>
                {mediaEmptyState.text}{" "}
                <Link href={mediaEmptyState.href} className={styles.inlineLink}>
                  {mediaEmptyState.linkLabel}
                </Link>
              </p>
            ) : null}
          </label>

          <RichSourceChecklist
            title="Кейсы"
            items={relationOptions.cases}
            selectedIds={composition.sourceRefs.caseIds || []}
            onToggle={(id) => toggleRelation("caseIds", id)}
            emptyState={caseEmptyState}
          />

          <RichSourceChecklist
            title="Галереи"
            items={relationOptions.galleries}
            selectedIds={composition.sourceRefs.galleryIds || []}
            onToggle={(id) => toggleRelation("galleryIds", id)}
            emptyState={galleryEmptyState}
          />

          {heroMedia ? (
            <div className={styles.selectedItem}>
              {heroMedia.previewUrl ? <img src={heroMedia.previewUrl} alt={heroMedia.title} className={styles.selectedThumb} /> : null}
              <div className={styles.selectedMain}>
                <strong>{heroMedia.title || heroMedia.id}</strong>
                <p className={styles.selectedMeta}>{heroMedia.alt || "Главное медиа страницы"}</p>
              </div>
            </div>
          ) : null}
          </>) : null}
        </aside>

        <div className={styles.canvasColumn} data-layout-zone="canvas">
          <div className={styles.canvasTop}>
            <div className={styles.canvasTitleWrap}>
              <p className={styles.eyebrow}>Рабочее полотно</p>
              <h2 className={styles.canvasTitle}>Сборка страницы</h2>
              <p className={styles.canvasLegend}>Секции остаются типовыми и собираются здесь же: после модалок вы возвращаетесь в этот же рабочий экран.</p>
            </div>
          </div>

          <div className={styles.canvas}>
            <section className={styles.sectionCard}>
              <div className={styles.sectionHead}>
                <div>
                  <h3 className={styles.sectionTitle}>Основа страницы</h3>
                  <p className={styles.sectionMeta}>Название, H1 и подводка задаются прямо на странице для всех типов.</p>
                </div>
              </div>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Название страницы</span>
                  <input className={styles.input} value={composition.title} onChange={(event) => setComposition((current) => ({ ...current, title: event.target.value }))} />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>H1</span>
                  <input className={styles.input} value={composition.h1} onChange={(event) => setComposition((current) => ({ ...current, h1: event.target.value }))} />
                </label>
                <label className={`${styles.field} ${styles.fieldWide}`}>
                  <span className={styles.fieldLabel}>Подводка</span>
                  <textarea className={styles.textarea} value={composition.intro} onChange={(event) => setComposition((current) => ({ ...current, intro: event.target.value }))} />
                </label>
              </div>
            </section>

            {(metadata.pageType === PAGE_TYPES.CONTACTS || metadata.pageType === PAGE_TYPES.SERVICE_LANDING || metadata.pageType === PAGE_TYPES.EQUIPMENT_LANDING) ? (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHead}>
                  <div>
                    <h3 className={styles.sectionTitle}>Гео и зона работы</h3>
                    <p className={styles.sectionMeta}>Гео задаётся прямо на странице и не требует отдельного типа.</p>
                  </div>
                </div>
                <div className={styles.fieldGrid}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Гео-метка</span>
                    <input className={styles.input} value={composition.targeting.geoLabel || ""} onChange={(event) => setComposition((current) => ({ ...current, targeting: { ...current.targeting, geoLabel: event.target.value } }))} />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Город</span>
                    <input className={styles.input} value={composition.targeting.city || ""} onChange={(event) => setComposition((current) => ({ ...current, targeting: { ...current.targeting, city: event.target.value } }))} />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Район</span>
                    <input className={styles.input} value={composition.targeting.district || ""} onChange={(event) => setComposition((current) => ({ ...current, targeting: { ...current.targeting, district: event.target.value } }))} />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Зона выезда</span>
                    <input className={styles.input} value={composition.targeting.serviceArea || ""} onChange={(event) => setComposition((current) => ({ ...current, targeting: { ...current.targeting, serviceArea: event.target.value } }))} />
                  </label>
                </div>
              </section>
            ) : null}

            <section className={styles.sectionCard}>
              <div className={styles.sectionHead}>
                <div>
                  <h3 className={styles.sectionTitle}>Медиа-подача</h3>
                  <p className={styles.sectionMeta}>Страница сама задает, насколько крупно показывать главное изображение и как группировать несколько фотографий в галерее.</p>
                  <p className={styles.sectionMeta}>{mediaRecommendationSummary}</p>
                </div>
                <div className={styles.selectedActions}>
                  <button
                    type="button"
                    className={styles.miniButton}
                    onClick={() => setComposition((current) => ({
                      ...current,
                      mediaSettings: recommendedMediaSettings
                    }))}
                    disabled={usingRecommendedMediaSettings}
                  >
                    Рекомендованный пресет
                  </button>
                </div>
              </div>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Главное изображение</span>
                  <select
                    className={styles.select}
                    value={composition.mediaSettings.heroLayout}
                    onChange={(event) => setComposition((current) => ({
                      ...current,
                      mediaSettings: {
                        ...current.mediaSettings,
                        heroLayout: event.target.value
                      }
                    }))}
                  >
                    {PAGE_MEDIA_HERO_LAYOUTS.map((option) => (
                      <option key={option} value={option}>{PAGE_MEDIA_HERO_LAYOUT_LABELS[option]}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Группировка галерей</span>
                  <select
                    className={styles.select}
                    value={composition.mediaSettings.galleryGrouping}
                    onChange={(event) => setComposition((current) => ({
                      ...current,
                      mediaSettings: {
                        ...current.mediaSettings,
                        galleryGrouping: event.target.value
                      }
                    }))}
                  >
                    {PAGE_MEDIA_GALLERY_GROUPINGS.map((option) => (
                      <option key={option} value={option}>{PAGE_MEDIA_GALLERY_GROUPING_LABELS[option]}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Раскладка галереи</span>
                  <select
                    className={styles.select}
                    value={composition.mediaSettings.galleryLayout}
                    onChange={(event) => setComposition((current) => ({
                      ...current,
                      mediaSettings: {
                        ...current.mediaSettings,
                        galleryLayout: event.target.value
                      }
                    }))}
                  >
                    {PAGE_MEDIA_GALLERY_LAYOUTS.map((option) => (
                      <option key={option} value={option}>{PAGE_MEDIA_GALLERY_LAYOUT_LABELS[option]}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Формат карточек</span>
                  <select
                    className={styles.select}
                    value={composition.mediaSettings.galleryAspectRatio}
                    onChange={(event) => setComposition((current) => ({
                      ...current,
                      mediaSettings: {
                        ...current.mediaSettings,
                        galleryAspectRatio: event.target.value
                      }
                    }))}
                  >
                    {PAGE_MEDIA_GALLERY_ASPECT_RATIOS.map((option) => (
                      <option key={option} value={option}>{PAGE_MEDIA_GALLERY_ASPECT_RATIO_LABELS[option]}</option>
                    ))}
                  </select>
                </label>
                <label className={`${styles.field} ${styles.fieldWide}`}>
                  <span className={styles.fieldLabel}>Подписи под фото</span>
                  <button
                    type="button"
                    className={`${styles.booleanToggle} ${composition.mediaSettings.showGalleryCaptions ? styles.booleanToggleActive : ""}`}
                    aria-pressed={composition.mediaSettings.showGalleryCaptions}
                    onClick={() => setComposition((current) => ({
                      ...current,
                      mediaSettings: {
                        ...current.mediaSettings,
                        showGalleryCaptions: !current.mediaSettings.showGalleryCaptions
                      }
                    }))}
                  >
                    {composition.mediaSettings.showGalleryCaptions
                      ? "Подписи включены и помогают раскрывать смысл фотографий"
                      : "Подписи скрыты, галерея работает как чистый визуальный ряд"}
                  </button>
                </label>
              </div>
            </section>

            {composition.sections.map((section, index) => (
              <section key={section.type} className={styles.sectionCard}>
                <div className={styles.sectionHead}>
                  <div>
                    <h3 className={styles.sectionTitle}>{PAGE_SECTION_LABELS[section.type] || section.type}</h3>
                    <p className={styles.sectionMeta}>
                      {requiredSectionTypes.includes(section.type) ? "Обязательная секция" : "Дополнительная секция"}
                    </p>
                  </div>
                  <div className={styles.selectedActions}>
                    <button type="button" className={styles.miniButton} onClick={() => setComposition((current) => ({ ...current, sections: moveSection(current.sections, section.type, -1) }))} disabled={index === 0}>
                      Выше
                    </button>
                    <button type="button" className={styles.miniButton} onClick={() => setComposition((current) => ({ ...current, sections: moveSection(current.sections, section.type, 1) }))} disabled={index === composition.sections.length - 1}>
                      Ниже
                    </button>
                  </div>
                </div>
                {renderSectionEditor(section, (patch) => setComposition((current) => ({
                  ...current,
                  sections: updateSectionList(current.sections, section.type, patch)
                })))}
              </section>
            ))}
          </div>
        </div>

        <section className={`${styles.previewCard} ${adminStyles.stickyPanel}`} data-layout-zone="preview">
          <div className={styles.operatorCard}>
            <div className={styles.sectionHead}>
              <div>
                <h3 className={styles.sectionTitle}>Статус страницы</h3>
                <p className={styles.sectionMeta}>Короткая сводка по публикации, версии и сохранённости изменений.</p>
              </div>
            </div>
            <dl className={styles.auditList}>
              {pageStatusItems.map((item) => (
                <div key={item.label} className={styles.auditRow}>
                  <dt className={styles.auditLabel}>{item.label}</dt>
                  <dd className={styles.auditValue}>
                    <span className={`${styles.auditTonePill} ${toneClassName(item.tone)}`}>{item.detail}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className={styles.operatorNote}>{currentSignal.reason}</p>
          </div>
          <div className={styles.operatorCard}>
            <div className={styles.sectionHead}>
              <div>
                <h3 className={styles.sectionTitle}>Вид и предпросмотр</h3>
                <p className={styles.sectionMeta}>Открывайте страницу в отдельном окне предпросмотра и там же подбирайте тему.</p>
              </div>
            </div>
            {false ? (
            <div className={styles.previewLaunchGrid}>
              {PREVIEW_VIEWPORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={styles.previewLaunchButton}
                  onClick={() => handleOpenPreview(option.value)}
                >
                  <span className={styles.previewLaunchLabel}>{option.label}</span>
                  <span className={styles.previewLaunchMeta}>{option.width} px</span>
                </button>
              ))}
            </div>
            ) : null}
            <div className={styles.operatorInlineMeta}>
              <span className={`${styles.auditTonePill} ${toneClassName(themeDirty ? "warning" : "healthy")}`}>
                {themeDirty ? "Тема не сохранена" : "Тема активна"}
              </span>
              <p className={styles.operatorNote}>Сейчас выбрана тема: {themeDefinition.label}.</p>
              <p className={styles.operatorNote}>{getPageWorkspaceVisualSettingsHint()}</p>
            </div>
            {false && themeDirty ? (
              <button
                type="button"
                className={adminStyles.secondaryButton}
                onClick={handleSaveTheme}
                disabled={metadataBusy}
              >
                {metadataBusy ? "Сохраняем тему..." : "Сохранить тему"}
              </button>
            ) : null}
          </div>

          <div className={styles.operatorCard}>
            <div className={styles.sectionHead}>
              <div>
                <h3 className={styles.sectionTitle}>SEO-контроль</h3>
                <p className={styles.sectionMeta}>Быстрый аудит без открытия полной формы метаданных.</p>
              </div>
            </div>
            <dl className={styles.auditList}>
              {seoAuditItems.map((item) => (
                <div key={item.label} className={styles.auditRow}>
                  <dt className={styles.auditLabel}>{item.label}</dt>
                  <dd className={styles.auditValue}>
                    <span className={`${styles.auditTonePill} ${toneClassName(item.tone)}`}>{item.detail}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className={styles.operatorCard}>
            <div className={styles.sectionHead}>
              <div>
                <h3 className={styles.sectionTitle}>Контентная готовность</h3>
                <p className={styles.sectionMeta}>{getWorkspaceQuestionHint("readiness")}</p>
              </div>
            </div>
            <dl className={styles.auditList}>
              {contentAuditItems.map((item) => (
                <div key={item.label} className={styles.auditRow}>
                  <dt className={styles.auditLabel}>{item.label}</dt>
                  <dd className={styles.auditValue}>
                    <span className={`${styles.auditTonePill} ${toneClassName(item.tone)}`}>{item.detail}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>

      <SourcePickerModal
        open={Boolean(pickerModel)}
        title={pickerModel?.title || ""}
        legend={pickerModel?.legend || ""}
        items={pickerModel?.items || []}
        query={pickerQuery}
        onQueryChange={setPickerQuery}
        selectedIds={pickerModel?.selectedIds || []}
        onToggle={pickerModel?.onToggle || (() => {})}
        onClose={() => setActivePicker("")}
        emptyState={pickerModel?.emptyState || null}
        selectionMode={pickerModel?.selectionMode || "single"}
        onClear={pickerModel?.onClear || null}
      />
      <PageMetadataModal
        open={metadataOpen}
        pageLabel={pageLabel}
        metadata={metadata}
        onClose={() => setMetadataOpen(false)}
        onSave={handleSaveMetadata}
      />
      {previewOpen ? (
        <>
          <button type="button" className={styles.previewModalOverlay} aria-label="Закрыть предпросмотр" onClick={() => setPreviewOpen(false)} />
          <section
            ref={previewDialogRef}
            className={styles.previewModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="page-preview-title"
            tabIndex={-1}
          >
            <header className={styles.previewModalHeader}>
              <div className={styles.previewModalCopy}>
                <p className={styles.eyebrow}>{"\u0412\u0438\u0437\u0443\u0430\u043b\u044c\u043d\u0430\u044f \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0430"}</p>
                <h2 id="page-preview-title" className={styles.previewModalTitle}>{"\u041f\u0440\u0435\u0434\u043f\u0440\u043e\u0441\u043c\u043e\u0442\u0440 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u044b"}</h2>
                <p className={styles.previewModalMeta}>
                  {"\u0421\u0435\u0439\u0447\u0430\u0441 \u043e\u0442\u043a\u0440\u044b\u0442 \u0440\u0435\u0436\u0438\u043c:"} {previewOption.label}. {formatPreviewViewportWidth(previewOption.width)} {"\u00b7 \u043c\u0430\u0441\u0448\u0442\u0430\u0431"} {Math.round(previewZoom * 100)}%. {previewOption.hint}
                </p>
              </div>
              <div className={styles.previewModalControls}>
                <div className={styles.previewModalControlRow}>
                  <div className={adminStyles.previewViewportControls} role="group" aria-label={"\u0420\u0435\u0436\u0438\u043c \u043f\u0440\u0435\u0434\u043f\u0440\u043e\u0441\u043c\u043e\u0442\u0440\u0430"}>
                    {PREVIEW_VIEWPORT_OPTIONS.map((option) => {
                      const className = option.value === previewDevice
                        ? `${adminStyles.previewViewportButton} ${adminStyles.previewViewportButtonActive}`
                        : adminStyles.previewViewportButton;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={className}
                          aria-pressed={option.value === previewDevice}
                          onClick={() => setPreviewDevice(option.value)}
                        >
                          <span className={adminStyles.previewViewportButtonLabel}>{option.label}</span>
                          <span className={adminStyles.previewViewportButtonMeta}>{formatPreviewViewportWidth(option.width)}</span>
                        </button>
                      );
                    })}
                  </div>
                  <label className={`${adminStyles.previewViewportZoom} ${styles.previewModalZoom}`}>
                    <span className={adminStyles.previewViewportZoomLabel}>{"\u041c\u0430\u0441\u0448\u0442\u0430\u0431"}</span>
                    <div className={adminStyles.previewViewportZoomControls}>
                      <input
                        className={adminStyles.previewViewportZoomSlider}
                        type="range"
                        min={previewDevice === "desktop" ? 0.45 : 0.55}
                        max={1}
                        step={0.05}
                        value={previewZoom}
                        onChange={(event) => handlePreviewZoomChange(Number(event.target.value))}
                      />
                      <span className={adminStyles.previewViewportZoomValue}>{Math.round(previewZoom * 100)}%</span>
                    </div>
                  </label>
                </div>
                <label className={styles.previewThemeField}>
                  <span className={styles.previewThemeLabel}>{"\u0422\u0435\u043c\u0430 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u044b"}</span>
                  <select
                    className={styles.previewThemeSelect}
                    value={metadata.pageThemeKey}
                    onChange={(event) => handleThemeChange(event.target.value)}
                  >
                    {Object.entries(LANDING_PAGE_THEME_REGISTRY).map(([key, theme]) => (
                      <option key={key} value={key}>{theme.label}</option>
                    ))}
                  </select>
                </label>
                <div className={styles.previewModalActions}>
                  <button
                    type="button"
                    className={adminStyles.secondaryButton}
                    onClick={handleSaveTheme}
                    disabled={metadataBusy || !themeDirty}
                  >
                    {metadataBusy ? "\u0421\u043e\u0445\u0440\u0430\u043d\u044f\u0435\u043c \u0442\u0435\u043c\u0443..." : "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0442\u0435\u043c\u0443"}
                  </button>
                  <button type="button" className={adminStyles.secondaryButton} onClick={() => setPreviewOpen(false)}>
                    {"\u0417\u0430\u043a\u0440\u044b\u0442\u044c"}
                  </button>
                </div>
              </div>
            </header>
            <div className={styles.previewModalBody}>
              <PreviewViewport
                device={previewDevice}
                zoom={previewZoom}
                minZoom={previewDevice === "desktop" ? 0.45 : 0.55}
                maxZoom={1}
                zoomStep={0.05}
                onDeviceChange={setPreviewDevice}
                onZoomChange={handlePreviewZoomChange}
                showToolbar={false}
                showFrameTop={false}
              >
                {previewPayload ? (
                  <PagePreview
                    page={previewPayload}
                    globalSettings={globalSettings}
                    previewLookupRecords={previewLookupRecords}
                  />
                ) : (
                  <div className={styles.emptyWorkspaceCard}>
                    <h3 className={styles.sectionTitle}>Предпросмотр появится после заполнения основы</h3>
                    <p className={styles.sectionMeta}>Нужны хотя бы название страницы и H1.</p>
                  </div>
                )}
              </PreviewViewport>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
