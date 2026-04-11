import Link from "next/link";

import { PUBLIC_COPY, normalizeLegacyCopy } from "../../lib/ui-copy.js";
import { DEFAULT_LANDING_PAGE_THEME_KEY, DEFAULT_LANDING_SURFACE_TONE, DEFAULT_LANDING_TEXT_EMPHASIS_PRESET } from "../../lib/landing-composition/visual-semantics.js";
import styles from "./public-ui.module.css";

function getThemeClassName(pageThemeKey) {
  switch (pageThemeKey || DEFAULT_LANDING_PAGE_THEME_KEY) {
    case "forest_contrast":
      return styles.themeForestContrast;
    case "slate_editorial":
      return styles.themeSlateEditorial;
    case "earth_sand":
    default:
      return styles.themeEarthSand;
  }
}

function getSurfaceToneClassName(surfaceTone) {
  switch (surfaceTone || DEFAULT_LANDING_SURFACE_TONE) {
    case "tinted":
      return styles.sectionToneTinted;
    case "emphasis":
      return styles.sectionToneEmphasis;
    case "plain":
    default:
      return styles.sectionTonePlain;
  }
}

function getTextEmphasisClassName(textEmphasisPreset) {
  switch (textEmphasisPreset || DEFAULT_LANDING_TEXT_EMPHASIS_PRESET) {
    case "quiet":
      return styles.textEmphasisQuiet;
    case "strong":
      return styles.textEmphasisStrong;
    case "standard":
    default:
      return styles.textEmphasisStandard;
  }
}

function getStageASectionClassNames({ surfaceTone, textEmphasisPreset }) {
  return [
    getSurfaceToneClassName(surfaceTone),
    getTextEmphasisClassName(textEmphasisPreset)
  ].join(" ");
}

function MediaHero({ asset, label = PUBLIC_COPY.mediaLabel, sectionId = "preview-media", sectionName = "media" }) {
  if (!asset) {
    return null;
  }

  return (
    <section id={sectionId} data-preview-section={sectionName} className={`${styles.mediaHero} ${styles.previewSection}`}>
      <p className={styles.eyebrow}>{label}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset.previewUrl} alt={asset.alt || asset.title || PUBLIC_COPY.imageFallback} />
      <p className={styles.card}>{asset.caption || asset.title || asset.originalFilename || PUBLIC_COPY.mediaFallback}</p>
    </section>
  );
}

function GallerySection({ title, galleries, resolveGallery, sectionId = "preview-gallery", sectionName = "gallery" }) {
  const items = galleries
    .map((galleryId) => resolveGallery(galleryId))
    .filter(Boolean)
    .flatMap((gallery) => gallery.assets ?? []);

  if (items.length === 0) {
    return null;
  }

  return (
    <section id={sectionId} data-preview-section={sectionName} className={`${styles.gallery} ${styles.previewSection}`}>
      {title ? <h3>{title}</h3> : null}
      {items.map((asset) => (
        <figure key={asset.entityId}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset.previewUrl} alt={asset.alt || asset.title || PUBLIC_COPY.imageFallback} />
          <figcaption className={styles.card}>{asset.caption || asset.title || PUBLIC_COPY.mediaFallback}</figcaption>
        </figure>
      ))}
    </section>
  );
}

export function PublicListPage({ eyebrow, title, intro, items, itemHrefPrefix }) {
  return (
    <main className={styles.page}>
      <section id="preview-list-hero" data-preview-section="hero" className={`${styles.hero} ${styles.previewSection}`}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <p className={styles.note}>{intro}</p>
      </section>
      <section className={styles.grid}>
        {items.map((item) => (
          <article key={item.entityId} className={styles.card}>
            <h2>{item.title}</h2>
            <p>{normalizeLegacyCopy(item.summary || item.result || item.location || item.intro || PUBLIC_COPY.publishedEntityFallback)}</p>
            <Link href={`${itemHrefPrefix}/${item.slug}`}>{PUBLIC_COPY.listOpen}</Link>
          </article>
        ))}
      </section>
    </main>
  );
}

export function ServicePage({ service, relatedCases, galleries, resolveMedia, globalSettings }) {
  const primaryMedia = resolveMedia && service.primaryMediaAssetId ? resolveMedia(service.primaryMediaAssetId) : null;

  return (
    <main className={styles.page}>
      <section id="preview-service-hero" data-preview-section="hero" className={`${styles.hero} ${styles.previewSection}`}>
        <p className={styles.eyebrow}>{PUBLIC_COPY.serviceEyebrow}</p>
        <h1>{service.h1}</h1>
        <p>{service.summary}</p>
        <p className={styles.note}>{PUBLIC_COPY.ctaPrefix}: {service.ctaVariant || globalSettings?.defaultCtaLabel || PUBLIC_COPY.ctaFallback}</p>
      </section>
      <MediaHero asset={primaryMedia} sectionId="preview-service-media" sectionName="media" />
      <section id="preview-service-scope" data-preview-section="service-scope" className={`${styles.card} ${styles.previewSection}`}>
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
              <Link href={`/cases/${item.slug}`}>{PUBLIC_COPY.openCase}</Link>
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
  );
}

