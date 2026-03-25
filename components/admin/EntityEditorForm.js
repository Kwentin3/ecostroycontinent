import Link from "next/link";

import { FilterableChecklist } from "./FilterableChecklist";
import { MediaPicker } from "./MediaPicker";
import { ReadinessPanel } from "./ReadinessPanel";
import { TimelineList } from "./TimelineList";
import styles from "./admin-ui.module.css";

function HiddenSeoFields({ value }) {
  return (
    <>
      <label className={styles.label}>
        <span>Meta title</span>
        <input name="metaTitle" defaultValue={value.seo?.metaTitle || ""} />
      </label>
      <label className={styles.label}>
        <span>Meta description</span>
        <textarea name="metaDescription" defaultValue={value.seo?.metaDescription || ""} />
      </label>
      <label className={styles.label}>
        <span>Canonical intent</span>
        <input name="canonicalIntent" defaultValue={value.seo?.canonicalIntent || ""} />
      </label>
      <label className={styles.label}>
        <span>Indexation</span>
        <select name="indexationFlag" defaultValue={value.seo?.indexationFlag || "index"}>
          <option value="index">index</option>
          <option value="noindex">noindex</option>
        </select>
      </label>
      <label className={styles.label}>
        <span>OpenGraph title</span>
        <input name="openGraphTitle" defaultValue={value.seo?.openGraphTitle || ""} />
      </label>
      <label className={styles.label}>
        <span>OpenGraph description</span>
        <textarea name="openGraphDescription" defaultValue={value.seo?.openGraphDescription || ""} />
      </label>
      <input type="hidden" name="openGraphImageAssetId" value={value.seo?.openGraphImageAssetId || ""} />
    </>
  );
}

function renderMediaUpload(redirectTo) {
  return (
    <section className={`${styles.panel} ${styles.panelMuted}`}>
      <h3>Быстрая загрузка медиа</h3>
      <p className={styles.helpText}>Загрузка остаётся inline, а новый asset появляется в picker после redirect.</p>
      <form action="/api/admin/media/upload" method="post" encType="multipart/form-data" className={styles.formGrid}>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <label className={styles.label}>
          <span>File</span>
          <input type="file" name="file" accept="image/*" required />
        </label>
        <label className={styles.label}>
          <span>Title</span>
          <input name="title" />
        </label>
        <label className={styles.label}>
          <span>Alt</span>
          <input name="alt" />
        </label>
        <label className={styles.label}>
          <span>Ownership note</span>
          <input name="ownershipNote" />
        </label>
        <label className={styles.label}>
          <span>Source note</span>
          <input name="sourceNote" />
        </label>
        <button type="submit" className={styles.secondaryButton}>Загрузить и опубликовать asset</button>
      </form>
    </section>
  );
}

