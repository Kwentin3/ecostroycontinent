import Link from "next/link";

import { PublicHoldingPage, PublicPageShell } from "../components/public/PublicRenderers";
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
import { resolvePublicRuntimeDisplayMode } from "../lib/public-launch/runtime-display-mode";
import { buildPublicRouteMetadata } from "../lib/public-launch/seo-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const runtimeDisplayMode = await resolvePublicRuntimeDisplayMode(await searchParams);
  const placeholderMode = runtimeDisplayMode.placeholderFallbackEnabled || runtimeDisplayMode.underConstruction;
  const globalSettings = await getPublishedGlobalSettings();
  const siteName = globalSettings?.publicBrandName || "Экостройконтинент";
  const title = runtimeDisplayMode.underConstruction
    ? `${siteName} — сайт в режиме подготовки`
    : `${siteName} — услуги и кейсы`;
  const description = runtimeDisplayMode.underConstruction
    ? "Публичный контур временно переведён в режим подготовки."
    : "Главная как опорная страница доверия и навигации для услуг, кейсов и контактного действия.";
  return buildPublicRouteMetadata({
    pathname: "/",
    placeholderMode,
    title,
    description,
    siteName
  });
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
  const runtimeDisplayMode = await resolvePublicRuntimeDisplayMode(resolvedSearchParams);
  const placeholderMode = runtimeDisplayMode.placeholderFallbackEnabled;

  if (runtimeDisplayMode.underConstruction) {
    const [globalSettings, services] = await Promise.all([
      getPublishedGlobalSettings(),
      getPublishedServices()
    ]);

    return (
      <PublicHoldingPage
        globalSettings={globalSettings || getPlaceholderGlobalSettings()}
        currentPath="/"
        serviceLinks={services}
        title="Сайт в режиме подготовки"
        description="Главная временно работает как поверхность режима подготовки до следующего переключения."
      />
    );
  }

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
      allowStructuredData={!placeholderMode}
      placeholderMarker={placeholderMarker}
    >
      <main className={styles.page}>
        <section
          id="preview-home-hero"
          data-preview-section="hero"
          className={`${styles.hero} ${styles.previewSection} ${styles.sectionToneTinted} ${styles.textEmphasisStrong}`}
        >
          <p className={styles.eyebrow}>Публичное ядро запуска</p>
          <h1>{resolvedGlobalSettings?.publicBrandName || "Экостройконтинент"}</h1>
          <p>Главная служит опорной страницей доверия и навигации для услуг, страниц подтверждений и контактных действий.</p>
          {contactProjection.hasPublicRegion ? <p className={styles.note}>{contactProjection.publicRegion}</p> : null}
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
            <Link className={styles.actionLink} href="/services">Открыть услуги</Link>
            <Link className={styles.actionLinkSecondary} href="/cases">Посмотреть кейсы</Link>
          </div>
        </section>

        <section
          id="preview-home-services"
          data-preview-section="home-services"
          className={`${styles.stack} ${styles.previewSection}`}
        >
          <section className={`${styles.card} ${styles.sectionTonePlain}`}>
            <p className={styles.eyebrow}>Вход в услуги</p>
            <h2>Ключевые маршруты услуг</h2>
            <p className={styles.note}>Главная ведет к отдельным страницам услуг вместо того, чтобы подменять их.</p>
          </section>
          {featuredServices.length > 0 ? (
            <section className={styles.grid}>
              {featuredServices.map((service) => (
                <article key={service.entityId || service.slug} className={styles.card}>
                  <h3>{service.title}</h3>
                  <p>{normalizeLegacyCopy(service.summary || service.serviceScope || "Детали услуги доступны на отдельном маршруте.")}</p>
                  <div className={styles.linkRow}>
                    <Link className={styles.actionLink} href={`/services/${service.slug}`}>Открыть страницу услуги</Link>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <section className={`${styles.card} ${styles.sectionTonePlain}`}>
              <p className={styles.note}>В этом режиме пока нет опубликованных услуг.</p>
              <div className={styles.linkRow}>
                <Link className={styles.actionLink} href="/services">Открыть каталог услуг</Link>
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
            <p className={styles.eyebrow}>Слой подтверждений</p>
            <h2>Кейсы как вход в подтверждения</h2>
            <p className={styles.note}>Каталог кейсов остаётся маршрутом подтверждений, связанным с услугами.</p>
          </section>
          {featuredCases.length > 0 ? (
            <section className={styles.grid}>
              {featuredCases.map((item) => (
                <article key={item.entityId || item.slug} className={styles.card}>
                  <h3>{item.title}</h3>
                  <p>{normalizeLegacyCopy(item.result || item.task || item.location || "Детали кейса доступны на отдельном маршруте.")}</p>
                  <div className={styles.linkRow}>
                    <Link className={styles.actionLink} href={`/cases/${item.slug}`}>Открыть страницу кейса</Link>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <section className={`${styles.card} ${styles.sectionTonePlain}`}>
              <p className={styles.note}>В этом режиме пока нет опубликованных кейсов.</p>
              <div className={styles.linkRow}>
                <Link className={styles.actionLink} href="/cases">Открыть каталог кейсов</Link>
              </div>
            </section>
          )}
        </section>

        <section
          id="preview-home-next-step"
          data-preview-section="home-next-step"
          className={`${styles.card} ${styles.previewSection} ${styles.sectionToneEmphasis}`}
        >
          <h2>Следующий шаг</h2>
          <p className={styles.ctaCopy}>
            После выбора услуги или кейса пользователь должен сразу видеть понятный путь к контакту.
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
            <Link className={styles.actionLinkSecondary} href="/contacts">Открыть контакты</Link>
          </div>
        </section>
      </main>
    </PublicPageShell>
  );
}
