import Link from "next/link";

import { PAGE_SECTION_TYPES, PAGE_TYPES } from "../../lib/content-core/content-types.js";
import { PUBLIC_COPY, normalizeLegacyCopy } from "../../lib/ui-copy.js";
import { DEFAULT_LANDING_PAGE_THEME_KEY } from "../../lib/landing-composition/visual-semantics.js";
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
  const primaryService = sourceRefs.primaryServiceId ? services(sourceRefs.primaryServiceId) : null;
  const primaryEquipment = sourceRefs.primaryEquipmentId ? equipment(sourceRefs.primaryEquipmentId) : null;

  return (page.sections || []).map((section) => {
    switch (section.type) {
      case PAGE_SECTION_TYPES.RICH_TEXT:
        if (!section.body) {
          return null;
        }

        return (
          <section key={`${section.type}-${section.order}`} id={`preview-page-${section.type}-${section.order}`} data-preview-section={section.type} className={`${styles.card} ${styles.previewSection}`}>
            {section.title ? <h2>{section.title}</h2> : null}
            <p>{section.body}</p>
          </section>
        );
      case PAGE_SECTION_TYPES.CONTACT_DETAILS:
        return (
          <section key={`${section.type}-${section.order}`} id={`preview-page-${section.type}-${section.order}`} data-preview-section={section.type} className={`${styles.card} ${styles.previewSection}`}>
            <h2>{section.title || "Контакты"}</h2>
            {section.body ? <p>{section.body}</p> : null}
            <p>{globalSettings?.primaryPhone || PUBLIC_COPY.contactInfoFallback}</p>
            <p>{globalSettings?.serviceArea || PUBLIC_COPY.serviceAreaFallback}</p>
          </section>
        );
      case PAGE_SECTION_TYPES.SERVICE_SCOPE:
        return (
          <section key={`${section.type}-${section.order}`} id={`preview-page-${section.type}-${section.order}`} data-preview-section={section.type} className={`${styles.card} ${styles.previewSection}`}>
            <h2>{section.title || "Что входит в услугу"}</h2>
            <p>{section.body || primaryService?.serviceScope || primaryService?.summary || "Описание пока не заполнено."}</p>
            {primaryService?.problemsSolved ? <p>{primaryService.problemsSolved}</p> : null}
          </section>
        );
      case PAGE_SECTION_TYPES.EQUIPMENT_SUMMARY:
        return (
          <section key={`${section.type}-${section.order}`} id={`preview-page-${section.type}-${section.order}`} data-preview-section={section.type} className={`${styles.card} ${styles.previewSection}`}>
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
          <section key={`${section.type}-${section.order}`} id={`preview-page-${section.type}-${section.order}`} data-preview-section={section.type} className={`${styles.card} ${styles.previewSection}`}>
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
          <section key={`${section.type}-${section.order}`} id={`preview-page-${section.type}-${section.order}`} data-preview-section={section.type} className={`${styles.card} ${styles.previewSection}`}>
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
          <section key={`${section.type}-${section.order}`} id={`preview-page-${section.type}-${section.order}`} data-preview-section={section.type} className={`${styles.stack} ${styles.previewSection}`}>
            {caseItems.length > 0 ? (
              <section className={styles.grid}>
                {caseItems.map((item) => (
                  <article key={item.entityId} className={styles.card}>
                    <h3>{item.title}</h3>
                    <p>{item.result}</p>
                    <Link href={`/cases/${item.slug}`}>{PUBLIC_COPY.openCase}</Link>
                  </article>
                ))}
              </section>
            ) : null}
            <GallerySection
              title={section.title || PUBLIC_COPY.galleryHeading}
              galleries={galleryIds}
              resolveGallery={galleries}
              sectionId={`preview-page-${section.type}-${section.order}-gallery`}
              sectionName={`${section.type}-gallery`}
            />
          </section>
        );
      }
      case PAGE_SECTION_TYPES.CTA:
        return (
          <section key={`${section.type}-${section.order}`} id={`preview-page-${section.type}-${section.order}`} data-preview-section={section.type} className={`${styles.card} ${styles.previewSection}`}>
            <h2>{section.title || "Оставьте заявку"}</h2>
            <p>{section.body || globalSettings?.defaultCtaDescription || ""}</p>
            <p>{section.ctaLabel || globalSettings?.defaultCtaLabel || PUBLIC_COPY.ctaFallback}</p>
          </section>
        );
      default:
        return null;
    }
  });
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
    <PublicPageShell globalSettings={globalSettings}>
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
    </PublicPageShell>
  );
}

export function CasePage({ item, relatedServices, galleries, resolveMedia, globalSettings }) {
  const primaryMedia = resolveMedia && item.primaryMediaAssetId ? resolveMedia(item.primaryMediaAssetId) : null;

  return (
    <PublicPageShell globalSettings={globalSettings}>
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
    </PublicPageShell>
  );
}

export function StandalonePage({ page, globalSettings, services, equipment, cases, galleries, resolveMedia }) {
  const primaryMedia = resolveMedia && page.primaryMediaAssetId ? resolveMedia(page.primaryMediaAssetId) : null;
  const pageThemeClassName = getThemeClassName(page.pageThemeKey);
  const heroSection = getSection(page, PAGE_SECTION_TYPES.HERO_OFFER);
  const sourceRefs = page.sourceRefs || {};
  const primaryService = sourceRefs.primaryServiceId ? services(sourceRefs.primaryServiceId) : null;
  const primaryEquipment = sourceRefs.primaryEquipmentId ? equipment?.(sourceRefs.primaryEquipmentId) : null;

  return (
    <PublicPageShell globalSettings={globalSettings} themeClassName={pageThemeClassName}>
      <main className={styles.page}>
        <section id="preview-page-hero" data-preview-section="hero" className={`${styles.hero} ${styles.previewSection}`}>
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
        </section>
        <MediaHero asset={primaryMedia} label={PUBLIC_COPY.mediaLabel} sectionId="preview-page-media" sectionName="media" />
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