export function EntityEditorForm({
  entityType,
  entityId,
  value,
  currentRevision,
  activePublishedRevision,
  readiness,
  auditItems,
  obligations,
  relationOptions,
  mediaOptions,
  user,
  message,
  error
}) {
  const redirectTo = entityId ? `/admin/entities/${entityType}/${entityId}` : `/admin/entities/${entityType}`;
  const canPublish = user.role === "superadmin";
  const canSubmit = user.role === "superadmin" || user.role === "seo_manager";

  return (
    <div className={styles.split}>
      <div className={styles.stack}>
        {message ? <div className={styles.statusPanelInfo}>{message}</div> : null}
        {error ? <div className={styles.statusPanelBlocking}>{error}</div> : null}
        <section className={styles.panel}>
          <form action={`/api/admin/entities/${entityType}/save`} method="post" className={styles.formGrid}>
            <input type="hidden" name="entityId" value={entityId || ""} />
            <label className={styles.label}>
              <span>Смысл изменения</span>
              <input name="changeIntent" defaultValue={currentRevision?.changeIntent || "Draft saved from editor."} required />
            </label>

            {entityType === "global_settings" ? (
              <div className={styles.gridTwo}>
                <label className={styles.label}>
                  <span>Public brand name</span>
                  <input name="publicBrandName" defaultValue={value.publicBrandName || ""} required />
                </label>
                <label className={styles.label}>
                  <span>Legal name</span>
                  <input name="legalName" defaultValue={value.legalName || ""} required />
                </label>
                <label className={styles.label}>
                  <span>Primary phone</span>
                  <input name="primaryPhone" defaultValue={value.primaryPhone || ""} />
                </label>
                <label className={styles.label}>
                  <span>Public email</span>
                  <input name="publicEmail" defaultValue={value.publicEmail || ""} />
                </label>
                <label className={styles.label}>
                  <span>Service area</span>
                  <input name="serviceArea" defaultValue={value.serviceArea || ""} />
                </label>
                <label className={styles.label}>
                  <span>Primary region</span>
                  <input name="primaryRegion" defaultValue={value.primaryRegion || ""} />
                </label>
                <label className={styles.label}>
                  <span>Default CTA label</span>
                  <input name="defaultCtaLabel" defaultValue={value.defaultCtaLabel || ""} />
                </label>
                <label className={styles.label}>
                  <span>Default CTA description</span>
                  <textarea name="defaultCtaDescription" defaultValue={value.defaultCtaDescription || ""} />
                </label>
                <label className={styles.label}>
                  <span>Organization city</span>
                  <input name="organizationCity" defaultValue={value.organization?.city || ""} />
                </label>
                <label className={styles.label}>
                  <span>Organization country</span>
                  <input name="organizationCountry" defaultValue={value.organization?.country || ""} />
                </label>
                <label className={styles.label}>
                  <span>Active messenger</span>
                  <select name="activeMessengers" defaultValue={value.activeMessengers?.[0] || ""}>
                    <option value="">none</option>
                    <option value="telegram">telegram</option>
                    <option value="whatsapp">whatsapp</option>
                  </select>
                </label>
                <label className={styles.label}>
                  <span>Contact truth confirmed</span>
                  <input type="checkbox" name="contactTruthConfirmed" defaultChecked={Boolean(value.contactTruthConfirmed)} />
                </label>
              </div>
            ) : null}

            {entityType === "media_asset" ? (
              <div className={styles.gridTwo}>
                <label className={styles.label}>
                  <span>Title</span>
                  <input name="title" defaultValue={value.title || ""} />
                </label>
                <label className={styles.label}>
                  <span>Alt</span>
                  <input name="alt" defaultValue={value.alt || ""} />
                </label>
                <label className={styles.label}>
                  <span>Caption</span>
                  <textarea name="caption" defaultValue={value.caption || ""} />
                </label>
                <label className={styles.label}>
                  <span>Ownership note</span>
                  <input name="ownershipNote" defaultValue={value.ownershipNote || ""} />
                </label>
                <label className={styles.label}>
                  <span>Source note</span>
                  <input name="sourceNote" defaultValue={value.sourceNote || ""} />
                </label>
                <label className={styles.label}>
                  <span>Status</span>
                  <select name="status" defaultValue={value.status || "ready"}>
                    <option value="draft_asset">draft_asset</option>
                    <option value="ready">ready</option>
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
                  <span>Title</span>
                  <input name="title" defaultValue={value.title || ""} required />
                </label>
                <label className={styles.label}>
                  <span>Caption</span>
                  <textarea name="caption" defaultValue={value.caption || ""} />
                </label>
                <MediaPicker
                  legend="Gallery assets"
                  name="assetIds"
                  assets={mediaOptions}
                  selectedIds={value.assetIds || []}
                  selectionMode="multiple"
                />
                <MediaPicker
                  legend="Primary asset"
                  name="primaryAssetId"
                  assets={mediaOptions}
                  selectedIds={value.primaryAssetId ? [value.primaryAssetId] : []}
                  selectionMode="single"
                />
              </>
            ) : null}

            {entityType === "service" ? (
              <>
                <div className={styles.gridTwo}>
                  <label className={styles.label}>
                    <span>Slug</span>
                    <input name="slug" defaultValue={value.slug || ""} required />
                  </label>
                  <label className={styles.label}>
                    <span>Title</span>
                    <input name="title" defaultValue={value.title || ""} required />
                  </label>
                  <label className={styles.label}>
                    <span>H1</span>
                    <input name="h1" defaultValue={value.h1 || ""} required />
                  </label>
                  <label className={styles.label}>
                    <span>CTA variant</span>
                    <input name="ctaVariant" defaultValue={value.ctaVariant || ""} required />
                  </label>
                </div>
                <label className={styles.label}>
                  <span>Summary</span>
                  <textarea name="summary" defaultValue={value.summary || ""} required />
                </label>
                <label className={styles.label}>
                  <span>Service scope</span>
                  <textarea name="serviceScope" defaultValue={value.serviceScope || ""} required />
                </label>
                <label className={styles.label}>
                  <span>Problems solved</span>
                  <textarea name="problemsSolved" defaultValue={value.problemsSolved || ""} />
                </label>
                <label className={styles.label}>
                  <span>Methods</span>
                  <textarea name="methods" defaultValue={value.methods || ""} />
                </label>
                <FilterableChecklist legend="Related cases" name="relatedCaseIds" options={relationOptions.cases} selectedIds={value.relatedCaseIds || []} />
                <FilterableChecklist legend="Galleries" name="galleryIds" options={relationOptions.galleries} selectedIds={value.galleryIds || []} />
                <MediaPicker legend="Primary media" name="primaryMediaAssetId" assets={mediaOptions} selectedIds={value.primaryMediaAssetId ? [value.primaryMediaAssetId] : []} />
              </>
            ) : null}

            {entityType === "case" ? (
              <>
                <div className={styles.gridTwo}>
                  <label className={styles.label}>
                    <span>Slug</span>
                    <input name="slug" defaultValue={value.slug || ""} required />
                  </label>
                  <label className={styles.label}>
                    <span>Title</span>
                    <input name="title" defaultValue={value.title || ""} required />
                  </label>
                  <label className={styles.label}>
                    <span>Location</span>
                    <input name="location" defaultValue={value.location || ""} required />
                  </label>
                  <label className={styles.label}>
                    <span>Project type</span>
                    <input name="projectType" defaultValue={value.projectType || ""} />
                  </label>
                </div>
                <label className={styles.label}>
                  <span>Task</span>
                  <textarea name="task" defaultValue={value.task || ""} required />
                </label>
                <label className={styles.label}>
                  <span>Work scope</span>
                  <textarea name="workScope" defaultValue={value.workScope || ""} required />
                </label>
                <label className={styles.label}>
                  <span>Result</span>
                  <textarea name="result" defaultValue={value.result || ""} required />
                </label>
                <FilterableChecklist legend="Related services" name="serviceIds" options={relationOptions.services} selectedIds={value.serviceIds || []} />
                <FilterableChecklist legend="Galleries" name="galleryIds" options={relationOptions.galleries} selectedIds={value.galleryIds || []} />
                <MediaPicker legend="Primary media" name="primaryMediaAssetId" assets={mediaOptions} selectedIds={value.primaryMediaAssetId ? [value.primaryMediaAssetId] : []} />
              </>
            ) : null}

            {entityType === "page" ? (
              <>
                <div className={styles.gridTwo}>
                  <label className={styles.label}>
                    <span>Page type</span>
                    <select name="pageType" defaultValue={value.pageType || "about"}>
                      <option value="about">about</option>
                      <option value="contacts">contacts</option>
                    </select>
                  </label>
                  <label className={styles.label}>
                    <span>Title</span>
                    <input name="title" defaultValue={value.title || ""} required />
                  </label>
                  <label className={styles.label}>
                    <span>H1</span>
                    <input name="h1" defaultValue={value.h1 || ""} required />
                  </label>
                </div>
                <label className={styles.label}>
                  <span>Intro</span>
                  <textarea name="intro" defaultValue={value.intro || ""} />
                </label>
                <label className={styles.label}>
                  <span>Body</span>
                  <textarea name="body" defaultValue={value.body || ""} />
                </label>
                <label className={styles.label}>
                  <span>Contacts note</span>
                  <textarea name="contactNote" defaultValue={value.contactNote || ""} />
                </label>
                <label className={styles.label}>
                  <span>CTA title</span>
                  <input name="ctaTitle" defaultValue={value.ctaTitle || ""} />
                </label>
                <label className={styles.label}>
                  <span>CTA body</span>
                  <textarea name="ctaBody" defaultValue={value.ctaBody || ""} />
                </label>
                <label className={styles.label}>
                  <span>Default block CTA label</span>
                  <input name="defaultBlockCtaLabel" defaultValue={value.defaultBlockCtaLabel || ""} />
                </label>
                <FilterableChecklist legend="Linked services" name="serviceIds" options={relationOptions.services} selectedIds={value.serviceIds || []} />
                <FilterableChecklist legend="Linked cases" name="caseIds" options={relationOptions.cases} selectedIds={value.caseIds || []} />
                <FilterableChecklist legend="Linked galleries" name="galleryIds" options={relationOptions.galleries} selectedIds={value.galleryIds || []} />
                <MediaPicker legend="Primary media" name="primaryMediaAssetId" assets={mediaOptions} selectedIds={value.primaryMediaAssetId ? [value.primaryMediaAssetId] : []} />
              </>
            ) : null}

            <HiddenSeoFields value={value} />

            <div className={styles.inlineActions}>
              <button type="submit" className={styles.primaryButton}>Сохранить черновик</button>
              {canSubmit && currentRevision?.state === "draft" ? (
                <button
                  type="submit"
                  formAction={`/api/admin/revisions/${currentRevision.id}/submit`}
                  className={styles.secondaryButton}
                >
                  Отправить на review
                </button>
              ) : null}
              {canPublish && currentRevision?.state === "review" ? (
                <Link href={`/admin/revisions/${currentRevision.id}/publish`} className={styles.secondaryButton}>Готовность к публикации</Link>
              ) : null}
              {entityId ? <Link href={`/admin/entities/${entityType}/${entityId}/history`} className={styles.secondaryButton}>История</Link> : null}
            </div>
          </form>
        </section>
        {entityType !== "global_settings" ? renderMediaUpload(redirectTo) : null}
        {obligations?.length ? (
          <section className={styles.panel}>
            <h3>Открытые обязательства</h3>
            <div className={styles.stack}>
              {obligations.map((obligation) => (
                <div key={obligation.id} className={styles.timelineItem}>
                  <strong>{obligation.obligationType}</strong>
                  <p className={styles.mutedText}>{obligation.status}</p>
                  {user.role === "superadmin" && obligation.status === "open" ? (
                    <form action={`/api/admin/obligations/${obligation.id}/complete`} method="post">
                      <input type="hidden" name="redirectTo" value={redirectTo} />
                      <button type="submit" className={styles.secondaryButton}>Пометить выполненным</button>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <div className={`${styles.stack} ${styles.stickyPanel}`}>
        <ReadinessPanel readiness={readiness} title="Readiness в потоке" />
        {activePublishedRevision ? (
          <section className={styles.panel}>
            <h3>Опубликованная ревизия</h3>
            <p className={styles.mutedText}>Revision {activePublishedRevision.revisionNumber}</p>
          </section>
        ) : (
          <section className={styles.panel}>
            <h3>Опубликованная ревизия</h3>
            <p className={styles.mutedText}>Сущность ещё не была опубликована.</p>
          </section>
        )}
        <section className={styles.panel}>
          <h3>Audit timeline</h3>
          <TimelineList items={auditItems} />
        </section>
      </div>
    </div>
  );
}
