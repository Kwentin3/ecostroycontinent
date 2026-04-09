"use client";

import Link from "next/link";
import { useState } from "react";

import { normalizeLegacyCopy } from "../../lib/ui-copy.js";
import {
  assignHeroMedia,
  buildMaterialFamilySummary,
  buildStageABlockCapabilities,
  createWorkspaceDraftState,
  getMaterialUsageState,
  moveProofMaterial,
  removeMaterialFromPage,
  toggleProofMaterial,
  updateBlockCopy,
  updatePageThemeKey,
  updateStageABlockField
} from "../../lib/admin/landing-workspace-ui.js";
import { LANDING_PAGE_THEME_REGISTRY } from "../../lib/landing-composition/visual-semantics.js";
import adminStyles from "./admin-ui.module.css";
import styles from "./LandingWorkspaceStageAScreen.module.css";

const BLOCK_LABELS = {
  landing_hero: "Hero",
  media_strip: "Медиа",
  service_cards: "Услуги",
  case_cards: "Кейсы",
  content_band: "Связка",
  cta_band: "CTA"
};

const MATERIAL_FAMILY_META = {
  media: { label: "Медиа", marker: "М" },
  service: { label: "Услуги", marker: "У" },
  case: { label: "Кейсы", marker: "К" }
};

const TEXT_EMPHASIS_LABELS = {
  quiet: "Тише",
  standard: "Норма",
  strong: "Сильнее"
};

const SURFACE_TONE_LABELS = {
  plain: "Чистая",
  tinted: "Мягкая",
  emphasis: "Акцент"
};

function buildLookupResolver(records = {}) {
  return (id) => records?.[id] ?? null;
}

function buildBlockSequence(draft = {}) {
  return [
    { id: "landing_hero", label: BLOCK_LABELS.landing_hero, present: true },
    { id: "media_strip", label: BLOCK_LABELS.media_strip, present: (draft.mediaAssetIds ?? []).length > 0 },
    { id: "service_cards", label: BLOCK_LABELS.service_cards, present: (draft.serviceCardIds ?? []).length > 0 },
    { id: "case_cards", label: BLOCK_LABELS.case_cards, present: (draft.caseCardIds ?? []).length > 0 },
    { id: "content_band", label: BLOCK_LABELS.content_band, present: Boolean(draft.contentBand?.body || draft.contentBand?.subtitle) },
    { id: "cta_band", label: BLOCK_LABELS.cta_band, present: true }
  ];
}

function normalizeIssueList(issues = []) {
  return Array.isArray(issues) ? issues : [];
}

function renderMaterialBadges(usage) {
  const badges = [];

  if (usage.isPrimary) {
    badges.push(<span key="primary" className={`${styles.stateBadge} ${styles.statePrimary}`}>Главный</span>);
  }

  if (usage.inProofList) {
    badges.push(<span key="added" className={`${styles.stateBadge} ${styles.stateAdded}`}>Добавлено</span>);
  }

  if (badges.length === 0) {
    badges.push(<span key="available" className={styles.stateBadge}>Свободно</span>);
  }

  return badges;
}

