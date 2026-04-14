"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { StandalonePage } from "../public/PublicRenderers";
import {
  buildDefaultSectionsForPageType,
  buildPageWorkspaceEmptyState,
  buildPageWorkspaceFullInput,
  buildPageWorkspaceLookupResolvers,
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
  PREVIEW_VIEWPORT_OPTIONS,
  getPreviewViewportOption
} from "../../lib/admin/preview-viewport.js";
import {
  PAGE_SECTION_TYPES,
  PAGE_TYPES
} from "../../lib/content-core/content-types.js";
import { LANDING_PAGE_THEME_REGISTRY } from "../../lib/landing-composition/visual-semantics.js";
import { getWorkspaceQuestionHint } from "../../lib/admin/question-model.js";
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

function SourceChecklist({ title, items, selectedIds, onToggle, emptyState = null }) {
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
  const [currentSignal, setCurrentSignal] = useState({
    label: signalLabel,
    tone: signalTone,
    reason: signalReason
  });
  const [lifecycleState, setLifecycleState] = useState(lifecycle);
  const [lifecycleBusy, setLifecycleBusy] = useState("");
  const [lifecycleMenuOpen, setLifecycleMenuOpen] = useState(false);
  const previewDialogRef = useRef(null);
  const lookupResolvers = useMemo(
    () => buildPageWorkspaceLookupResolvers(publishedLookupRecords),
    [publishedLookupRecords]
  );

  useEffect(() => {
    setComposition((current) => ({
      ...current,
      sections: normalizeSectionsForType(metadata.pageType, current.sections)
    }));
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
  const canSaveFirstDraft = Boolean(composition.title.trim()) && Boolean(composition.h1.trim());
  const requiredSectionTypes = getRequiredSectionTypes(metadata.pageType);
  const serviceEmptyState = getPrimarySourceEmptyState("service");
  const equipmentEmptyState = getPrimarySourceEmptyState("equipment");
  const mediaEmptyState = getPrimarySourceEmptyState("media");
  const caseEmptyState = getSourceChecklistEmptyState("cases");
  const galleryEmptyState = getSourceChecklistEmptyState("galleries");
  const previewOption = useMemo(() => getPreviewViewportOption(previewDevice), [previewDevice]);
  const themeDefinition = LANDING_PAGE_THEME_REGISTRY[metadata.pageThemeKey] || LANDING_PAGE_THEME_REGISTRY.earth_sand;
  const themeDirty = metadata.pageThemeKey !== savedMetadata.pageThemeKey;
  const pageStatusItems = useMemo(() => ([
    {
      label: "Состояние",
      tone: currentSignal.tone || "unknown",
      detail: currentSignal.label || "Статус пока не определён"
    },
    {
      label: "Версия",
      tone: revision ? "healthy" : "warning",
      detail: revision ? `Версия №${revision.revisionNumber} · ${revision.state}` : "Черновик ещё не сохранён"
    },
    {
      label: "Тип страницы",
      tone: "unknown",
      detail: PAGE_TYPE_LABELS[metadata.pageType] || metadata.pageType
    },
    {
      label: "Изменения",
      tone: compositionDirty || metadataDirty ? "warning" : "healthy",
      detail: compositionDirty || metadataDirty ? "Есть несохранённые правки" : "Все изменения сохранены"
    },
    {
      label: "Публикация",
      tone: lifecycleState?.hasLivePublishedRevision ? "healthy" : "unknown",
      detail: lifecycleState?.hasLivePublishedRevision ? "Страница опубликована" : "Живой версии пока нет"
    }
  ]), [compositionDirty, currentSignal.label, currentSignal.tone, lifecycleState?.hasLivePublishedRevision, metadata.pageType, metadataDirty, revision]);
  const seoAuditItems = useMemo(() => ([
    buildPresenceAudit(
      "Slug",
      Boolean(metadata.slug.trim()),
      `/${metadata.slug.trim()}`,
      "Маршрут не задан"
    ),
    buildLengthAudit("H1", composition.h1, {
      min: 10,
      max: 90,
      emptyText: "H1 не заполнен",
      shortText: "H1 слишком короткий",
      longText: "H1 слишком длинный"
    }),
    buildLengthAudit("Meta title", metadata.seo?.metaTitle || "", {
      min: 35,
      max: 65,
      emptyText: "Meta title не заполнен",
      shortText: "Meta title короткий",
      longText: "Meta title длинный"
    }),
    buildLengthAudit("Meta description", metadata.seo?.metaDescription || "", {
      min: 80,
      max: 170,
      emptyText: "Meta description не заполнен",
      shortText: "Meta description короткий",
      longText: "Meta description длинный"
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
            Один редактор обслуживает и отдельные страницы, и коммерческие посадки. Тип страницы меняет набор секций, но не уводит в другой экран.
          </p>
          <div className={styles.statusRow}>
            <span className={`${styles.badge} ${toneClassName(currentSignal.tone)}`}>{currentSignal.label}</span>
            <span className={`${styles.badge} ${styles.toneunknown}`}>{revision ? `Версия №${revision.revisionNumber} · ${revision.state}` : "Черновика пока нет"}</span>
            <span className={`${styles.badge} ${styles.toneunknown}`}>{PAGE_TYPE_LABELS[metadata.pageType] || metadata.pageType}</span>
            {lifecycleState?.hasLivePublishedRevision ? (
              <span className={`${styles.badge} ${styles.tonehealthy}`}>В публикации</span>
            ) : null}
            {compositionDirty ? <span className={`${styles.badge} ${styles.tonewarning}`}>Есть несохраненные изменения</span> : null}
            {metadataDirty ? <span className={`${styles.badge} ${styles.tonewarning}`}>Есть несохраненные метаданные</span> : null}
          </div>
          <p className={styles.metaCompact}>{currentSignal.reason}</p>
        </div>
        <div className={styles.headerActions}>
          {lifecycleState?.canArchive || lifecycleState?.canDelete ? (
            <div className={styles.lifecycleWrap}>
              <button
                type="button"
                className={adminStyles.secondaryButton}
                onClick={() => setLifecycleMenuOpen((current) => !current)}
                disabled={Boolean(lifecycleBusy)}
              >
                Жизненный цикл
              </button>
              {lifecycleMenuOpen ? (
                <div className={styles.lifecycleMenu}>
                  {lifecycleState?.canArchive ? (
                    <button type="button" className={styles.lifecycleAction} onClick={handleArchivePage} disabled={Boolean(lifecycleBusy)}>
                      Снять с публикации
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
            disabled={saveBusy || (emptyState.isEmptyWorkspace && !canSaveFirstDraft)}
          >
            {saveBusy ? "Сохраняем..." : "Сохранить страницу"}
          </button>
          <button type="button" className={adminStyles.secondaryButton} onClick={handleSendToReview} disabled={saveBusy || Boolean(lifecycleBusy) || !revision}>
            Передать на проверку
          </button>
        </div>
      </section>

      {error ? <div className={adminStyles.statusPanelBlocking}>{normalizeLegacyCopy(error)}</div> : null}
      {status ? <div className={adminStyles.statusPanelInfo}>{normalizeLegacyCopy(status)}</div> : null}

      <div className={styles.shell}>
        <aside className={styles.rail} data-layout-zone="sources">
          <h2 className={styles.railTitle}>Источники</h2>
          <p className={styles.inlineHint}>{getWorkspaceQuestionHint("sources")}</p>
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
        </aside>

        <div className={styles.canvasColumn} data-layout-zone="canvas">
          <div className={styles.canvasTop}>
            <div className={styles.canvasTitleWrap}>
              <p className={styles.eyebrow}>Рабочее полотно</p>
              <h2 className={styles.canvasTitle}>Сборка страницы</h2>
              <p className={styles.canvasLegend}>Секции остаются структурными и типизированными. Здесь нет второго редактора и нет свободного конструктора.</p>
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
            <div className={styles.quickActions}>
              <button type="button" className={adminStyles.secondaryButton} onClick={() => setMetadataOpen(true)} disabled={metadataBusy}>
                Метаданные
              </button>
              {historyHref ? <Link href={historyHref} className={adminStyles.secondaryButton}>История</Link> : null}
              {currentReviewHref ? <Link href={currentReviewHref} className={adminStyles.secondaryButton}>Проверка</Link> : null}
            </div>
          </div>

          <div className={styles.operatorCard}>
            <div className={styles.sectionHead}>
              <div>
                <h3 className={styles.sectionTitle}>Вид и предпросмотр</h3>
                <p className={styles.sectionMeta}>Открывайте страницу в отдельном окне предпросмотра и там же подбирайте тему.</p>
              </div>
            </div>
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
            <div className={styles.operatorInlineMeta}>
              <span className={`${styles.auditTonePill} ${toneClassName(themeDirty ? "warning" : "healthy")}`}>
                {themeDirty ? "Тема не сохранена" : "Тема активна"}
              </span>
              <p className={styles.operatorNote}>Сейчас выбрана тема: {themeDefinition.label}.</p>
              <p className={styles.operatorNote}>{getPageWorkspaceVisualSettingsHint()}</p>
            </div>
            {themeDirty ? (
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
                <p className={styles.eyebrow}>Визуальная проверка</p>
                <h2 id="page-preview-title" className={styles.previewModalTitle}>Предпросмотр страницы</h2>
                <p className={styles.previewModalMeta}>
                  Сейчас открыт режим: {previewOption.label}. {previewOption.hint}
                </p>
              </div>
              <div className={styles.previewModalControls}>
                <label className={styles.previewThemeField}>
                  <span className={styles.previewThemeLabel}>Тема страницы</span>
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
                    {metadataBusy ? "Сохраняем тему..." : "Сохранить тему"}
                  </button>
                  <button type="button" className={adminStyles.secondaryButton} onClick={() => setPreviewOpen(false)}>
                    Закрыть
                  </button>
                </div>
              </div>
            </header>
            <div className={styles.previewModalBody}>
              <PreviewViewport
                title="Предпросмотр"
                hint={`Экран показывает страницу вместе с шапкой и подвалом. ${getPageThemeFieldHint()}`}
                device={previewDevice}
                onDeviceChange={setPreviewDevice}
              >
                {previewPayload ? (
                  <StandalonePage
                    page={previewPayload}
                    globalSettings={globalSettings}
                    services={lookupResolvers.services}
                    equipment={lookupResolvers.equipment}
                    cases={lookupResolvers.cases}
                    galleries={lookupResolvers.galleries}
                    resolveMedia={lookupResolvers.media}
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
