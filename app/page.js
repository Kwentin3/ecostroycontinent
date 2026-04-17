import Link from "next/link";

import { PublicPageShell } from "../components/public/PublicRenderers";
import styles from "../components/public/public-ui.module.css";
import {
  getPublishedCases,
  getPublishedGlobalSettings,
  getPublishedServices
} from "../lib/read-side/public-content";
import { normalizeLegacyCopy } from "../lib/ui-copy";
import {
  getPlaceholderCases,
  getPlaceholderGlobalSettings,
  getPlaceholderServices
} from "../lib/public-launch/placeholder-fixtures";
import { buildPublicContactProjection } from "../lib/public-launch/contact-projection";
import { buildPlaceholderRobotsMetadata, resolvePlaceholderMode } from "../lib/public-launch/placeholder-mode";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const placeholderMode = await resolvePlaceholderMode(await searchParams);
  return buildPlaceholderRobotsMetadata(placeholderMode);
}

function pickHighlights(items, limit = 3) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  return items.filter((item) => item?.slug && item?.title).slice(0, limit);
}

function isInternalHref(href) {
  return typeof href === "string" && (href.startsWith("/") || href.startsWith("#"));
}

export default async function HomePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const placeholderMode = await resolvePlaceholderMode(resolvedSearchParams);

  const [globalSettings, services, cases] = await Promise.all([
    getPublishedGlobalSettings(),
    getPublishedServices(),
    getPublishedCases()
  ]);

  const usingPlaceholderServices = placeholderMode && services.length === 0;
  const usingPlaceholderCases = placeholderMode && cases.length === 0;
  const usingPlaceholderGlobalSettings = placeholderMode && !globalSettings;

  const resolvedServices = usingPlaceholderServices ? getPlaceholderServices() : services;
  const resolvedCases = usingPlaceholderCases ? getPlaceholderCases() : cases;
  const resolvedGlobalSettings = globalSettings || (placeholderMode ? getPlaceholderGlobalSettings() : null);
  const featuredServices = pickHighlights(resolvedServices, 3);
  const featuredCases = pickHighlights(resolvedCases, 2);
  const contactProjection = buildPublicContactProjection(resolvedGlobalSettings, { currentPath: "/" });
  const placeholderMarker = usingPlaceholderServices || usingPlaceholderCases || usingPlaceholderGlobalSettings;

  return (
    <PublicPageShell
      globalSettings={resolvedGlobalSettings}
      currentPath="/"
      serviceLinks={resolvedServices}
      placeholderMarker={placeholderMarker}
    >
      <main className={styles.page}>
        <section
          id="preview-home-hero"
          data-preview-section="hero"
          className={`${styles.hero} ${styles.previewSection} ${styles.sectionToneTinted} ${styles.textEmphasisStrong}`}
        >
          <p className={styles.eyebrow}>Public launch core</p>
          <h1>{resolvedGlobalSettings?.publicBrandName || "Ecostroycontinent"}</h1>
          <p>The homepage works as a trust and navigation hub for services, proof pages, and contact actions.</p>
          <p className={styles.note}>{contactProjection.displayRegion}</p>
          <p className={styles.note}>{contactProjection.readiness.message}</p>
          <div className={styles.linkRow}>
            {contactProjection.primaryAction?.href ? (
              isInternalHref(contactProjection.primaryAction.href) ? (
                <Link className={styles.actionLink} href={contactProjection.primaryAction.href}>
                  {contactProjection.primaryAction.label}
                </Link>
              ) : (
                <a className={styles.actionLink} href={contactProjection.primaryAction.href}>
                  {contactProjection.primaryAction.label}
                </a>
              )
            ) : null}
            <Link className={styles.actionLink} href="/services">Open services</Link>
            <Link className={styles.actionLinkSecondary} href="/cases">View cases</Link>
          </div>
        </section>

        <section
          id="preview-home-services"
          data-preview-section="home-services"
          className={`${styles.stack} ${styles.previewSection}`}
        >
          <section className={`${styles.card} ${styles.sectionTonePlain}`}>
            <p className={styles.eyebrow}>Service entry</p>
            <h2>Key service routes</h2>
            <p className={styles.note}>Home routes users to dedicated service detail pages instead of replacing them.</p>
          </section>
          {featuredServices.length > 0 ? (
            <section className={styles.grid}>
              {featuredServices.map((service) => (
                <article key={service.entityId || service.slug} className={styles.card}>
                  <h3>{service.title}</h3>
                  <p>{normalizeLegacyCopy(service.summary || service.serviceScope || "Service details are available on the dedicated route.")}</p>
                  <div className={styles.linkRow}>
                    <Link className={styles.actionLink} href={`/services/${service.slug}`}>Open service detail</Link>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <section className={`${styles.card} ${styles.sectionTonePlain}`}>
              <p className={styles.note}>No published services are available in this mode.</p>
              <div className={styles.linkRow}>
                <Link className={styles.actionLink} href="/services">Check services index</Link>
              </div>
            </section>
          )}
        </section>

        <section
          id="preview-home-proof"
          data-preview-section="home-proof"
          className={`${styles.stack} ${styles.previewSection}`}
        >
          <section className={`${styles.card} ${styles.sectionToneTinted}`}>
            <p className={styles.eyebrow}>Proof layer</p>
            <h2>Cases as evidence entry</h2>
            <p className={styles.note}>Cases index stays an evidence route tied to service intent.</p>
          </section>
          {featuredCases.length > 0 ? (
            <section className={styles.grid}>
              {featuredCases.map((item) => (
                <article key={item.entityId || item.slug} className={styles.card}>
                  <h3>{item.title}</h3>
                  <p>{normalizeLegacyCopy(item.result || item.task || item.location || "Case details are available on the dedicated route.")}</p>
                  <div className={styles.linkRow}>
                    <Link className={styles.actionLink} href={`/cases/${item.slug}`}>Open case detail</Link>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <section className={`${styles.card} ${styles.sectionTonePlain}`}>
              <p className={styles.note}>No published cases are available in this mode.</p>
              <div className={styles.linkRow}>
                <Link className={styles.actionLink} href="/cases">Check cases index</Link>
              </div>
            </section>
          )}
        </section>

        <section
          id="preview-home-next-step"
          data-preview-section="home-next-step"
          className={`${styles.card} ${styles.previewSection} ${styles.sectionToneEmphasis}`}
        >
          <h2>Next step</h2>
          <p className={styles.ctaCopy}>
            After selecting a service or case, the user should have a clear and immediate contact path.
          </p>
          <div className={styles.linkRow}>
            {contactProjection.primaryAction?.href ? (
              isInternalHref(contactProjection.primaryAction.href) ? (
                <Link className={styles.actionLink} href={contactProjection.primaryAction.href}>
                  {contactProjection.primaryAction.label}
                </Link>
              ) : (
                <a className={styles.actionLink} href={contactProjection.primaryAction.href}>
                  {contactProjection.primaryAction.label}
                </a>
              )
            ) : null}
            {contactProjection.secondaryActions.length > 0 ? (
              isInternalHref(contactProjection.secondaryActions[0].href) ? (
                <Link className={styles.actionLinkSecondary} href={contactProjection.secondaryActions[0].href}>
                  {contactProjection.secondaryActions[0].label}
                </Link>
              ) : (
                <a className={styles.actionLinkSecondary} href={contactProjection.secondaryActions[0].href}>
                  {contactProjection.secondaryActions[0].label}
                </a>
              )
            ) : null}
            <Link className={styles.actionLinkSecondary} href="/contacts">Open contacts</Link>
          </div>
        </section>
      </main>
    </PublicPageShell>
  );
}
