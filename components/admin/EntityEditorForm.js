import Link from "next/link";

import { ConfirmActionForm } from "./ConfirmActionForm";
import { EntityActionabilityPanel } from "./EntityActionabilityPanel";
import { EntityTruthSections } from "./EntityTruthSections";
import { FilterableChecklist } from "./FilterableChecklist";
import { EvidenceRegisterPanel } from "./EvidenceRegisterPanel";
import { MediaPicker } from "./MediaPicker";
import { ServiceLandingFactoryPanel } from "./ServiceLandingFactoryPanel";
import { ServiceLandingWorkspacePanel } from "./ServiceLandingWorkspacePanel";
import { ReadinessPanel } from "./ReadinessPanel";
import { TimelineList } from "./TimelineList";
import { SurfacePacket } from "./SurfacePacket";
import { ENTITY_TYPES } from "../../lib/content-core/content-types.js";
import { getEditorFallbackAnchor } from "../../lib/admin/editor-anchors.js";
import { ADMIN_COPY, FIELD_LABELS, getRevisionStateLabel, normalizeLegacyCopy } from "../../lib/ui-copy.js";
import { CHANGE_INTENT_LABEL, FIELD_HINTS, getEntityEditorLegend } from "../../lib/admin/screen-copy.js";
import { getPayloadLabel } from "../../lib/admin/entity-ui.js";
import { isAgentTestCreationOrigin } from "../../lib/admin/entity-origin.js";
import { getLegacyTestFixtureNormalizationHref } from "../../lib/admin/legacy-test-fixture-normalization.js";
import { getTestGraphTeardownHref } from "../../lib/admin/test-graph-teardown.js";
import { getLiveDeactivationHref } from "../../lib/admin/live-deactivation.js";
import styles from "./admin-ui.module.css";

const OBLIGATION_LABELS = {
  redirect_required: "Нужен редирект",
  revalidation_required: "Нужно переобновление",
  sitemap_update_required: "Нужно обновить карту сайта",
  canonical_url_check_required: "Нужна проверка канонического адреса"
};

const OBLIGATION_STATUS_LABELS = {
  open: "Открыто",
  completed: "Выполнено"
};

function TruthGroup({ id, kicker = "Поисковая оптимизация / данные", title, note, children }) {
  return (
    <section id={id} className={`${styles.panel} ${styles.panelMuted} ${styles.editorTruthSection} ${styles.anchorTarget}`}>
      <div className={styles.editorTruthSectionHeader}>
        {kicker ? <p className={styles.cockpitBlockKicker}>{kicker}</p> : null}
        {title ? <h3 className={styles.editorTruthSectionTitle}>{title}</h3> : null}
        {note ? <p className={styles.editorTruthSectionNote}>{note}</p> : null}
      </div>
      <div className={styles.formGrid}>{children}</div>
    </section>
  );
}

function SeoMetaFields({ value }) {
  return (
    <>
      <label className={styles.label}>
        <span>{FIELD_LABELS.metaTitle}</span>
        <input name="metaTitle" defaultValue={value.seo?.metaTitle || ""} />
      </label>
      <label className={styles.label}>
        <span>{FIELD_LABELS.metaDescription}</span>
        <textarea name="metaDescription" defaultValue={value.seo?.metaDescription || ""} />
      </label>
      <label className={styles.label}>
        <span>{FIELD_LABELS.canonicalIntent}</span>
        <input name="canonicalIntent" defaultValue={value.seo?.canonicalIntent || ""} />
        <p className={styles.helpText}>{FIELD_HINTS.canonicalIntent}</p>
      </label>
      <label className={styles.label}>
        <span>{FIELD_LABELS.indexationFlag}</span>
        <select name="indexationFlag" defaultValue={value.seo?.indexationFlag || "index"}>
          <option value="index">Индексировать</option>
          <option value="noindex">Не индексировать</option>
        </select>
      </label>
      <label className={styles.label}>
        <span>{FIELD_LABELS.openGraphTitle}</span>
        <input name="openGraphTitle" defaultValue={value.seo?.openGraphTitle || ""} />
      </label>
      <label className={styles.label}>
        <span>{FIELD_LABELS.openGraphDescription}</span>
        <textarea name="openGraphDescription" defaultValue={value.seo?.openGraphDescription || ""} />
      </label>
      <input type="hidden" name="openGraphImageAssetId" value={value.seo?.openGraphImageAssetId || ""} />
    </>
  );
}

