import Link from "next/link";

import { PAGE_SECTION_TYPES, PAGE_TYPES } from "../../lib/content-core/content-types.js";
import { normalizePageMediaSettings } from "../../lib/content-core/page-media.js";
import { PUBLIC_COPY, normalizeLegacyCopy } from "../../lib/ui-copy.js";
import { DEFAULT_LANDING_PAGE_THEME_KEY } from "../../lib/landing-composition/visual-semantics.js";
import styles from "./public-ui.module.css";

const THEME_CLASS_NAMES = Object.freeze({
  earth_sand: styles.themeEarthSand,
  forest_contrast: styles.themeForestContrast,
  slate_editorial: styles.themeSlateEditorial,
  graphite_industrial: styles.themeGraphiteIndustrial,
  night_signal: styles.themeNightSignal,
  concrete_blueprint: styles.themeConcreteBlueprint
});

const SURFACE_TONE_CLASS_NAMES = Object.freeze({
  plain: styles.sectionTonePlain,
  tinted: styles.sectionToneTinted,
  emphasis: styles.sectionToneEmphasis
});

const TEXT_EMPHASIS_CLASS_NAMES = Object.freeze({
  quiet: styles.textEmphasisQuiet,
  standard: styles.textEmphasisStandard,
  strong: styles.textEmphasisStrong
});

const HERO_MEDIA_LAYOUT_CLASS_NAMES = Object.freeze({
  stacked: styles.mediaHeroLayoutStacked,
  split: styles.mediaHeroLayoutSplit,
  cinematic: styles.mediaHeroLayoutCinematic
});

const GALLERY_LAYOUT_CLASS_NAMES = Object.freeze({
  grid: styles.galleryLayoutGrid,
  featured: styles.galleryLayoutFeatured,
  strip: styles.galleryLayoutStrip
});

const GALLERY_ASPECT_RATIO_CLASS_NAMES = Object.freeze({
  landscape: styles.galleryAspectLandscape,
  square: styles.galleryAspectSquare,
  portrait: styles.galleryAspectPortrait
});

function getThemeClassName(pageThemeKey) {
  return THEME_CLASS_NAMES[pageThemeKey || DEFAULT_LANDING_PAGE_THEME_KEY] ?? styles.themeEarthSand;
}

function getSurfaceToneClassName(surfaceTone = "plain") {
  return SURFACE_TONE_CLASS_NAMES[surfaceTone] ?? SURFACE_TONE_CLASS_NAMES.plain;
}

function getTextEmphasisClassName(textEmphasisPreset = "standard") {
  return TEXT_EMPHASIS_CLASS_NAMES[textEmphasisPreset] ?? TEXT_EMPHASIS_CLASS_NAMES.standard;
}

function getSectionClassName(baseClassNames, sectionLike = {}) {
  const classNames = Array.isArray(baseClassNames) ? baseClassNames : [baseClassNames];

  return [
    ...classNames,
    getSurfaceToneClassName(sectionLike.surfaceTone),
    getTextEmphasisClassName(sectionLike.textEmphasisPreset)
  ].filter(Boolean).join(" ");
}

function getHeroMediaLayoutClassName(layout = "stacked") {
  return HERO_MEDIA_LAYOUT_CLASS_NAMES[layout] || HERO_MEDIA_LAYOUT_CLASS_NAMES.stacked;
}

function getGalleryLayoutClassName(layout = "grid") {
  return GALLERY_LAYOUT_CLASS_NAMES[layout] || GALLERY_LAYOUT_CLASS_NAMES.grid;
}

function getGalleryAspectRatioClassName(aspectRatio = "landscape") {
  return GALLERY_ASPECT_RATIO_CLASS_NAMES[aspectRatio] || GALLERY_ASPECT_RATIO_CLASS_NAMES.landscape;
}

function MediaHero({
  asset,
  label = PUBLIC_COPY.mediaLabel,
  sectionId = "preview-media",
  sectionName = "media",
  sectionLike = {},
  heroLayout = "stacked"
}) {
  if (!asset) {
    return null;
  }

  return (
    <section
      id={sectionId}
      data-preview-section={sectionName}
      className={getSectionClassName([styles.mediaHero, styles.previewSection, getHeroMediaLayoutClassName(heroLayout)], sectionLike)}
    >
      <p className={styles.eyebrow}>{label}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset.previewUrl} alt={asset.alt || asset.title || PUBLIC_COPY.imageFallback} />
      <p className={styles.mediaCaption}>{asset.caption || asset.title || asset.originalFilename || PUBLIC_COPY.mediaFallback}</p>
    </section>
  );
}