export function CasePage({ item, relatedServices, galleries, resolveMedia }) {
  const primaryMedia = resolveMedia && item.primaryMediaAssetId ? resolveMedia(item.primaryMediaAssetId) : null;

  return (
    <main className={styles.page}>
      <section id="preview-case-hero" data-preview-section="hero" className={`${styles.hero} ${styles.previewSection}`}>
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
              <Link href={`/services/${service.slug}`}>{PUBLIC_COPY.openService}</Link>
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
  );
}

export function StandalonePage({ page, globalSettings, services, cases, galleries, resolveMedia }) {
  const primaryMedia = resolveMedia && page.primaryMediaAssetId ? resolveMedia(page.primaryMediaAssetId) : null;
  const pageThemeClassName = getThemeClassName(page.pageThemeKey);
  const heroBlock = Array.isArray(page.blocks) ? page.blocks.find((block) => block.type === "hero") : null;
  const heroClassName = getStageASectionClassNames({
    surfaceTone: heroBlock?.surfaceTone,
    textEmphasisPreset: heroBlock?.textEmphasisPreset
  });

  return (
    <main className={`${styles.page} ${pageThemeClassName}`}>
      <section id="preview-page-hero" data-preview-section="hero" className={`${styles.hero} ${styles.previewSection} ${heroClassName}`}>
        <p className={styles.eyebrow}>{PUBLIC_COPY.pageEyebrow}</p>
        <h1>{page.h1}</h1>
        <p>{page.intro}</p>
      </section>
      <MediaHero asset={primaryMedia} label={PUBLIC_COPY.mediaLabel} sectionId="preview-page-media" sectionName="media" />
      <section id="preview-page-blocks" data-preview-section="page-blocks" className={`${styles.stack} ${styles.previewSection}`}>
        {page.blocks.map((block) => {
          switch (block.type) {
            case "rich_text":
              return (
                <section
                  key={`${block.type}-${block.order}`}
                  id={`preview-page-${block.type}-${block.order}`}
                  data-preview-section={`page-${block.type}`}
                  className={`${styles.card} ${styles.previewSection} ${getStageASectionClassNames(block)}`}
                >
                  {block.title ? <h2>{block.title}</h2> : null}
                  <p>{block.body}</p>
                </section>
              );
            case "service_list":
              return (
                <section
                  key={`${block.type}-${block.order}`}
                  id={`preview-page-${block.type}-${block.order}`}
                  data-preview-section={`page-${block.type}`}
                  className={`${styles.grid} ${styles.previewSection}`}
                >
                  {block.serviceIds.map((id) => services(id)).filter(Boolean).map((service) => (
                    <article key={service.entityId} className={styles.card}>
                      <h3>{service.title}</h3>
                      <p>{service.summary}</p>
                      <Link href={`/services/${service.slug}`}>{PUBLIC_COPY.openService}</Link>
                    </article>
                  ))}
                </section>
              );
            case "case_list":
              return (
                <section
                  key={`${block.type}-${block.order}`}
                  id={`preview-page-${block.type}-${block.order}`}
                  data-preview-section={`page-${block.type}`}
                  className={`${styles.grid} ${styles.previewSection}`}
                >
                  {block.caseIds.map((id) => cases(id)).filter(Boolean).map((item) => (
                    <article key={item.entityId} className={styles.card}>
                      <h3>{item.title}</h3>
                      <p>{item.result}</p>
                      <Link href={`/cases/${item.slug}`}>{PUBLIC_COPY.openCase}</Link>
                    </article>
                  ))}
                </section>
              );
            case "gallery":
              return (
                <GallerySection
                  key={`${block.type}-${block.order}`}
                  title={block.title || PUBLIC_COPY.galleryHeading}
                  galleries={block.galleryIds}
                  resolveGallery={galleries}
                  sectionId={`preview-page-${block.type}-${block.order}`}
                  sectionName={`page-${block.type}`}
                />
              );
            case "contact":
              return (
                <section
                  key={`${block.type}-${block.order}`}
                  id={`preview-page-${block.type}-${block.order}`}
                  data-preview-section={`page-${block.type}`}
                  className={`${styles.card} ${styles.previewSection} ${getStageASectionClassNames(block)}`}
                >
                  <h2>{block.title}</h2>
                  <p>{block.body}</p>
                  <p>{globalSettings?.primaryPhone || PUBLIC_COPY.contactInfoFallback}</p>
                  <p>{globalSettings?.serviceArea || PUBLIC_COPY.serviceAreaFallback}</p>
                </section>
              );
            case "cta":
              return (
                <section
                  key={`${block.type}-${block.order}`}
                  id={`preview-page-${block.type}-${block.order}`}
                  data-preview-section={`page-${block.type}`}
                  className={`${styles.card} ${styles.previewSection} ${getStageASectionClassNames(block)}`}
                >
                  <h2>{block.title}</h2>
                  <p>{block.body}</p>
                  <p>{block.ctaLabel || globalSettings?.defaultCtaLabel || PUBLIC_COPY.ctaFallback}</p>
                </section>
              );
            default:
              return null;
          }
        })}
      </section>
    </main>
  );
}
