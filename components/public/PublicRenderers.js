import Link from "next/link";

import { PAGE_SECTION_TYPES, PAGE_TYPES } from "../../lib/content-core/content-types.js";
import { normalizePageMediaSettings } from "../../lib/content-core/page-media.js";
import { PUBLIC_COPY, normalizeLegacyCopy } from "../../lib/ui-copy.js";
import { DEFAULT_LANDING_PAGE_THEME_KEY } from "../../lib/landing-composition/visual-semantics.js";
import {
  buildPublicBreadcrumbs,
  buildServiceQuickLinks,
  getPublicNavItems,
  resolvePublicNavSection
} from "../../lib/public-launch/navigation.js";
import { buildPublicContactProjection } from "../../lib/public-launch/contact-projection.js";
import { PLACEHOLDER_MARKER_TEXT } from "../../lib/public-launch/placeholder-mode.js";
import {
  buildBreadcrumbStructuredData,
  buildLocalBusinessStructuredData,
  serializeStructuredData
} from "../../lib/public-launch/seo-structured-data.js";
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

const UNDER_CONSTRUCTION_MOSAIC_TILES = Object.freeze([
  {
    key: "lead",
    className: styles.mosaicLead,
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80"
  },
  {
    key: "support-left",
    className: styles.mosaicSupportLeft,
    imageUrl: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80"
  },
  {
    key: "support-right",
    className: styles.mosaicSupportRight,
    imageUrl: "https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=900&q=80"
  }
]);

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
  mediaSettings = {},
  pageType = PAGE_TYPES.ABOUT
}) {
  const normalizedMediaSettings = normalizePageMediaSettings(mediaSettings, pageType);
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

function Breadcrumbs({ items }) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.key || `${item.label}-${index}`}>
              {item.href && !isLast ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ContactAction({
  action,
  className,
  defaultLabel = "Открыть контакты"
}) {
  if (!action?.href) {
    return null;
  }

  const label = action.label || defaultLabel;
  const href = action.href;

  if (href.startsWith("/") || href.startsWith("#")) {
    return <Link className={className} href={href}>{label}</Link>;
  }

  return <a className={className} href={href}>{label}</a>;
}

function StructuredDataScripts({ items }) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <>
      {items.map((item, index) => (
        <script
          key={`${item.kind || "schema"}-${index}`}
          type="application/ld+json"
          data-schema-kind={item.kind || "schema"}
          dangerouslySetInnerHTML={{ __html: serializeStructuredData(item.payload) }}
        />
      ))}
    </>
  );
}

