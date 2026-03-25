import Link from "next/link";

import styles from "./public-ui.module.css";

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
          <img src={asset.previewUrl} alt={asset.alt || asset.title || "Gallery image"} />
          <figcaption className={styles.card}>{asset.caption || asset.title || "Media asset"}</figcaption>
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
            <p>{item.summary || item.result || item.location || item.intro || "Published entity"}</p>
            <Link href={`${itemHrefPrefix}/${item.slug}`}>Open</Link>
          </article>
        ))}
      </section>
    </main>
  );
}

export function ServicePage({ service, relatedCases, galleries, globalSettings }) {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Service</p>
        <h1>{service.h1}</h1>
        <p>{service.summary}</p>
        <p className={styles.note}>CTA: {service.ctaVariant || globalSettings?.defaultCtaLabel || "Get in touch"}</p>
      </section>
      <section className={styles.card}>
        <h2>Service scope</h2>
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
              <Link href={`/cases/${item.slug}`}>Open case</Link>
            </article>
          ))}
        </section>
      ) : null}
      <GallerySection title="Gallery" galleries={service.galleryIds || []} resolveGallery={galleries} />
    </main>
  );
}

export function CasePage({ item, relatedServices, galleries }) {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Case</p>
        <h1>{item.title}</h1>
        <p>{item.location}</p>
      </section>
      <section className={styles.grid}>
        <article className={styles.card}>
          <h3>Task</h3>
          <p>{item.task}</p>
        </article>
        <article className={styles.card}>
          <h3>Work scope</h3>
          <p>{item.workScope}</p>
        </article>
        <article className={styles.card}>
          <h3>Result</h3>
          <p>{item.result}</p>
        </article>
      </section>
      {relatedServices.length > 0 ? (
        <section className={styles.grid}>
          {relatedServices.map((service) => (
            <article key={service.entityId} className={styles.card}>
              <h3>{service.title}</h3>
              <p>{service.summary}</p>
              <Link href={`/services/${service.slug}`}>Open service</Link>
            </article>
          ))}
        </section>
      ) : null}
      <GallerySection title="Project gallery" galleries={item.galleryIds || []} resolveGallery={galleries} />
    </main>
  );
}

export function StandalonePage({ page, globalSettings, services, cases, galleries }) {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Page</p>
        <h1>{page.h1}</h1>
        <p>{page.intro}</p>
      </section>
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
                    <Link href={`/services/${service.slug}`}>Open service</Link>
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
                    <Link href={`/cases/${item.slug}`}>Open case</Link>
                  </article>
                ))}
              </section>
            );
          case "gallery":
            return (
              <GallerySection
                key={`${block.type}-${block.order}`}
                title={block.title}
                galleries={block.galleryIds}
                resolveGallery={galleries}
              />
            );
          case "contact":
            return (
              <section key={`${block.type}-${block.order}`} className={styles.card}>
                <h2>{block.title}</h2>
                <p>{block.body}</p>
                <p>{globalSettings?.primaryPhone || "Contact information is not confirmed yet."}</p>
                <p>{globalSettings?.serviceArea || "Service area will appear after confirmation."}</p>
              </section>
            );
          case "cta":
            return (
              <section key={`${block.type}-${block.order}`} className={styles.card}>
                <h2>{block.title}</h2>
                <p>{block.body}</p>
                <p>{block.ctaLabel || globalSettings?.defaultCtaLabel || "Get in touch"}</p>
              </section>
            );
          default:
            return null;
        }
      })}
    </main>
  );
}
