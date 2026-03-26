import Link from "next/link";

import { PUBLIC_COPY, normalizeLegacyCopy } from "../../lib/ui-copy.js";
import styles from "./public-ui.module.css";

function MediaHero({ asset, label = PUBLIC_COPY.mediaLabel }) {
  if (!asset) {
    return null;
  }

  return (
    <section className={styles.mediaHero}>
      <p className={styles.eyebrow}>{label}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset.previewUrl} alt={asset.alt || asset.title || PUBLIC_COPY.imageFallback} />
      <p className={styles.card}>{asset.caption || asset.title || asset.originalFilename || PUBLIC_COPY.mediaFallback}</p>
    </section>
  );
}

function GallerySection({ title, galleries, resolveGallery }) {
  const items = galleries
    .map((galleryId) => resolveGallery(galleryId))
    .filter(Boolean)
    .flatMap((gallery) => gallery.assets ?? []);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.gallery}>
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
      <section className={styles.hero}>
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
      <section className={styles.hero}>
        <p className={styles.eyebrow}>{PUBLIC_COPY.serviceEyebrow}</p>
        <h1>{service.h1}</h1>
        <p>{service.summary}</p>
        <p className={styles.note}>{PUBLIC_COPY.ctaPrefix}: {service.ctaVariant || globalSettings?.defaultCtaLabel || PUBLIC_COPY.ctaFallback}</p>
      </section>
      <MediaHero asset={primaryMedia} />
      <section className={styles.card}>
        <h2>{PUBLIC_COPY.serviceScopeHeading}</h2>
        <p>{service.serviceScope}</p>
        {service.problemsSolved ? <p>{service.problemsSolved}</p> : null}
        {service.methods ? <p>{service.methods}</p> : null}
      </section>
      {relatedCases.length > 0 ? (
        <section className={styles.grid}>
          {relatedCases.map((item) => (
            <article key={item.entityId} className={styles.card}>
              <h3>{item.title}</h3>
              <p>{item.result}</p>
              <Link href={`/cases/${item.slug}`}>{PUBLIC_COPY.openCase}</Link>
            </article>
          ))}
        </section>
      ) : null}
      <GallerySection title={PUBLIC_COPY.galleryHeading} galleries={service.galleryIds || []} resolveGallery={galleries} />
    </main>
  );
}

export function CasePage({ item, relatedServices, galleries, resolveMedia }) {
  const primaryMedia = resolveMedia && item.primaryMediaAssetId ? resolveMedia(item.primaryMediaAssetId) : null;

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>{PUBLIC_COPY.caseEyebrow}</p>
        <h1>{item.title}</h1>
        <p>{item.location}</p>
      </section>
      <MediaHero asset={primaryMedia} />
      <section className={styles.grid}>
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
        <section className={styles.grid}>
          {relatedServices.map((service) => (
            <article key={service.entityId} className={styles.card}>
              <h3>{service.title}</h3>
              <p>{service.summary}</p>
              <Link href={`/services/${service.slug}`}>{PUBLIC_COPY.openService}</Link>
            </article>
          ))}
        </section>
      ) : null}
      <GallerySection title={PUBLIC_COPY.projectGalleryHeading} galleries={item.galleryIds || []} resolveGallery={galleries} />
    </main>
  );
}

export function StandalonePage({ page, globalSettings, services, cases, galleries, resolveMedia }) {
  const primaryMedia = resolveMedia && page.primaryMediaAssetId ? resolveMedia(page.primaryMediaAssetId) : null;

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>{PUBLIC_COPY.pageEyebrow}</p>
        <h1>{page.h1}</h1>
        <p>{page.intro}</p>
      </section>
      <MediaHero asset={primaryMedia} label={PUBLIC_COPY.mediaLabel} />
      {page.blocks.map((block) => {
        switch (block.type) {
          case "rich_text":
            return (
              <section key={`${block.type}-${block.order}`} className={styles.card}>
                {block.title ? <h2>{block.title}</h2> : null}
                <p>{block.body}</p>
              </section>
            );
          case "service_list":
            return (
              <section key={`${block.type}-${block.order}`} className={styles.grid}>
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
              <section key={`${block.type}-${block.order}`} className={styles.grid}>
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
              />
            );
          case "contact":
            return (
              <section key={`${block.type}-${block.order}`} className={styles.card}>
                <h2>{block.title}</h2>
                <p>{block.body}</p>
                <p>{globalSettings?.primaryPhone || PUBLIC_COPY.contactInfoFallback}</p>
                <p>{globalSettings?.serviceArea || PUBLIC_COPY.serviceAreaFallback}</p>
              </section>
            );
          case "cta":
            return (
              <section key={`${block.type}-${block.order}`} className={styles.card}>
                <h2>{block.title}</h2>
                <p>{block.body}</p>
                <p>{block.ctaLabel || globalSettings?.defaultCtaLabel || PUBLIC_COPY.ctaFallback}</p>
              </section>
            );
          default:
            return null;
        }
      })}
    </main>
  );
}