function renderMediaUpload(redirectTo) {
  return (
    <section className={`${styles.panel} ${styles.panelMuted}`}>
      <h3>{ADMIN_COPY.fastMediaUploadTitle}</h3>
      <p className={styles.helpText}>{ADMIN_COPY.fastMediaUploadHint}</p>
      <form action="/api/admin/media/upload" method="post" encType="multipart/form-data" className={styles.formGrid}>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <label className={styles.label}>
          <span>Файл</span>
          <input type="file" name="file" accept="image/*" required />
        </label>
        <button type="submit" className={`${styles.secondaryButton} ${styles.stretchButton}`}>{ADMIN_COPY.uploadMedia}</button>
      </form>
    </section>
  );
}

export function EntityEditorForm({
  entityType,
  entityId,
  entityCreationOrigin = null,
  value,
  currentRevision,
  activePublishedRevision,
  readiness,
  auditItems,
  obligations,
  relationOptions,
  mediaOptions,
  caseProjectTypeOptions = [],
  workspaceMemoryCard = null,
  user,
  message,
  error
}) {
  const redirectTo = entityId ? `/admin/entities/${entityType}/${entityId}` : `/admin/entities/${entityType}`;
  const historyHref = entityId ? `/admin/entities/${entityType}/${entityId}/history` : "";
  const canDeleteEntity = Boolean(entityId && (entityType === ENTITY_TYPES.SERVICE || entityType === ENTITY_TYPES.CASE));
  const canPublish = user.role === "superadmin";
  const canLiveDeactivate = Boolean(
    entityId
    && canPublish
    && activePublishedRevision
    && !isAgentTestCreationOrigin(entityCreationOrigin)
    && [ENTITY_TYPES.PAGE, ENTITY_TYPES.SERVICE, ENTITY_TYPES.CASE].includes(entityType)
  );
  const canTeardownTestGraph = Boolean(
    entityId
    && isAgentTestCreationOrigin(entityCreationOrigin)
    && [ENTITY_TYPES.PAGE, ENTITY_TYPES.SERVICE, ENTITY_TYPES.CASE].includes(entityType)
  );
  const canNormalizeLegacyTestFixture = Boolean(
    entityId
    && canPublish
    && !isAgentTestCreationOrigin(entityCreationOrigin)
    && [ENTITY_TYPES.PAGE, ENTITY_TYPES.SERVICE, ENTITY_TYPES.CASE].includes(entityType)
  );
  const canSubmit = user.role === "superadmin" || user.role === "seo_manager";
  const showActionabilityPanel = [
    ENTITY_TYPES.GLOBAL_SETTINGS,
    ENTITY_TYPES.SERVICE,
    ENTITY_TYPES.CASE,
    ENTITY_TYPES.PAGE
  ].includes(entityType);
  const surfaceTitle = entityType === "global_settings" ? "Глобальные настройки" : getPayloadLabel(value);
  const readinessBlocking = readiness ? readiness.results.filter((result) => result.severity === "blocking").length : 0;
  const readinessWarnings = readiness ? readiness.results.filter((result) => result.severity === "warning").length : 0;
  const currentStateLabel = currentRevision ? getRevisionStateLabel(currentRevision.state) : "Новый черновик";
  const mediaPreviewSrc = entityType === "media_asset" && entityId ? `/api/admin/media/${entityId}/preview` : null;
  const showCompactGuide = showActionabilityPanel;
  const surfaceSummary = entityType === "media_asset"
    ? "Сначала загрузите файл, затем уточните метаданные карточки и при необходимости оставьте заметку к версии. Этот экран остаётся источником медиа для остальных карточек."
    : entityType === "gallery"
      ? "Коллекция собирает уже загруженные медиафайлы. Новый файл добавляйте в разделе Медиа, а здесь собирайте подборку."
      : "Основное заполняется слева, готовность и история остаются справа. Новый файл добавляйте через раздел Медиа, а не в каждой карточке отдельно.";
  const surfaceBullets = [
    `Состояние: ${currentRevision ? currentStateLabel : "новый черновик"}`,
    readiness ? `Блокеров: ${readinessBlocking}` : "Проверка готовности ещё не запускалась",
    readiness ? `Предупреждений: ${readinessWarnings}` : "Предупреждения появятся после сохранения",
    activePublishedRevision ? `Опубликованная версия №${activePublishedRevision.revisionNumber}` : "Опубликованной версии пока нет"
  ];
  const compactGuideSummary = entityType === ENTITY_TYPES.GLOBAL_SETTINGS
    ? "Короткая памятка по глобальным настройкам. Основная работа идёт ниже в форме."
    : entityType === ENTITY_TYPES.SERVICE
      ? "Короткая памятка по услуге. Заполнение и связи редактируются ниже."
      : entityType === ENTITY_TYPES.CASE
        ? "Короткая памятка по кейсу. Основные поля и связи редактируются ниже."
        : "Короткая памятка по странице. Основные поля редактируются ниже.";

  return (
    <div className={styles.split}>
      <div className={styles.stack}>
        {message ? <div className={styles.statusPanelInfo}>{message}</div> : null}
        {error ? <div className={styles.statusPanelBlocking}>{error}</div> : null}
        {showActionabilityPanel ? (
          <EntityActionabilityPanel
            entityType={entityType}
            readiness={readiness}
            currentRevision={currentRevision}
            activePublishedRevision={activePublishedRevision}
          />
        ) : null}
        {showCompactGuide ? (
          <details className={styles.compactDisclosure}>
            <summary className={styles.compactDisclosureSummary}>
              <span className={styles.compactDisclosureMarker} aria-hidden="true" />
              <span className={styles.compactDisclosureSummaryMain}>
                <strong>Рабочая карточка</strong>
                <span className={styles.compactDisclosureSummaryMeta}>{compactGuideSummary}</span>
              </span>
              <span className={styles.compactDisclosureSummaryStats}>
                <span className={styles.badge}>{currentRevision ? `Версия №${currentRevision.revisionNumber}` : "Новая запись"}</span>
              </span>
            </summary>
            <div className={styles.compactDisclosureBody}>
              <p className={styles.surfacePacketLegend}>{getEntityEditorLegend(entityType)}</p>
            </div>
          </details>
        ) : (
          <SurfacePacket
            eyebrow="Рабочая карточка"
            title={surfaceTitle}
            summary={surfaceSummary}
            legend={getEntityEditorLegend(entityType)}
            bullets={surfaceBullets}
            meta={[currentRevision ? `Версия №${currentRevision.revisionNumber}` : "Новая запись"]}
          >
            {entityId ? <Link href={`/admin/entities/${entityType}/${entityId}/history`} className={styles.secondaryButton}>{ADMIN_COPY.openHistory}</Link> : null}
          </SurfacePacket>
        )}
        {entityId || canDeleteEntity ? (
          <div className={styles.inlineActions}>
            {entityId ? <Link href={historyHref} className={styles.secondaryButton}>{ADMIN_COPY.openHistory}</Link> : null}
            {isAgentTestCreationOrigin(entityCreationOrigin) ? (
              <span className={`${styles.badge} ${styles.mediaBadgewarning}`}>Тестовые</span>
            ) : null}
            {!activePublishedRevision && currentRevision?.state === "published" ? (
              <span className={`${styles.badge} ${styles.mediaBadgemuted}`}>Р’РЅРµ live</span>
            ) : null}
            {canTeardownTestGraph ? (
              <Link href={getTestGraphTeardownHref(entityType, entityId)} className={styles.secondaryButton}>
                Удалить тестовый граф
              </Link>
            ) : null}
            {canNormalizeLegacyTestFixture ? (
              <Link href={getLegacyTestFixtureNormalizationHref(entityType, entityId)} className={styles.secondaryButton}>
                Пометить как тестовые
              </Link>
            ) : null}
            {canLiveDeactivate ? (
              <Link href={getLiveDeactivationHref(entityType, entityId)} className={styles.secondaryButton}>
                Р’С‹РІРµСЃС‚Рё РёР· Р¶РёРІРѕРіРѕ РєРѕРЅС‚СѓСЂР°
              </Link>
            ) : null}
            {canDeleteEntity ? (
              <ConfirmActionForm
                action={`/api/admin/entities/${entityType}/delete`}
                confirmMessage="Удалить эту сущность? Действие необратимо."
              >
                <input type="hidden" name="entityId" value={entityId} />
                <input type="hidden" name="redirectTo" value={`/admin/entities/${entityType}`} />
                <input type="hidden" name="failureRedirectTo" value={redirectTo} />
                <button type="submit" className={styles.dangerButton}>Удалить</button>
              </ConfirmActionForm>
            ) : null}
          </div>
        ) : null}
        {entityType === "media_asset" ? renderMediaUpload(redirectTo) : null}
        <section className={styles.panel}>
          <form action={`/api/admin/entities/${entityType}/save`} method="post" className={styles.formGrid}>
            <input type="hidden" name="entityId" value={entityId || ""} />
            {!entityId && entityCreationOrigin ? <input type="hidden" name="creationOrigin" value={entityCreationOrigin} /> : null}
            <label className={styles.label}>
              <span>{CHANGE_INTENT_LABEL}</span>
              <input name="changeIntent" defaultValue={normalizeLegacyCopy(currentRevision?.changeIntent) || "Черновик сохранён из редактора."} />
              <p className={styles.helpText}>{FIELD_HINTS.changeIntent}</p>
            </label>

            <EntityTruthSections
              entityType={entityType}
              value={value}
              relationOptions={relationOptions}
              mediaOptions={mediaOptions}
              caseProjectTypeOptions={caseProjectTypeOptions}
              sourceHref={redirectTo}
            />

            {false && (<>
              {entityType === "global_settings" ? (
              <div className={styles.gridTwo}>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.publicBrandName}</span>
                  <input name="publicBrandName" defaultValue={value.publicBrandName || ""} required />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.legalName}</span>
                  <input name="legalName" defaultValue={value.legalName || ""} required />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.primaryPhone}</span>
                  <input name="primaryPhone" defaultValue={value.primaryPhone || ""} />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.publicEmail}</span>
                  <input name="publicEmail" defaultValue={value.publicEmail || ""} />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.serviceArea}</span>
                  <input name="serviceArea" defaultValue={value.serviceArea || ""} />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.primaryRegion}</span>
                  <input name="primaryRegion" defaultValue={value.primaryRegion || ""} />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.defaultCtaLabel}</span>
                  <input name="defaultCtaLabel" defaultValue={value.defaultCtaLabel || ""} />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.defaultCtaDescription}</span>
                  <textarea name="defaultCtaDescription" defaultValue={value.defaultCtaDescription || ""} />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.organizationCity}</span>
                  <input name="organizationCity" defaultValue={value.organization?.city || ""} />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.organizationCountry}</span>
                  <input name="organizationCountry" defaultValue={value.organization?.country || ""} />
                </label>
                <label className={styles.label}>
                  <span>Активный мессенджер</span>
                  <select name="activeMessengers" defaultValue={value.activeMessengers?.[0] || ""}>
                    <option value="">Нет</option>
                    <option value="telegram">Telegram</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.contactTruthConfirmed}</span>
                  <input type="checkbox" name="contactTruthConfirmed" defaultChecked={Boolean(value.contactTruthConfirmed)} />
                </label>
              </div>
            ) : null}

            {entityType === "media_asset" ? (
              <div className={styles.gridTwo}>
                <div className={styles.gridWide}>
                  <section className={styles.mediaPreviewPanel}>
                    <div className={styles.mediaPreviewCopy}>
                      <p className={styles.mediaPreviewLabel}>Предпросмотр файла</p>
                      <p className={styles.helpText}>
                        После загрузки здесь видно само изображение. Если файла ещё нет, превью появится после первой загрузки.
                      </p>
                    </div>
                    {mediaPreviewSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaPreviewSrc}
                        alt={value.alt || value.title || value.originalFilename || ADMIN_COPY.noPreview}
                        className={styles.mediaPreviewImage}
                      />
                    ) : (
                      <div className={styles.mediaPreviewEmpty}>
                        <span>{ADMIN_COPY.noPreview}</span>
                      </div>
                    )}
                  </section>
                </div>
                <div className={styles.gridWide}>
                  <p className={styles.helpText}>
                    Здесь редактируются метаданные медиа и история версии. Комментарий к изменению помогает потом понять, зачем появилась новая версия.
                  </p>
                </div>
                <label className={styles.label}>
                  <span>Название</span>
                  <input name="title" defaultValue={value.title || ""} />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.alt}</span>
                  <input name="alt" defaultValue={value.alt || ""} />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.caption}</span>
                  <textarea name="caption" defaultValue={value.caption || ""} />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.ownershipNote}</span>
                  <input name="ownershipNote" defaultValue={value.ownershipNote || ""} />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.sourceNote}</span>
                  <input name="sourceNote" defaultValue={value.sourceNote || ""} />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.status}</span>
                  <select name="status" defaultValue={value.status || "ready"}>
                    <option value="draft_asset">Черновик</option>
                    <option value="ready">Готово</option>
                  </select>
                </label>
                <input type="hidden" name="storageKey" value={value.storageKey || ""} />
                <input type="hidden" name="mimeType" value={value.mimeType || ""} />
                <input type="hidden" name="originalFilename" value={value.originalFilename || ""} />
                <input type="hidden" name="uploadedBy" value={value.uploadedBy || ""} />
                <input type="hidden" name="uploadedAt" value={value.uploadedAt || ""} />
                <input type="hidden" name="sizeBytes" value={value.sizeBytes || 0} />
              </div>
            ) : null}

            {entityType === "gallery" ? (
              <>
                <label className={styles.label}>
                  <span>Название</span>
                  <input name="title" defaultValue={value.title || ""} required />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.caption}</span>
                  <textarea name="caption" defaultValue={value.caption || ""} />
                </label>
                <MediaPicker
                  legend="Файлы коллекции"
                  name="assetIds"
                  assets={mediaOptions}
                  selectedIds={value.assetIds || []}
                  selectionMode="multiple"
                  hint={FIELD_HINTS.galleryAssets}
                />
                <MediaPicker
                  legend="Основной файл"
                  name="primaryAssetId"
                  assets={mediaOptions}
                  selectedIds={value.primaryAssetId ? [value.primaryAssetId] : []}
                  selectionMode="single"
                  hint={FIELD_HINTS.galleryPrimaryAsset}
                />
              </>
            ) : null}

            {entityType === "service" ? (
              <>
                <div className={styles.gridTwo}>
                  <label className={styles.label}>
                    <span>{FIELD_LABELS.slug}</span>
                    <input name="slug" defaultValue={value.slug || ""} required />
                  </label>
                  <label className={styles.label}>
                    <span>Название</span>
                    <input name="title" defaultValue={value.title || ""} required />
                  </label>
                  <label className={styles.label}>
                    <span>{FIELD_LABELS.h1}</span>
                    <input name="h1" defaultValue={value.h1 || ""} required />
                  </label>
                  <label className={styles.label}>
                    <span>{FIELD_LABELS.ctaVariant}</span>
                    <input name="ctaVariant" defaultValue={value.ctaVariant || ""} required />
                  </label>
                </div>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.summary}</span>
                  <textarea name="summary" defaultValue={value.summary || ""} required />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.serviceScope}</span>
                  <textarea name="serviceScope" defaultValue={value.serviceScope || ""} required />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.problemsSolved}</span>
                  <textarea name="problemsSolved" defaultValue={value.problemsSolved || ""} />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.methods}</span>
                  <textarea name="methods" defaultValue={value.methods || ""} />
                </label>
                <FilterableChecklist legend="Связанные кейсы" name="relatedCaseIds" options={relationOptions.cases} selectedIds={value.relatedCaseIds || []} />
                <FilterableChecklist legend="Коллекции" name="galleryIds" options={relationOptions.galleries} selectedIds={value.galleryIds || []} />
                <MediaPicker legend="Основное медиа" name="primaryMediaAssetId" assets={mediaOptions} selectedIds={value.primaryMediaAssetId ? [value.primaryMediaAssetId] : []} hint={FIELD_HINTS.primaryMedia} />
              </>
            ) : null}

            {entityType === "case" ? (
              <>
                <div className={styles.gridTwo}>
                  <label className={styles.label}>
                    <span>{FIELD_LABELS.slug}</span>
                    <input name="slug" defaultValue={value.slug || ""} required />
                  </label>
                  <label className={styles.label}>
                    <span>Название</span>
                    <input name="title" defaultValue={value.title || ""} required />
                  </label>
                  <label className={styles.label}>
                    <span>{FIELD_LABELS.location}</span>
                    <input name="location" defaultValue={value.location || ""} required />
                  </label>
                  <label className={styles.label}>
                    <span>{FIELD_LABELS.projectType}</span>
                    <input name="projectType" list={caseProjectTypeOptions.length ? "caseProjectTypeOptions" : undefined} defaultValue={value.projectType || ""} />
                    <p className={styles.helpText}>{FIELD_HINTS.projectType}</p>
                  </label>
                </div>
                {caseProjectTypeOptions.length ? (
                  <datalist id="caseProjectTypeOptions">
                    {caseProjectTypeOptions.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                ) : null}
                <label className={styles.label}>
                  <span>{FIELD_LABELS.task}</span>
                  <textarea name="task" defaultValue={value.task || ""} required />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.workScope}</span>
                  <textarea name="workScope" defaultValue={value.workScope || ""} required />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.result}</span>
                  <textarea name="result" defaultValue={value.result || ""} required />
                </label>
                <FilterableChecklist legend="Связанные услуги" name="serviceIds" options={relationOptions.services} selectedIds={value.serviceIds || []} />
                <FilterableChecklist legend="Коллекции" name="galleryIds" options={relationOptions.galleries} selectedIds={value.galleryIds || []} />
                <MediaPicker legend="Основное медиа" name="primaryMediaAssetId" assets={mediaOptions} selectedIds={value.primaryMediaAssetId ? [value.primaryMediaAssetId] : []} hint={FIELD_HINTS.primaryMedia} />
              </>
            ) : null}

            {entityType === "page" ? (
              <>
                <div className={styles.gridTwo}>
                  <label className={styles.label}>
                    <span>Тип страницы</span>
                    <select name="pageType" defaultValue={value.pageType || "about"}>
                      <option value="about">О нас</option>
                      <option value="contacts">Контакты</option>
                    </select>
                  </label>
                  <label className={styles.label}>
                    <span>Название</span>
                    <input name="title" defaultValue={value.title || ""} required />
                  </label>
                  <label className={styles.label}>
                    <span>{FIELD_LABELS.h1}</span>
                    <input name="h1" defaultValue={value.h1 || ""} required />
                  </label>
                </div>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.intro}</span>
                  <textarea name="intro" defaultValue={value.intro || ""} />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.body}</span>
                  <textarea name="body" defaultValue={value.body || ""} />
                </label>
                <label className={styles.label}>
                  <span>Примечание по контактам</span>
                  <textarea name="contactNote" defaultValue={value.contactNote || ""} />
                </label>
                <label className={styles.label}>
                  <span>Заголовок кнопки</span>
                  <input name="ctaTitle" defaultValue={value.ctaTitle || ""} />
                </label>
                <label className={styles.label}>
                  <span>Текст кнопки</span>
                  <textarea name="ctaBody" defaultValue={value.ctaBody || ""} />
                </label>
                <label className={styles.label}>
                  <span>{FIELD_LABELS.defaultBlockCtaLabel}</span>
                  <input name="defaultBlockCtaLabel" defaultValue={value.defaultBlockCtaLabel || ""} />
                </label>
                <FilterableChecklist legend="Связанные услуги" name="serviceIds" options={relationOptions.services} selectedIds={value.serviceIds || []} />
                <FilterableChecklist legend="Связанные кейсы" name="caseIds" options={relationOptions.cases} selectedIds={value.caseIds || []} />
                <FilterableChecklist legend="Коллекции" name="galleryIds" options={relationOptions.galleries} selectedIds={value.galleryIds || []} />
                <MediaPicker legend="Основное медиа" name="primaryMediaAssetId" assets={mediaOptions} selectedIds={value.primaryMediaAssetId ? [value.primaryMediaAssetId] : []} hint={FIELD_HINTS.primaryMedia} />
              </>
            ) : null}

            {entityType !== "media_asset" ? <HiddenSeoFields value={value} /> : null}
            </>)}

            <div className={styles.inlineActions}>
              <button type="submit" className={styles.primaryButton}>{ADMIN_COPY.saveDraft}</button>
              {entityType === ENTITY_TYPES.SERVICE && canSubmit ? (
                <button
                  type="submit"
                  formAction="/api/admin/entities/service/landing-factory/generate"
                  className={styles.secondaryButton}
                >
                  Сгенерировать черновик
                </button>
              ) : null}
              {canSubmit && currentRevision?.state === "draft" ? (
                <button
                  type="submit"
                  formAction={`/api/admin/revisions/${currentRevision.id}/submit`}
                  className={styles.secondaryButton}
                >
                  {ADMIN_COPY.sendForReview}
                </button>
              ) : null}
              {canPublish && currentRevision?.state === "review" ? (
                <Link href={`/admin/revisions/${currentRevision.id}/publish`} className={styles.secondaryButton}>Проверить перед публикацией</Link>
              ) : null}
              {entityId ? <Link href={`/admin/entities/${entityType}/${entityId}/history`} className={styles.secondaryButton}>{ADMIN_COPY.openHistory}</Link> : null}
            </div>
          </form>
        </section>
        {obligations?.length ? (
          <section className={styles.panel}>
            <h3>Открытые обязательства</h3>
            <div className={styles.stack}>
              {obligations.map((obligation) => (
                <div key={obligation.id} className={styles.timelineItem}>
                  <strong>{OBLIGATION_LABELS[obligation.obligationType] || obligation.obligationType}</strong>
                  <p className={styles.mutedText}>{OBLIGATION_STATUS_LABELS[obligation.status] || obligation.status}</p>
                  {user.role === "superadmin" && obligation.status === "open" ? (
                    <form action={`/api/admin/obligations/${obligation.id}/complete`} method="post">
                      <input type="hidden" name="redirectTo" value={redirectTo} />
                      <button type="submit" className={styles.secondaryButton}>Отметить выполненным</button>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <div className={`${styles.stack} ${styles.stickyPanel} ${styles.editorRail}`}>
        <ReadinessPanel
          readiness={readiness}
          entityType={entityType}
          navigationContext="editor"
          panelId={`${entityType}-readiness`}
          fallbackAnchorId={getEditorFallbackAnchor(entityType)}
          fallbackLabel="Общий раздел исправления"
          defaultOpen={Boolean(readiness?.hasBlocking)}
        />
        <ServiceLandingWorkspacePanel
          entityType={entityType}
          memoryCard={workspaceMemoryCard}
        />
        <EvidenceRegisterPanel
          entityType={entityType}
          entityId={entityId}
          entityLabel={surfaceTitle}
          readiness={readiness}
          obligations={obligations}
          scope="editor"
        />
        <ServiceLandingFactoryPanel
          entityType={entityType}
          revision={currentRevision}
          readiness={readiness}
          auditItems={auditItems}
        />
        {activePublishedRevision ? (
          <section className={styles.panel}>
            <h3>{ADMIN_COPY.publishedRevision}</h3>
            <p className={styles.mutedText}>Версия №{activePublishedRevision.revisionNumber}</p>
          </section>
        ) : (
          <section className={styles.panel}>
            <h3>{ADMIN_COPY.publishedRevision}</h3>
            <p className={styles.mutedText}>{ADMIN_COPY.noPublishedRevision}</p>
          </section>
        )}
        <section className={styles.panel}>
          <h3>{ADMIN_COPY.auditTimeline}</h3>
          <TimelineList items={auditItems} />
        </section>
      </div>
    </div>
  );
}