function GallerySection({
  title,
  galleries,
  resolveGallery,
  sectionId = "preview-gallery",
  sectionName = "gallery",
  sectionLike = {},
  mediaSettings = {}
}) {
  const normalizedMediaSettings = normalizePageMediaSettings(mediaSettings);
  const galleryRecords = galleries
    .map((galleryId) => resolveGallery(galleryId))
    .filter(Boolean);

  const groupedCollections = normalizedMediaSettings.galleryGrouping === "by_collection"
    ? galleryRecords
      .map((gallery, index) => ({
        key: gallery.entityId || gallery.id || `gallery-${index}`,
        title: gallery.title || title || PUBLIC_COPY.galleryHeading,
        caption: gallery.caption || "",
        items: gallery.assets ?? []
      }))
      .filter((group) => group.items.length > 0)
    : [{
      key: "flat",
      title: title || PUBLIC_COPY.galleryHeading,
      caption: "",
      items: galleryRecords.flatMap((gallery) => gallery.assets ?? [])
    }];

  const hasGroupedCollections = groupedCollections.length > 1;
  const items = groupedCollections.flatMap((group) => group.items);

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      id={sectionId}
      data-preview-section={sectionName}
      className={getSectionClassName([styles.gallerySection, styles.previewSection], sectionLike)}
    >
      {title ? <h3>{title}</h3> : null}
      <div className={styles.galleryGroups}>
        {groupedCollections.map((group) => (
          <div key={group.key} className={styles.galleryGroup}>
            {hasGroupedCollections ? (
              <div className={styles.galleryGroupHead}>
                <h4>{group.title}</h4>
                {group.caption ? <p className={styles.note}>{group.caption}</p> : null}
              </div>
            ) : null}
            <div className={`${styles.gallery} ${getGalleryLayoutClassName(normalizedMediaSettings.galleryLayout)} ${getGalleryAspectRatioClassName(normalizedMediaSettings.galleryAspectRatio)}`}>
              {group.items.map((asset, index) => (
                <figure key={`${group.key}-${asset.entityId || asset.id || index}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.previewUrl} alt={asset.alt || asset.title || PUBLIC_COPY.imageFallback} />
                  {normalizedMediaSettings.showGalleryCaptions ? (
                    <figcaption className={styles.mediaCaption}>{asset.caption || asset.title || PUBLIC_COPY.mediaFallback}</figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PublicPageShell({ globalSettings, themeClassName = "", children }) {
  return (
    <div className={`${styles.publicShell} ${themeClassName}`}>
      <header className={styles.publicShellHeader}>
        <div>
          <p className={styles.publicShellEyebrow}>Публичная страница</p>
          <strong>{globalSettings?.publicBrandName || "Экостройконтинент"}</strong>
        </div>
        <div className={styles.publicShellMeta}>
          <span>{globalSettings?.primaryPhone || "Телефон не указан"}</span>
          <span>{globalSettings?.serviceArea || "География не указана"}</span>
        </div>
      </header>
      {children}
      <footer className={styles.publicShellFooter}>
        <strong>{globalSettings?.publicBrandName || "Экостройконтинент"}</strong>
        <span>{globalSettings?.publicEmail || "Почта не указана"}</span>
      </footer>
    </div>
  );
}

function getSection(page, type) {
  return (page.sections || []).find((section) => section.type === type) || null;
}

function renderPageSections({ page, globalSettings, services, equipment, cases, galleries }) {
  const sourceRefs = page.sourceRefs || {};
  const targeting = page.targeting || {};
  const mediaSettings = normalizePageMediaSettings(page.mediaSettings);
  const primaryService = sourceRefs.primaryServiceId ? services(sourceRefs.primaryServiceId) : null;
  const primaryEquipment = sourceRefs.primaryEquipmentId ? equipment(sourceRefs.primaryEquipmentId) : null;

  return (page.sections || []).map((section) => {
    switch (section.type) {
      case PAGE_SECTION_TYPES.RICH_TEXT:
        if (!section.body) {
          return null;
        }

        return (
          <section
            key={`${section.type}-${section.order}`}
            id={`preview-page-${section.type}-${section.order}`}
            data-preview-section={section.type}
            className={getSectionClassName([styles.card, styles.previewSection], section)}
          >
            {section.title ? <h2>{section.title}</h2> : null}
            <p>{section.body}</p>
          </section>
        );
      case PAGE_SECTION_TYPES.CONTACT_DETAILS:
        return (
          <section
            key={`${section.type}-${section.order}`}
            id={`preview-page-${section.type}-${section.order}`}
            data-preview-section={section.type}
            className={getSectionClassName([styles.card, styles.previewSection], section)}
          >
            <h2>{section.title || "Контакты"}</h2>
            {section.body ? <p>{section.body}</p> : null}
            <p>{globalSettings?.primaryPhone || PUBLIC_COPY.contactInfoFallback}</p>
            <p>{globalSettings?.serviceArea || PUBLIC_COPY.serviceAreaFallback}</p>
          </section>
        );
      case PAGE_SECTION_TYPES.SERVICE_SCOPE:
        return (
          <section
            key={`${section.type}-${section.order}`}
            id={`preview-page-${section.type}-${section.order}`}
            data-preview-section={section.type}
            className={getSectionClassName([styles.card, styles.previewSection], section)}
          >
            <h2>{section.title || "Что входит в услугу"}</h2>
            <p>{section.body || primaryService?.serviceScope || primaryService?.summary || "Описание пока не заполнено."}</p>
            {primaryService?.problemsSolved ? <p>{primaryService.problemsSolved}</p> : null}
          </section>
        );
      case PAGE_SECTION_TYPES.EQUIPMENT_SUMMARY:
        return (
          <section
            key={`${section.type}-${section.order}`}
            id={`preview-page-${section.type}-${section.order}`}
            data-preview-section={section.type}
            className={getSectionClassName([styles.card, styles.previewSection], section)}
          >
            <h2>{section.title || "О технике"}</h2>
            <p>{section.body || primaryEquipment?.capabilitySummary || primaryEquipment?.shortSummary || "Описание техники пока не заполнено."}</p>
          </section>
        );
      case PAGE_SECTION_TYPES.EQUIPMENT_SPECS: {
        const items = (section.items && section.items.length > 0 ? section.items : primaryEquipment?.keySpecs) || [];

        if (items.length === 0) {
          return null;
        }

        return (
          <section
            key={`${section.type}-${section.order}`}
            id={`preview-page-${section.type}-${section.order}`}
            data-preview-section={section.type}
            className={getSectionClassName([styles.card, styles.previewSection], section)}
          >
            <h2>{section.title || "Характеристики"}</h2>
            <ul className={styles.listing}>
              {items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        );
      }
      case PAGE_SECTION_TYPES.GEO_COVERAGE: {
        const geoBits = [
          section.body,
          targeting.geoLabel,
          targeting.city,
          targeting.district,
          targeting.serviceArea,
          globalSettings?.serviceArea
        ].filter(Boolean);

        return (
          <section
            key={`${section.type}-${section.order}`}
            id={`preview-page-${section.type}-${section.order}`}
            data-preview-section={section.type}
            className={getSectionClassName([styles.card, styles.previewSection], section)}
          >
            <h2>{section.title || "Где работаем"}</h2>
            <p>{geoBits.join(" · ") || "География пока не заполнена."}</p>
          </section>
        );
      }
      case PAGE_SECTION_TYPES.PROOF_CASES: {
        const caseItems = (section.caseIds || []).map((id) => cases(id)).filter(Boolean);
        const galleryIds = section.galleryIds || [];

        if (caseItems.length === 0 && galleryIds.length === 0) {
          return null;
        }

        return (
          <section
            key={`${section.type}-${section.order}`}
            id={`preview-page-${section.type}-${section.order}`}
            data-preview-section={section.type}
            className={getSectionClassName([styles.stack, styles.previewSection], section)}
          >
            {section.title ? <h2>{section.title}</h2> : null}
            {caseItems.length > 0 ? (
              <section className={styles.grid}>
                {caseItems.map((item) => (
                  <article key={item.entityId} className={getSectionClassName(styles.card, section)}>
                    <h3>{item.title}</h3>
                    <p>{item.result}</p>
                    <Link className={styles.actionLink} href={`/cases/${item.slug}`}>{PUBLIC_COPY.openCase}</Link>
                  </article>
                ))}
              </section>
            ) : null}
            <GallerySection
              title={caseItems.length > 0 ? "" : section.title || PUBLIC_COPY.galleryHeading}
              galleries={galleryIds}
              resolveGallery={galleries}
              sectionId={`preview-page-${section.type}-${section.order}-gallery`}
              sectionName={`${section.type}-gallery`}
              sectionLike={section}
              mediaSettings={mediaSettings}
            />
          </section>
        );
      }
      case PAGE_SECTION_TYPES.CTA:
        return (
          <section
            key={`${section.type}-${section.order}`}
            id={`preview-page-${section.type}-${section.order}`}
            data-preview-section={section.type}
            className={getSectionClassName([styles.card, styles.previewSection], section)}
          >
            <h2>{section.title || "Оставьте заявку"}</h2>
            <div className={styles.ctaRow}>
              <p className={styles.ctaCopy}>{section.body || globalSettings?.defaultCtaDescription || ""}</p>
              <p className={styles.ctaChip}>{section.ctaLabel || globalSettings?.defaultCtaLabel || PUBLIC_COPY.ctaFallback}</p>
            </div>
          </section>
        );
      default:
        return null;
    }
  });
}

export function PublicListPage({ eyebrow, title, intro, items, itemHrefPrefix }) {
  return (
    <div className={styles.publicShell}>
      <main className={styles.page}>
        <section
          id="preview-list-hero"
          data-preview-section="hero"
          className={getSectionClassName([styles.hero, styles.previewSection], { surfaceTone: "tinted", textEmphasisPreset: "strong" })}
        >
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1>{title}</h1>
          <p className={styles.note}>{intro}</p>
        </section>
        <section className={styles.grid}>
          {items.map((item) => (
            <article key={item.entityId} className={styles.card}>
              <h2>{item.title}</h2>
              <p>{normalizeLegacyCopy(item.summary || item.result || item.location || item.intro || PUBLIC_COPY.publishedEntityFallback)}</p>
              <Link className={styles.actionLink} href={`${itemHrefPrefix}/${item.slug}`}>{PUBLIC_COPY.listOpen}</Link>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

export function ServicePage({ service, relatedCases, galleries, resolveMedia, globalSettings }) {
  const primaryMedia = resolveMedia && service.primaryMediaAssetId ? resolveMedia(service.primaryMediaAssetId) : null;

  return (
    <PublicPageShell globalSettings={globalSettings}>
      <main className={styles.page}>
        <section
          id="preview-service-hero"
          data-preview-section="hero"
          className={getSectionClassName([styles.hero, styles.previewSection], { surfaceTone: "tinted", textEmphasisPreset: "strong" })}
        >
          <p className={styles.eyebrow}>{PUBLIC_COPY.serviceEyebrow}</p>
          <h1>{service.h1}</h1>
          <p>{service.summary}</p>
          <p className={styles.note}>{PUBLIC_COPY.ctaPrefix}: {service.ctaVariant || globalSettings?.defaultCtaLabel || PUBLIC_COPY.ctaFallback}</p>
        </section>
        <MediaHero asset={primaryMedia} sectionId="preview-service-media" sectionName="media" />
        <section
          id="preview-service-scope"
          data-preview-section="service-scope"
          className={getSectionClassName([styles.card, styles.previewSection], { surfaceTone: "plain", textEmphasisPreset: "standard" })}
        >
          <h2>{PUBLIC_COPY.serviceScopeHeading}</h2>
          <p>{service.serviceScope}</p>
          {service.problemsSolved ? <p>{service.problemsSolved}</p> : null}
          {service.methods ? <p>{service.methods}</p> : null}
        </section>
        {relatedCases.length > 0 ? (
          <section id="preview-service-related-cases" data-preview-section="related-cases" className={`${styles.grid} ${styles.previewSection}`}>
            {relatedCases.map((item) => (
              <article key={item.entityId} className={styles.card}>
                <h3>{item.title}</h3>
                <p>{item.result}</p>
                <Link className={styles.actionLink} href={`/cases/${item.slug}`}>{PUBLIC_COPY.openCase}</Link>
              </article>
            ))}
          </section>
        ) : null}
        <GallerySection
          title={PUBLIC_COPY.galleryHeading}
          galleries={service.galleryIds || []}
          resolveGallery={galleries}
          sectionId="preview-service-gallery"
          sectionName="gallery"
        />
      </main>
    </PublicPageShell>
  );
}

export function CasePage({ item, relatedServices, galleries, resolveMedia, globalSettings }) {
  const primaryMedia = resolveMedia && item.primaryMediaAssetId ? resolveMedia(item.primaryMediaAssetId) : null;

  return (
    <PublicPageShell globalSettings={globalSettings}>
      <main className={styles.page}>
        <section
          id="preview-case-hero"
          data-preview-section="hero"
          className={getSectionClassName([styles.hero, styles.previewSection], { surfaceTone: "tinted", textEmphasisPreset: "strong" })}
        >
          <p className={styles.eyebrow}>{PUBLIC_COPY.caseEyebrow}</p>
          <h1>{item.title}</h1>
          <p>{item.location}</p>
        </section>
        <MediaHero asset={primaryMedia} sectionId="preview-case-media" sectionName="media" />
        <section id="preview-case-core" data-preview-section="case-core" className={`${styles.grid} ${styles.previewSection}`}>
          <article className={styles.card}>
            <h3>{PUBLIC_COPY.taskHeading}</h3>
            <p>{item.task}</p>
          </article>
          <article className={styles.card}>
            <h3>{PUBLIC_COPY.workScopeHeading}</h3>
            <p>{item.workScope}</p>
          </article>
          <article className={styles.card}>
            <h3>{PUBLIC_COPY.resultHeading}</h3>
            <p>{item.result}</p>
          </article>
        </section>
        {relatedServices.length > 0 ? (
          <section id="preview-case-related-services" data-preview-section="related-services" className={`${styles.grid} ${styles.previewSection}`}>
            {relatedServices.map((service) => (
              <article key={service.entityId} className={styles.card}>
                <h3>{service.title}</h3>
                <p>{service.summary}</p>
                <Link className={styles.actionLink} href={`/services/${service.slug}`}>{PUBLIC_COPY.openService}</Link>
              </article>
            ))}
          </section>
        ) : null}
        <GallerySection
          title={PUBLIC_COPY.projectGalleryHeading}
          galleries={item.galleryIds || []}
          resolveGallery={galleries}
          sectionId="preview-case-gallery"
          sectionName="gallery"
        />
      </main>
    </PublicPageShell>
  );
}

export function StandalonePage({ page, globalSettings, services, equipment, cases, galleries, resolveMedia }) {
  const primaryMedia = resolveMedia && page.primaryMediaAssetId ? resolveMedia(page.primaryMediaAssetId) : null;
  const pageThemeClassName = getThemeClassName(page.pageThemeKey);
  const mediaSettings = normalizePageMediaSettings(page.mediaSettings);
  const heroSection = getSection(page, PAGE_SECTION_TYPES.HERO_OFFER);
  const sourceRefs = page.sourceRefs || {};
  const primaryService = sourceRefs.primaryServiceId ? services(sourceRefs.primaryServiceId) : null;
  const primaryEquipment = sourceRefs.primaryEquipmentId ? equipment?.(sourceRefs.primaryEquipmentId) : null;
  const showSplitHeroMedia = mediaSettings.heroLayout === "split" && primaryMedia;

  return (
    <PublicPageShell globalSettings={globalSettings} themeClassName={pageThemeClassName}>
      <main className={styles.page}>
        <section
          id="preview-page-hero"
          data-preview-section="hero"
          className={getSectionClassName(
            [styles.hero, styles.previewSection, showSplitHeroMedia ? styles.heroSplit : ""],
            heroSection || { surfaceTone: "tinted", textEmphasisPreset: "strong" }
          )}
        >
          <p className={styles.eyebrow}>
            {page.pageType === PAGE_TYPES.SERVICE_LANDING
              ? "Страница услуги"
              : page.pageType === PAGE_TYPES.EQUIPMENT_LANDING
                ? "Страница техники"
                : PUBLIC_COPY.pageEyebrow}
          </p>
          <h1>{page.h1}</h1>
          <p>{heroSection?.body || page.intro}</p>
          {heroSection?.trustText ? <p className={styles.note}>{heroSection.trustText}</p> : null}
          {page.pageType === PAGE_TYPES.SERVICE_LANDING && primaryService?.summary ? <p className={styles.note}>{primaryService.summary}</p> : null}
          {page.pageType === PAGE_TYPES.EQUIPMENT_LANDING && primaryEquipment?.shortSummary ? <p className={styles.note}>{primaryEquipment.shortSummary}</p> : null}
          {showSplitHeroMedia ? (
            <div className={styles.heroSplitMedia}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={primaryMedia.previewUrl} alt={primaryMedia.alt || primaryMedia.title || PUBLIC_COPY.imageFallback} />
              <p className={styles.mediaCaption}>{primaryMedia.caption || primaryMedia.title || primaryMedia.originalFilename || PUBLIC_COPY.mediaFallback}</p>
            </div>
          ) : null}
        </section>
        {showSplitHeroMedia ? null : (
          <MediaHero
            asset={primaryMedia}
            label={PUBLIC_COPY.mediaLabel}
            sectionId="preview-page-media"
            sectionName="media"
            heroLayout={mediaSettings.heroLayout}
          />
        )}
        <section id="preview-page-blocks" data-preview-section="page-blocks" className={`${styles.stack} ${styles.previewSection}`}>
          {renderPageSections({
            page,
            globalSettings,
            services,
            equipment: equipment || (() => null),
            cases,
            galleries
          })}
        </section>
      </main>
    </PublicPageShell>
  );
}