export function PublicPageShell({
  globalSettings,
  themeClassName = "",
  currentPath = "/",
  breadcrumbs = [],
  serviceLinks = [],
  allowStructuredData = true,
  placeholderMarker = false,
  children
}) {
  const navItems = getPublicNavItems();
  const activeSection = resolvePublicNavSection(currentPath);
  const quickServiceLinks = buildServiceQuickLinks(serviceLinks, { limit: 8 });
  const resolvedBreadcrumbs = Array.isArray(breadcrumbs) ? breadcrumbs : [];
  const contactProjection = buildPublicContactProjection(globalSettings, { currentPath });
  const breadcrumbStructuredData = allowStructuredData
    ? buildBreadcrumbStructuredData({
      breadcrumbs: resolvedBreadcrumbs,
      currentPath
    })
    : null;
  const localBusinessStructuredData = allowStructuredData
    ? buildLocalBusinessStructuredData({
      globalSettings,
      contactProjection
    })
    : null;
  const structuredDataItems = [breadcrumbStructuredData, localBusinessStructuredData].filter(Boolean);

  return (
    <div
      className={`${styles.publicShell} ${themeClassName}`}
      data-contact-binding-mode={contactProjection.bindingMode}
      data-contact-readiness={contactProjection.readiness.code}
      data-contact-consistency-token={contactProjection.consistencyToken}
    >
      <StructuredDataScripts items={structuredDataItems} />
      <header className={styles.publicShellHeader}>
        <div className={styles.publicShellBrand}>
          <p className={styles.publicShellEyebrow}>Публичный сайт</p>
          <strong>{globalSettings?.publicBrandName || "Экостройконтинент"}</strong>
        </div>
        <nav className={styles.publicShellNav} aria-label="Главная навигация">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`${styles.publicShellNavLink} ${activeSection === item.key ? styles.publicShellNavLinkActive : ""}`.trim()}
              aria-current={activeSection === item.key ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.publicShellMeta}>
          <span>{contactProjection.displayPhone}</span>
          <span>{contactProjection.displayRegion}</span>
        </div>
      </header>
      {quickServiceLinks.length > 0 ? (
        <details className={styles.servicesQuickAccess}>
          <summary>Быстрый доступ к услугам</summary>
          <ul>
            {quickServiceLinks.map((item) => (
              <li key={item.key}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {placeholderMarker ? (
        <div className={styles.placeholderMarker} role="note" aria-label="Техническая метка заглушки">
          {PLACEHOLDER_MARKER_TEXT}
        </div>
      ) : null}
      <Breadcrumbs items={resolvedBreadcrumbs} />
      {children}
      <footer className={styles.publicShellFooter}>
        <strong>{globalSettings?.publicBrandName || "Экостройконтинент"}</strong>
        <nav className={styles.publicShellFooterNav} aria-label="Навигация в подвале">
          {navItems.map((item) => (
            <Link key={`footer-${item.key}`} href={item.href} className={styles.publicShellFooterLink}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.publicShellMeta}>
          <span>{contactProjection.displayEmail}</span>
          <span>{contactProjection.displayPhone}</span>
        </div>
      </footer>
    </div>
  );
}

function getSection(page, type) {
  return (page.sections || []).find((section) => section.type === type) || null;
}

function renderPageSections({ page, globalSettings, services, equipment, cases, galleries, contactProjection }) {
  const sourceRefs = page.sourceRefs || {};
  const targeting = page.targeting || {};
  const mediaSettings = normalizePageMediaSettings(page.mediaSettings, page.pageType);
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
            <h2>{section.title || "РљРѕРЅС‚Р°РєС‚С‹"}</h2>
            {section.body ? <p>{section.body}</p> : null}
            <p>{contactProjection?.displayPhone || PUBLIC_COPY.contactInfoFallback}</p>
            <p>{contactProjection?.displayRegion || PUBLIC_COPY.serviceAreaFallback}</p>
            <p className={styles.note}>{contactProjection?.readiness?.message}</p>
            <div className={styles.linkRow}>
              <ContactAction
                action={contactProjection?.primaryAction}
                className={styles.actionLink}
                defaultLabel={PUBLIC_COPY.ctaFallback}
              />
              {contactProjection?.secondaryActions?.map((action) => (
                <ContactAction
                  key={action.key || action.href}
                  action={action}
                  className={styles.actionLinkSecondary}
                  defaultLabel={PUBLIC_COPY.ctaFallback}
                />
              ))}
            </div>
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
            <h2>{section.title || "Р§С‚Рѕ РІС…РѕРґРёС‚ РІ СѓСЃР»СѓРіСѓ"}</h2>
            <p>{section.body || primaryService?.serviceScope || primaryService?.summary || "РћРїРёСЃР°РЅРёРµ РїРѕРєР° РЅРµ Р·Р°РїРѕР»РЅРµРЅРѕ."}</p>
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
            <h2>{section.title || "Рћ С‚РµС…РЅРёРєРµ"}</h2>
            <p>{section.body || primaryEquipment?.capabilitySummary || primaryEquipment?.shortSummary || "РћРїРёСЃР°РЅРёРµ С‚РµС…РЅРёРєРё РїРѕРєР° РЅРµ Р·Р°РїРѕР»РЅРµРЅРѕ."}</p>
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
            <h2>{section.title || "РҐР°СЂР°РєС‚РµСЂРёСЃС‚РёРєРё"}</h2>
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
            <h2>{section.title || "Р“РґРµ СЂР°Р±РѕС‚Р°РµРј"}</h2>
            <p>{geoBits.join(" В· ") || "Р“РµРѕРіСЂР°С„РёСЏ РїРѕРєР° РЅРµ Р·Р°РїРѕР»РЅРµРЅР°."}</p>
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
              pageType={page.pageType}
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
            <h2>{section.title || "РћСЃС‚Р°РІСЊС‚Рµ Р·Р°СЏРІРєСѓ"}</h2>
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

export function PublicListPage({
  eyebrow,
  title,
  intro,
  items,
  itemHrefPrefix,
  globalSettings = null,
  currentPath = "/",
  serviceLinks = [],
  placeholderMarker = false,
  breadcrumbs = null,
  emptyTitle = "Пока нет опубликованных материалов",
  emptyDescription = "Раздел не содержит опубликованных сущностей в текущем режиме.",
  emptyActionHref = "",
  emptyActionLabel = "",
  nextStepTitle = "",
  nextStepDescription = "",
  nextStepPrimaryHref = "",
  nextStepPrimaryLabel = "",
  nextStepSecondaryHref = "",
  nextStepSecondaryLabel = "",
  nextStepTone = "plain",
  allowStructuredData = true
}) {
  const trail = Array.isArray(breadcrumbs)
    ? breadcrumbs
    : buildPublicBreadcrumbs({ pathname: currentPath, pageTitle: title });
  const listItems = Array.isArray(items)
    ? items.filter((item) => item?.slug && item?.title)
    : [];
  const hasNextStep = Boolean(nextStepTitle || nextStepDescription || nextStepPrimaryHref || nextStepSecondaryHref);

  return (
    <PublicPageShell
      globalSettings={globalSettings}
      currentPath={currentPath}
      breadcrumbs={trail}
      serviceLinks={serviceLinks}
      allowStructuredData={allowStructuredData}
      placeholderMarker={placeholderMarker}
    >
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
        {listItems.length > 0 ? (
          <section className={styles.grid}>
            {listItems.map((item) => (
              <article key={item.entityId || item.slug} className={styles.card}>
                <h2>{item.title}</h2>
                <p>{normalizeLegacyCopy(item.summary || item.result || item.location || item.intro || PUBLIC_COPY.publishedEntityFallback)}</p>
                <Link className={styles.actionLink} href={`${itemHrefPrefix}/${item.slug}`}>{PUBLIC_COPY.listOpen}</Link>
              </article>
            ))}
          </section>
        ) : (
          <section className={`${styles.card} ${styles.previewSection} ${styles.sectionTonePlain}`}>
            <h2>{emptyTitle}</h2>
            <p className={styles.note}>{emptyDescription}</p>
            {emptyActionHref && emptyActionLabel ? (
              <div className={styles.linkRow}>
                <Link className={styles.actionLink} href={emptyActionHref}>{emptyActionLabel}</Link>
              </div>
            ) : null}
          </section>
        )}
        {hasNextStep ? (
          <section
            id="preview-list-next-steps"
            data-preview-section="next-steps"
            className={getSectionClassName([styles.card, styles.previewSection], { surfaceTone: nextStepTone, textEmphasisPreset: "standard" })}
          >
            {nextStepTitle ? <h2>{nextStepTitle}</h2> : null}
            {nextStepDescription ? <p className={styles.note}>{nextStepDescription}</p> : null}
            {nextStepPrimaryHref || nextStepSecondaryHref ? (
              <div className={styles.linkRow}>
                {nextStepPrimaryHref && nextStepPrimaryLabel ? (
                  <Link className={styles.actionLink} href={nextStepPrimaryHref}>{nextStepPrimaryLabel}</Link>
                ) : null}
                {nextStepSecondaryHref && nextStepSecondaryLabel ? (
                  <Link className={styles.actionLinkSecondary} href={nextStepSecondaryHref}>{nextStepSecondaryLabel}</Link>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </PublicPageShell>
  );
}

export function PublicHoldingPage({
  globalSettings = null,
  currentPath = "/",
  serviceLinks = []
}) {
  return (
    <main className={styles.homeShell}>
      <Link href="/admin/login" className={styles.loginIcon} aria-label="Войти в админку" title="Войти в админку">
        ↗
      </Link>

      <section className={styles.homeCopy} id="preview-holding-hero" data-preview-section="holding-hero">
        <p className={styles.eyebrow}>Экостройконтинент</p>
        <h1 className={styles.homeTitle}>Экостройконтинент</h1>
        <p className={styles.homeStatus}>В разработке</p>
      </section>

      <section
        className={styles.homeMosaic}
        id="preview-holding-status"
        data-preview-section="holding-status"
        aria-label="Подборка изображений для режима в разработке"
      >
        {UNDER_CONSTRUCTION_MOSAIC_TILES.map((tile) => (
          <article
            key={tile.key}
            className={`${styles.mosaicCard} ${tile.className}`}
            style={{ "--tile-image": `url("${tile.imageUrl}")` }}
            aria-hidden="true"
          />
        ))}
      </section>
    </main>
  );
}

export function ServicePage({
  service,
  relatedCases,
  galleries,
  resolveMedia,
  globalSettings,
  serviceLinks = [],
  allowStructuredData = true,
  placeholderMarker = false
}) {
  const primaryMedia = resolveMedia && service.primaryMediaAssetId ? resolveMedia(service.primaryMediaAssetId) : null;
  const currentPath = `/services/${service.slug}`;
  const trail = buildPublicBreadcrumbs({ pathname: currentPath, pageTitle: service.h1 || service.title });
  const contactProjection = buildPublicContactProjection(globalSettings, { currentPath });

  return (
    <PublicPageShell
      globalSettings={globalSettings}
      currentPath={currentPath}
      breadcrumbs={trail}
      serviceLinks={serviceLinks}
      allowStructuredData={allowStructuredData}
      placeholderMarker={placeholderMarker}
    >
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
        <section id="preview-service-next-steps" data-preview-section="next-steps" className={`${styles.card} ${styles.previewSection}`}>
          <h2>Следующий шаг</h2>
          <p className={styles.note}>{contactProjection.defaultCtaDescription}</p>
          <div className={styles.linkRow}>
            <ContactAction action={contactProjection.primaryAction} className={styles.actionLink} defaultLabel={PUBLIC_COPY.ctaFallback} />
            {contactProjection.secondaryActions.map((action) => (
              <ContactAction
                key={action.key || action.href}
                action={action}
                className={styles.actionLinkSecondary}
                defaultLabel={PUBLIC_COPY.ctaFallback}
              />
            ))}
            <Link className={styles.actionLink} href="/cases">Смотреть кейсы</Link>
            <Link className={styles.actionLinkSecondary} href="/contacts">Связаться</Link>
          </div>
        </section>
      </main>
    </PublicPageShell>
  );
}

export function CasePage({
  item,
  relatedServices,
  galleries,
  resolveMedia,
  globalSettings,
  serviceLinks = [],
  allowStructuredData = true,
  placeholderMarker = false
}) {
  const primaryMedia = resolveMedia && item.primaryMediaAssetId ? resolveMedia(item.primaryMediaAssetId) : null;
  const trail = buildPublicBreadcrumbs({ pathname: `/cases/${item.slug}`, pageTitle: item.title });

  return (
    <PublicPageShell
      globalSettings={globalSettings}
      currentPath={`/cases/${item.slug}`}
      breadcrumbs={trail}
      serviceLinks={serviceLinks}
      allowStructuredData={allowStructuredData}
      placeholderMarker={placeholderMarker}
    >
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
        <section id="preview-case-next-steps" data-preview-section="next-steps" className={`${styles.card} ${styles.previewSection}`}>
          <h2>Следующий шаг</h2>
          <p className={styles.note}>Выберите релевантную услугу или перейдите к контакту для запроса.</p>
          <div className={styles.linkRow}>
            <Link className={styles.actionLink} href="/services">Перейти к услугам</Link>
            <Link className={styles.actionLinkSecondary} href="/contacts">Оставить заявку</Link>
          </div>
        </section>
      </main>
    </PublicPageShell>
  );
}

export function StandalonePage({
  page,
  globalSettings,
  services,
  equipment,
  cases,
  galleries,
  resolveMedia,
  serviceLinks = [],
  allowStructuredData = true,
  placeholderMarker = false
}) {
  const primaryMedia = resolveMedia && page.primaryMediaAssetId ? resolveMedia(page.primaryMediaAssetId) : null;
  const pageThemeClassName = getThemeClassName(page.pageThemeKey);
  const mediaSettings = normalizePageMediaSettings(page.mediaSettings, page.pageType);
  const heroSection = getSection(page, PAGE_SECTION_TYPES.HERO_OFFER);
  const sourceRefs = page.sourceRefs || {};
  const primaryService = sourceRefs.primaryServiceId ? services(sourceRefs.primaryServiceId) : null;
  const primaryEquipment = sourceRefs.primaryEquipmentId ? equipment?.(sourceRefs.primaryEquipmentId) : null;
  const showSplitHeroMedia = mediaSettings.heroLayout === "split" && primaryMedia;
  const currentPath = page.pageType === PAGE_TYPES.CONTACTS
    ? "/contacts"
    : page.pageType === PAGE_TYPES.ABOUT
      ? "/about"
      : "/";
  const trail = buildPublicBreadcrumbs({ pathname: currentPath, pageTitle: page.h1 || page.title });
  const contactProjection = buildPublicContactProjection(globalSettings, { currentPath });

  return (
    <PublicPageShell
      globalSettings={globalSettings}
      themeClassName={pageThemeClassName}
      currentPath={currentPath}
      breadcrumbs={trail}
      serviceLinks={serviceLinks}
      allowStructuredData={allowStructuredData}
      placeholderMarker={placeholderMarker}
    >
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
              ? "РЎС‚СЂР°РЅРёС†Р° СѓСЃР»СѓРіРё"
              : page.pageType === PAGE_TYPES.EQUIPMENT_LANDING
                ? "РЎС‚СЂР°РЅРёС†Р° С‚РµС…РЅРёРєРё"
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
            galleries,
            contactProjection
          })}
        </section>
        {page.pageType === PAGE_TYPES.CONTACTS ? (
          <section id="contact-request" data-preview-section="contact-request" className={`${styles.card} ${styles.previewSection}`}>
            <h2>Контактное действие</h2>
            <p className={styles.note}>{contactProjection.readiness.message}</p>
            <p className={styles.note}>{contactProjection.displayRegion}</p>
            <div className={styles.linkRow}>
              <ContactAction action={contactProjection.primaryAction} className={styles.actionLink} defaultLabel={PUBLIC_COPY.ctaFallback} />
              {contactProjection.secondaryActions.map((action) => (
                <ContactAction
                  key={action.key || action.href}
                  action={action}
                  className={styles.actionLinkSecondary}
                  defaultLabel={PUBLIC_COPY.ctaFallback}
                />
              ))}
              <Link className={styles.actionLinkSecondary} href="/services">Открыть услуги</Link>
            </div>
            <p id="contact-messengers" className={styles.note}>
              {contactProjection.messengers.length > 0
                ? `Активные каналы: ${contactProjection.messengers.map((item) => item.label).join(", ")}`
                : "Каналы в мессенджерах пока не настроены."}
            </p>
          </section>
        ) : null}
      </main>
    </PublicPageShell>
  );
}