function MaterialCard({
  family,
  item,
  usage,
  onToggle,
  onSetPrimary,
  materialMenuKey,
  onToggleMenu
}) {
  const familyMeta = MATERIAL_FAMILY_META[family];
  const isMedia = family === "media";
  const menuOpen = materialMenuKey === `${family}:${item.id}`;

  return (
    <article className={`${styles.materialCard} ${usage.isUsed ? styles.materialCardUsed : ""}`}>
      <div className={styles.materialMarker} data-family={family}>
        {familyMeta.marker}
      </div>
      <div className={styles.materialCardBody}>
        {isMedia ? (
          <div className={styles.materialThumbWrap}>
            {item.previewUrl ? (
              <img src={item.previewUrl} alt={item.alt || item.title} className={styles.materialThumb} />
            ) : (
              <div className={styles.materialThumbFallback}>Нет preview</div>
            )}
          </div>
        ) : null}
        <div className={styles.materialMain}>
          <div className={styles.materialTitleRow}>
            <strong>{item.label || item.title}</strong>
            <div className={styles.materialBadges}>
              {renderMaterialBadges(usage)}
            </div>
          </div>
          <p className={styles.materialMeta}>
            {normalizeLegacyCopy(item.meta || item.whereUsedLabel || item.subtitle || familyMeta.label)}
          </p>
        </div>
      </div>
      <div className={styles.materialActions}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => onToggle(family, item.id)}
          aria-label={usage.isUsed ? `Убрать ${item.label || item.title}` : `Добавить ${item.label || item.title}`}
        >
          {usage.isUsed ? "−" : "+"}
        </button>
        {isMedia ? (
          <button
            type="button"
            className={`${styles.iconButton} ${usage.isPrimary ? styles.iconButtonActive : ""}`}
            onClick={() => onSetPrimary(item.id)}
            aria-label={usage.isPrimary ? `Убрать из hero ${item.title}` : `Сделать главным ${item.title}`}
          >
            ★
          </button>
        ) : null}
        <div className={styles.menuWrap}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={`Дополнительно для ${item.label || item.title}`}
            onClick={() => onToggleMenu(menuOpen ? "" : `${family}:${item.id}`)}
          >
            ⋯
          </button>
          {menuOpen ? (
            <div className={styles.menuPanel}>
              {isMedia ? (
                <button type="button" className={styles.menuItem} onClick={() => onSetPrimary(item.id)}>
                  {usage.isPrimary ? "Убрать из hero" : "Сделать главным"}
                </button>
              ) : null}
              <button type="button" className={styles.menuItem} onClick={() => onToggle(family, item.id)}>
                {usage.isUsed ? "Убрать с лендинга" : "Добавить на лендинг"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function BlockActionMenu({ blockId, onClose, onApply }) {
  const isStageA = buildStageABlockCapabilities(blockId).allowsStageAControls;

  return (
    <div className={styles.blockMenu}>
      {isStageA ? (
        <>
          <button type="button" className={styles.menuItem} onClick={() => onApply("textEmphasisPreset", "quiet")}>
            Сделать тише
          </button>
          <button type="button" className={styles.menuItem} onClick={() => onApply("textEmphasisPreset", "strong")}>
            Сделать сильнее
          </button>
          <button type="button" className={styles.menuItem} onClick={() => onApply("surfaceTone", "emphasis")}>
            Усилить фон
          </button>
        </>
      ) : null}
      <button type="button" className={styles.menuItem} onClick={onClose}>
        Закрыть
      </button>
    </div>
  );
}

function TextControlGroup({ label, options, value, onChange }) {
  return (
    <div className={styles.controlGroup}>
      <span className={styles.controlLabel}>{label}</span>
      <div className={styles.controlPills}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.controlPill} ${option.value === value ? styles.controlPillActive : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProofItemRow({ item, onMove, onRemove }) {
  return (
    <div className={styles.proofItemRow}>
      <div>
        <strong>{item.label || item.title}</strong>
        <p className={styles.inlineMuted}>{normalizeLegacyCopy(item.meta || item.subtitle || "")}</p>
      </div>
      <div className={styles.proofItemActions}>
        <button type="button" className={styles.iconButton} onClick={() => onMove("up")} aria-label={`Поднять ${item.label || item.title}`}>
          ↑
        </button>
        <button type="button" className={styles.iconButton} onClick={() => onMove("down")} aria-label={`Опустить ${item.label || item.title}`}>
          ↓
        </button>
        <button type="button" className={styles.iconButton} onClick={onRemove} aria-label={`Убрать ${item.label || item.title}`}>
          −
        </button>
      </div>
    </div>
  );
}

function StageABlockToolbar({ blockId, draft, onStageAChange }) {
  if (!buildStageABlockCapabilities(blockId).allowsStageAControls) {
    return null;
  }

  const blockState =
    blockId === "landing_hero"
      ? draft.hero
      : blockId === "content_band"
        ? draft.contentBand
        : draft.ctaBand;

  return (
    <div className={styles.blockToolbar}>
      <TextControlGroup
        label="Громкость"
        value={blockState.textEmphasisPreset}
        options={Object.entries(TEXT_EMPHASIS_LABELS).map(([value, optionLabel]) => ({ value, label: optionLabel }))}
        onChange={(value) => onStageAChange(blockId, "textEmphasisPreset", value)}
      />
      <TextControlGroup
        label="Поверхность"
        value={blockState.surfaceTone}
        options={Object.entries(SURFACE_TONE_LABELS).map(([value, optionLabel]) => ({ value, label: optionLabel }))}
        onChange={(value) => onStageAChange(blockId, "surfaceTone", value)}
      />
    </div>
  );
}

function InteractiveBlock({
  blockId,
  label,
  selected,
  composeMode,
  onSelect,
  children,
  menuOpen,
  onToggleMenu,
  onQuickApply
}) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(blockId);
    }
  };

  return (
    <section className={`${styles.pageBlock} ${composeMode ? styles.pageBlockCompose : styles.pageBlockPreview} ${composeMode && selected ? styles.pageBlockSelected : ""}`}>
      <div
        role={composeMode ? "button" : undefined}
        tabIndex={composeMode ? 0 : undefined}
        className={styles.pageBlockInner}
        onClick={composeMode ? () => onSelect(blockId) : undefined}
        onKeyDown={composeMode ? handleKeyDown : undefined}
      >
        {composeMode ? (
          <div className={styles.blockChrome}>
            <span className={styles.blockEyebrow}>{label}</span>
            <div className={styles.blockMenuWrap}>
              <button
                type="button"
                className={styles.blockMenuButton}
                aria-label={`Дополнительно для ${label}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleMenu(menuOpen ? "" : blockId);
                }}
              >
                ⋯
              </button>
              {menuOpen ? (
                <BlockActionMenu
                  blockId={blockId}
                  onClose={() => onToggleMenu("")}
                  onApply={(field, value) => {
                    onQuickApply(field, value);
                    onToggleMenu("");
                  }}
                />
              ) : null}
            </div>
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}

function LandingWorkspacePreviewPage({ draft, servicesById, casesById, mediaById }) {
  return (
    <div className={styles.previewSurface}>
      <section className={styles.heroBlock} data-tone={draft.hero.surfaceTone} data-emphasis={draft.hero.textEmphasisPreset}>
        <div className={styles.heroCopy}>
          <h1>{draft.title}</h1>
          <p className={styles.heroLead}>{draft.hero.headline}</p>
          <p>{draft.hero.body}</p>
        </div>
        <div className={styles.heroVisual}>
          {draft.hero.mediaAssetId && mediaById(draft.hero.mediaAssetId)?.previewUrl ? (
            <img
              src={mediaById(draft.hero.mediaAssetId).previewUrl}
              alt={mediaById(draft.hero.mediaAssetId).alt || draft.title}
              className={styles.heroImage}
            />
          ) : null}
        </div>
      </section>

      {draft.mediaAssetIds.length > 0 ? (
        <section className={styles.proofSection}>
          <h3>Медиа</h3>
          <div className={styles.mediaStrip}>
            {draft.mediaAssetIds.map((id) => {
              const media = mediaById(id);

              return (
                <div key={id} className={styles.mediaTile}>
                  {media?.previewUrl ? (
                    <img src={media.previewUrl} alt={media.alt || media.title} className={styles.mediaTileImage} />
                  ) : (
                    <div className={styles.materialThumbFallback}>Нет preview</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {draft.serviceCardIds.length > 0 ? (
        <section className={styles.proofSection}>
          <h3>Услуги</h3>
          <div className={styles.proofCardList}>
            {draft.serviceCardIds.map((id) => {
              const item = servicesById(id);

              return <div key={id} className={styles.proofItemRow}><strong>{item?.label || item?.title || id}</strong></div>;
            })}
          </div>
        </section>
      ) : null}

      {draft.caseCardIds.length > 0 ? (
        <section className={styles.proofSection}>
          <h3>Кейсы</h3>
          <div className={styles.proofCardList}>
            {draft.caseCardIds.map((id) => {
              const item = casesById(id);

              return <div key={id} className={styles.proofItemRow}><strong>{item?.label || item?.title || id}</strong></div>;
            })}
          </div>
        </section>
      ) : null}

      <section className={styles.copyBand} data-tone={draft.contentBand.surfaceTone} data-emphasis={draft.contentBand.textEmphasisPreset}>
        <p className={styles.bridgeText}>{draft.contentBand.subtitle}</p>
        <p>{draft.contentBand.body}</p>
      </section>

      <section className={styles.ctaBand} data-tone={draft.ctaBand.surfaceTone} data-emphasis={draft.ctaBand.textEmphasisPreset}>
        <h3>{draft.ctaBand.title}</h3>
        <p>{draft.ctaBand.body}</p>
        <p className={styles.bridgeText}>{draft.ctaBand.note}</p>
        <span className={styles.ctaVariantBadge}>{draft.ctaVariant || "contact"}</span>
      </section>
    </div>
  );
}

export function LandingWorkspaceStageAScreen({
  pageLabel,
  workspaceHref,
  sourceEditorHref,
  chooserHref,
  canEdit,
  sessionConflict = null,
  message = "",
  error = "",
  previewMode = "desktop",
  currentRevision = null,
  reviewHref = "",
  initialDraft,
  verificationReport,
  mediaOptions = [],
  relationOptions = {},
  publishedLookupRecords = {},
  currentChangeIntent = "",
  currentEditorialGoal = "",
  currentVariantDirection = ""
}) {
  const initialState = createWorkspaceDraftState(initialDraft);
  const [draft, setDraft] = useState(initialState);
  const [mode, setMode] = useState("compose");
  const [selectedBlockId, setSelectedBlockId] = useState("landing_hero");
  const [materialMenuKey, setMaterialMenuKey] = useState("");
  const [blockMenuId, setBlockMenuId] = useState("");
  const [changeIntent, setChangeIntent] = useState(currentChangeIntent);

  const isComposeMode = mode === "compose";
  const serializedInitialDraft = JSON.stringify(initialState);
  const serializedDraft = JSON.stringify(draft);
  const isDirty = serializedDraft !== serializedInitialDraft;
  const blockers = normalizeIssueList(verificationReport?.blockingIssues);
  const warnings = normalizeIssueList(verificationReport?.warnings);
  const selectedBlockLabel = BLOCK_LABELS[selectedBlockId] || "Блок";
  const pageBlocks = buildBlockSequence(draft);
  const reviewDisabledReason = isDirty
    ? "Сначала сохраните композицию."
    : !currentRevision
      ? "Сначала сохраните черновик."
      : "";
  const servicesById = buildLookupResolver(publishedLookupRecords.services);
  const casesById = buildLookupResolver(publishedLookupRecords.cases);
  const mediaById = buildLookupResolver(publishedLookupRecords.media);
  const materialGroups = {
    media: buildMaterialFamilySummary(draft, "media", mediaOptions),
    service: buildMaterialFamilySummary(draft, "service", relationOptions.services ?? []),
    case: buildMaterialFamilySummary(draft, "case", relationOptions.cases ?? [])
  };

  const handleToggleMaterial = (family, id) => {
    setDraft((current) => {
      const usage = getMaterialUsageState(current, family, id);

      if (usage.isUsed) {
        return removeMaterialFromPage(current, family, id);
      }

      return toggleProofMaterial(current, family, id);
    });
  };

  const handleSetHeroMedia = (mediaAssetId) => {
    setDraft((current) => {
      const usage = getMaterialUsageState(current, "media", mediaAssetId);
      return usage.isPrimary ? assignHeroMedia(current, "") : assignHeroMedia(current, mediaAssetId);
    });
  };

  const handleMoveProofItem = (family, id, direction) => {
    setDraft((current) => moveProofMaterial(current, family, id, direction));
  };

  const handleStageAChange = (blockId, field, value) => {
    setDraft((current) => updateStageABlockField(current, blockId, field, value));
  };

  const handleCopyChange = (blockId, patch) => {
    setDraft((current) => updateBlockCopy(current, blockId, patch));
  };

  const saveFeedback = error || message;
  const feedbackTone = error ? adminStyles.statusPanelBlocking : adminStyles.statusPanelInfo;

  return (
    <div className={styles.workspaceShell}>
      {saveFeedback ? <div className={feedbackTone}>{normalizeLegacyCopy(saveFeedback)}</div> : null}
      {sessionConflict ? (
        <div className={adminStyles.statusPanelBlocking}>
          Другая активная сессия уже привязана к этой странице. Продолжите её перед сохранением, генерацией или передачей на проверку.
        </div>
      ) : null}

      <header className={styles.workspaceHeader}>
        <div className={styles.workspaceHeaderMain}>
          <p className={styles.workspaceEyebrow}>Страница-источник</p>
          <h2 className={styles.workspaceTitle}>{pageLabel}</h2>
          <p className={styles.workspaceMeta}>
            {currentRevision ? `Черновик №${currentRevision.revisionNumber}` : "Черновика ещё нет"} · {verificationReport?.summary || "Рабочая зона лендинга"}
          </p>
        </div>
        <div className={styles.workspaceHeaderActions}>
          <Link href={sourceEditorHref} className={adminStyles.secondaryButton}>
            Открыть редактор страницы
          </Link>
          <Link href={chooserHref} className={adminStyles.secondaryButton}>
            К выбору лендинга
          </Link>
          <form action={workspaceHref} method="post">
            <input type="hidden" name="actionKind" value="save_workspace_draft" />
            <input type="hidden" name="previewMode" value={previewMode} />
            <input type="hidden" name="changeIntent" value={changeIntent} />
            <input type="hidden" name="editorialGoal" value={currentEditorialGoal} />
            <input type="hidden" name="variantDirection" value={currentVariantDirection} />
            <input type="hidden" name="payloadJson" value={serializedDraft} />
            <button type="submit" className={adminStyles.primaryButton} disabled={!canEdit || Boolean(sessionConflict) || !isDirty}>
              Сохранить черновик
            </button>
          </form>
        </div>
      </header>

      <div className={styles.workspaceLayout}>
        <aside className={styles.materialsRail}>
          <div className={styles.railHeader}>
            <div>
              <p className={styles.railEyebrow}>Материалы</p>
              <h3 className={styles.railTitle}>Доказательства и опоры</h3>
            </div>
            <p className={styles.inlineMuted}>Выбирайте реальные материалы страницы, а не новые сущности.</p>
          </div>

          <section className={styles.materialSection}>
            <div className={styles.materialSectionHead}>
              <span className={styles.familyChip} data-family="media">Медиа</span>
              <span className={styles.inlineMuted}>{materialGroups.media.filter((item) => item.usage.isUsed).length} на странице</span>
            </div>
            <div className={styles.materialStack}>
              {materialGroups.media.map((item) => (
                <MaterialCard
                  key={item.id}
                  family="media"
                  item={item}
                  usage={item.usage}
                  onToggle={handleToggleMaterial}
                  onSetPrimary={handleSetHeroMedia}
                  materialMenuKey={materialMenuKey}
                  onToggleMenu={setMaterialMenuKey}
                />
              ))}
            </div>
          </section>

          <section className={styles.materialSection}>
            <div className={styles.materialSectionHead}>
              <span className={styles.familyChip} data-family="service">Услуги</span>
              <span className={styles.inlineMuted}>{materialGroups.service.filter((item) => item.usage.isUsed).length} добавлено</span>
            </div>
            <div className={styles.materialStack}>
              {materialGroups.service.map((item) => (
                <MaterialCard
                  key={item.id}
                  family="service"
                  item={item}
                  usage={item.usage}
                  onToggle={handleToggleMaterial}
                  onSetPrimary={() => {}}
                  materialMenuKey={materialMenuKey}
                  onToggleMenu={setMaterialMenuKey}
                />
              ))}
            </div>
          </section>

          <section className={styles.materialSection}>
            <div className={styles.materialSectionHead}>
              <span className={styles.familyChip} data-family="case">Кейсы</span>
              <span className={styles.inlineMuted}>{materialGroups.case.filter((item) => item.usage.isUsed).length} добавлено</span>
            </div>
            <div className={styles.materialStack}>
              {materialGroups.case.map((item) => (
                <MaterialCard
                  key={item.id}
                  family="case"
                  item={item}
                  usage={item.usage}
                  onToggle={handleToggleMaterial}
                  onSetPrimary={() => {}}
                  materialMenuKey={materialMenuKey}
                  onToggleMenu={setMaterialMenuKey}
                />
              ))}
            </div>
          </section>
        </aside>

        <main className={styles.pageStage}>
          <div className={styles.stageToolbar}>
            <div className={styles.modeSwitch}>
              <button
                type="button"
                className={`${styles.modeButton} ${isComposeMode ? styles.modeButtonActive : ""}`}
                onClick={() => setMode("compose")}
              >
                Compose
              </button>
              <button
                type="button"
                className={`${styles.modeButton} ${!isComposeMode ? styles.modeButtonActive : ""}`}
                onClick={() => setMode("preview")}
              >
                Предпросмотр
              </button>
            </div>

            <TextControlGroup
              label="Атмосфера страницы"
              value={draft.pageThemeKey}
              options={Object.entries(LANDING_PAGE_THEME_REGISTRY).map(([value, theme]) => ({
                value,
                label: theme.label
              }))}
              onChange={(value) => setDraft((current) => updatePageThemeKey(current, value))}
            />
          </div>

          <div className={styles.deskSurface}>
            <div className={styles.paperSheet} data-theme={draft.pageThemeKey}>
              {isComposeMode ? (
                <>
                  <InteractiveBlock
                    blockId="landing_hero"
                    label={BLOCK_LABELS.landing_hero}
                    selected={selectedBlockId === "landing_hero"}
                    composeMode={isComposeMode}
                    onSelect={setSelectedBlockId}
                    menuOpen={blockMenuId === "landing_hero"}
                    onToggleMenu={setBlockMenuId}
                    onQuickApply={(field, value) => handleStageAChange("landing_hero", field, value)}
                  >
                    {selectedBlockId === "landing_hero" ? (
                      <StageABlockToolbar blockId="landing_hero" draft={draft} onStageAChange={handleStageAChange} />
                    ) : null}
                    <div className={styles.heroBlock} data-tone={draft.hero.surfaceTone} data-emphasis={draft.hero.textEmphasisPreset}>
                      <div className={styles.heroCopy}>
                        {selectedBlockId === "landing_hero" ? (
                          <>
                            <input
                              className={styles.pageTitleInput}
                              value={draft.title}
                              onChange={(event) => handleCopyChange("landing_hero", { title: event.target.value })}
                              onClick={(event) => event.stopPropagation()}
                            />
                            <textarea
                              className={styles.inlineTextarea}
                              value={draft.hero.headline}
                              rows={2}
                              onChange={(event) => handleCopyChange("landing_hero", { headline: event.target.value })}
                              onClick={(event) => event.stopPropagation()}
                            />
                            <textarea
                              className={styles.inlineTextarea}
                              value={draft.hero.body}
                              rows={4}
                              onChange={(event) => handleCopyChange("landing_hero", { body: event.target.value })}
                              onClick={(event) => event.stopPropagation()}
                            />
                          </>
                        ) : (
                          <>
                            <h1>{draft.title}</h1>
                            <p className={styles.heroLead}>{draft.hero.headline}</p>
                            <p>{draft.hero.body}</p>
                          </>
                        )}
                      </div>
                      <div className={styles.heroVisual}>
                        {draft.hero.mediaAssetId && mediaById(draft.hero.mediaAssetId)?.url ? (
                          <img
                            src={mediaById(draft.hero.mediaAssetId).url}
                            alt={mediaById(draft.hero.mediaAssetId).alt || draft.title}
                            className={styles.heroImage}
                          />
                        ) : (
                          <div className={styles.emptyBlockHint}>Выберите главное медиа слева.</div>
                        )}
                      </div>
                    </div>
                  </InteractiveBlock>

                  <InteractiveBlock
                    blockId="media_strip"
                    label={BLOCK_LABELS.media_strip}
                    selected={selectedBlockId === "media_strip"}
                    composeMode={isComposeMode}
                    onSelect={setSelectedBlockId}
                    menuOpen={blockMenuId === "media_strip"}
                    onToggleMenu={setBlockMenuId}
                    onQuickApply={() => {}}
                  >
                    <div className={styles.proofSection}>
                      <h3>Медиа</h3>
                      {(draft.mediaAssetIds ?? []).length > 0 ? (
                        <div className={styles.mediaStrip}>
                          {draft.mediaAssetIds.map((id) => {
                            const media = mediaById(id);

                            return (
                              <div key={id} className={styles.mediaTile}>
                                {media?.url ? <img src={media.url} alt={media.alt || media.title} className={styles.mediaTileImage} /> : <div className={styles.materialThumbFallback}>Нет preview</div>}
                                <ProofItemRow
                                  item={{ id, title: media?.title || id }}
                                  onMove={(direction) => handleMoveProofItem("media", id, direction)}
                                  onRemove={() => handleToggleMaterial("media", id)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={styles.emptyBlockHint}>Добавьте supporting media из левой колонки.</div>
                      )}
                    </div>
                  </InteractiveBlock>

                  <InteractiveBlock
                    blockId="service_cards"
                    label={BLOCK_LABELS.service_cards}
                    selected={selectedBlockId === "service_cards"}
                    composeMode={isComposeMode}
                    onSelect={setSelectedBlockId}
                    menuOpen={blockMenuId === "service_cards"}
                    onToggleMenu={setBlockMenuId}
                    onQuickApply={() => {}}
                  >
                    <div className={styles.proofSection}>
                      <h3>Услуги</h3>
                      {(draft.serviceCardIds ?? []).length > 0 ? (
                        <div className={styles.proofCardList}>
                          {draft.serviceCardIds.map((id) => {
                            const item = servicesById(id);

                            return (
                              <ProofItemRow
                                key={id}
                                item={{ id, label: item?.label || item?.title || id, meta: item?.meta || item?.subtitle || "" }}
                                onMove={(direction) => handleMoveProofItem("service", id, direction)}
                                onRemove={() => handleToggleMaterial("service", id)}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className={styles.emptyBlockHint}>Добавьте 1–3 услуги, чтобы страница не теряла конкретику.</div>
                      )}
                    </div>
                  </InteractiveBlock>

                  <InteractiveBlock
                    blockId="case_cards"
                    label={BLOCK_LABELS.case_cards}
                    selected={selectedBlockId === "case_cards"}
                    composeMode={isComposeMode}
                    onSelect={setSelectedBlockId}
                    menuOpen={blockMenuId === "case_cards"}
                    onToggleMenu={setBlockMenuId}
                    onQuickApply={() => {}}
                  >
                    <div className={styles.proofSection}>
                      <h3>Кейсы</h3>
                      {(draft.caseCardIds ?? []).length > 0 ? (
                        <div className={styles.proofCardList}>
                          {draft.caseCardIds.map((id) => {
                            const item = casesById(id);

                            return (
                              <ProofItemRow
                                key={id}
                                item={{ id, label: item?.label || item?.title || id, meta: item?.meta || item?.subtitle || "" }}
                                onMove={(direction) => handleMoveProofItem("case", id, direction)}
                                onRemove={() => handleToggleMaterial("case", id)}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className={styles.emptyBlockHint}>Добавьте кейсы, если нужен proof-блок перед CTA.</div>
                      )}
                    </div>
                  </InteractiveBlock>

                  <InteractiveBlock
                    blockId="content_band"
                    label={BLOCK_LABELS.content_band}
                    selected={selectedBlockId === "content_band"}
                    composeMode={isComposeMode}
                    onSelect={setSelectedBlockId}
                    menuOpen={blockMenuId === "content_band"}
                    onToggleMenu={setBlockMenuId}
                    onQuickApply={(field, value) => handleStageAChange("content_band", field, value)}
                  >
                    {selectedBlockId === "content_band" ? (
                      <StageABlockToolbar blockId="content_band" draft={draft} onStageAChange={handleStageAChange} />
                    ) : null}
                    <div className={styles.copyBand} data-tone={draft.contentBand.surfaceTone} data-emphasis={draft.contentBand.textEmphasisPreset}>
                      {selectedBlockId === "content_band" ? (
                        <>
                          <input
                            className={styles.bridgeInput}
                            value={draft.contentBand.subtitle}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => handleCopyChange("content_band", { subtitle: event.target.value })}
                          />
                          <textarea
                            className={styles.inlineTextarea}
                            value={draft.contentBand.body}
                            rows={4}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => handleCopyChange("content_band", { body: event.target.value })}
                          />
                        </>
                      ) : (
                        <>
                          <p className={styles.bridgeText}>{draft.contentBand.subtitle || "Добавьте короткую связку между proof-блоками и CTA."}</p>
                          <p>{draft.contentBand.body}</p>
                        </>
                      )}
                    </div>
                  </InteractiveBlock>

                  <InteractiveBlock
                    blockId="cta_band"
                    label={BLOCK_LABELS.cta_band}
                    selected={selectedBlockId === "cta_band"}
                    composeMode={isComposeMode}
                    onSelect={setSelectedBlockId}
                    menuOpen={blockMenuId === "cta_band"}
                    onToggleMenu={setBlockMenuId}
                    onQuickApply={(field, value) => handleStageAChange("cta_band", field, value)}
                  >
                    {selectedBlockId === "cta_band" ? (
                      <StageABlockToolbar blockId="cta_band" draft={draft} onStageAChange={handleStageAChange} />
                    ) : null}
                    <div className={styles.ctaBand} data-tone={draft.ctaBand.surfaceTone} data-emphasis={draft.ctaBand.textEmphasisPreset}>
                      {selectedBlockId === "cta_band" ? (
                        <>
                          <label className={styles.fieldRow}>
                            <span>CTA вариант</span>
                            <select
                              value={draft.ctaVariant}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => handleCopyChange("cta_band", { ctaVariant: event.target.value })}
                            >
                              <option value="contact">Связаться</option>
                              <option value="callback">Заказать звонок</option>
                              <option value="estimate">Запросить смету</option>
                            </select>
                          </label>
                          <input
                            className={styles.pageTitleInput}
                            value={draft.ctaBand.title}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => handleCopyChange("cta_band", { title: event.target.value })}
                          />
                          <textarea
                            className={styles.inlineTextarea}
                            value={draft.ctaBand.body}
                            rows={3}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => handleCopyChange("cta_band", { body: event.target.value })}
                          />
                          <input
                            className={styles.bridgeInput}
                            value={draft.ctaBand.note}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => handleCopyChange("cta_band", { note: event.target.value })}
                          />
                        </>
                      ) : (
                        <>
                          <h3>{draft.ctaBand.title}</h3>
                          <p>{draft.ctaBand.body}</p>
                          <p className={styles.bridgeText}>{draft.ctaBand.note}</p>
                          <span className={styles.ctaVariantBadge}>{draft.ctaVariant || "contact"}</span>
                        </>
                      )}
                    </div>
                  </InteractiveBlock>
                </>
              ) : <LandingWorkspacePreviewPage draft={draft} servicesById={servicesById} casesById={casesById} mediaById={mediaById} />}
            </div>
          </div>
        </main>

        <aside className={styles.supportRail}>
          <section className={styles.supportCard}>
            <p className={styles.railEyebrow}>Проверка</p>
            <h3 className={styles.supportTitle}>Блокирующие проблемы</h3>
            <p className={styles.inlineMuted}>
              {blockers.length > 0 ? `Сейчас блокеров: ${blockers.length}` : "Жёстких блокеров нет."}
            </p>
            {blockers.length > 0 ? (
              <ul className={styles.issueList}>
                {blockers.slice(0, 4).map((issue) => (
                  <li key={`${issue.code}-${issue.message}`}>{normalizeLegacyCopy(issue.message)}</li>
                ))}
              </ul>
            ) : null}
            {warnings.length > 0 ? <p className={styles.inlineMuted}>Предупреждений: {warnings.length}</p> : null}
          </section>

          <section className={styles.supportCard}>
            <p className={styles.railEyebrow}>Помощник</p>
            <h3 className={styles.supportTitle}>Что хотим изменить</h3>
            <textarea
              className={styles.helperTextarea}
              value={changeIntent}
              onChange={(event) => setChangeIntent(event.target.value)}
              placeholder={`Например: усилить блок ${selectedBlockLabel.toLowerCase()}.`}
            />
            <div className={styles.helperQuickRow}>
              <button type="button" className={styles.helperChip} onClick={() => setChangeIntent(`Усилить ${selectedBlockLabel.toLowerCase()} и сделать его понятнее.`)}>
                Усилить блок
              </button>
              <button type="button" className={styles.helperChip} onClick={() => setChangeIntent(`Предложить более плавную связку перед ${selectedBlockLabel.toLowerCase()}.`)}>
                Предложить связку
              </button>
            </div>
            <form action={workspaceHref} method="post" className={styles.helperForm}>
              <input type="hidden" name="actionKind" value="generate_candidate" />
              <input type="hidden" name="previewMode" value={previewMode} />
              <input type="hidden" name="editorialGoal" value={currentEditorialGoal} />
              <input type="hidden" name="variantDirection" value={currentVariantDirection} />
              <input type="hidden" name="changeIntent" value={changeIntent} />
              <button type="submit" className={adminStyles.primaryButton} disabled={!canEdit || Boolean(sessionConflict) || isDirty}>
                {currentRevision ? "Сгенерировать заново" : "Сгенерировать черновик"}
              </button>
            </form>
            {isDirty ? <p className={styles.inlineMuted}>Сначала сохраните текущую композицию.</p> : null}
          </section>

          <section className={styles.supportCard}>
            <p className={styles.railEyebrow}>Следующий шаг</p>
            <h3 className={styles.supportTitle}>Передать на проверку</h3>
            <p className={styles.inlineMuted}>
              {reviewDisabledReason || (reviewHref ? "Черновик можно передать на проверку." : "После сохранения откроется путь к проверке.")}
            </p>
            {reviewHref ? (
              <Link href={reviewHref} className={adminStyles.secondaryButton}>
                Открыть текущую проверку
              </Link>
            ) : null}
            <form action={workspaceHref} method="post">
              <input type="hidden" name="actionKind" value="send_to_review" />
              <input type="hidden" name="previewMode" value={previewMode} />
              <input type="hidden" name="editorialGoal" value={currentEditorialGoal} />
              <input type="hidden" name="variantDirection" value={currentVariantDirection} />
              <input type="hidden" name="changeIntent" value={changeIntent} />
              <button type="submit" className={adminStyles.primaryButton} disabled={!canEdit || Boolean(sessionConflict) || Boolean(reviewDisabledReason)}>
                Передать на проверку
              </button>
            </form>
          </section>

          {selectedBlockId ? (
            <section className={styles.supportCard}>
              <p className={styles.railEyebrow}>Контекст</p>
              <h3 className={styles.supportTitle}>{selectedBlockLabel}</h3>
              <p className={styles.inlineMuted}>
                {buildStageABlockCapabilities(selectedBlockId).allowsStageAControls
                  ? "Для этого блока доступны Stage A поля: атмосфера текста и поверхность секции."
                  : "Для этого блока доступны только состав, порядок и наличие материалов."}
              </p>
              <p className={styles.inlineMuted}>В композиции сейчас {pageBlocks.filter((block) => block.present).length} активных секций.</p>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
