import { notFound } from "next/navigation";

import { PublicHoldingPage, StandalonePage } from "../components/public/PublicRenderers";
import {
  buildPublishedLookups,
  getPublishedGlobalSettings,
  getPublishedHomePage,
  getPublishedServices
} from "../lib/read-side/public-content";
import {
  getPlaceholderGlobalSettings,
  getPlaceholderHomePage,
  getPlaceholderServices
} from "../lib/public-launch/placeholder-fixtures";
import { resolvePublicRuntimeDisplayMode } from "../lib/public-launch/runtime-display-mode";
import { buildPublicRouteMetadata } from "../lib/public-launch/seo-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const runtimeDisplayMode = await resolvePublicRuntimeDisplayMode(await searchParams);
  const placeholderMode = runtimeDisplayMode.placeholderFallbackEnabled || runtimeDisplayMode.underConstruction;
  const globalSettings = await getPublishedGlobalSettings();
  const siteName = globalSettings?.publicBrandName || "Экостройконтинент";

  if (runtimeDisplayMode.underConstruction) {
    return buildPublicRouteMetadata({
      pathname: "/",
      placeholderMode,
      title: `${siteName} - сайт в режиме подготовки`,
      description: "Публичный контур временно переведен в режим подготовки.",
      siteName
    });
  }

  const publishedPage = await getPublishedHomePage();
  const placeholderPage = placeholderMode ? getPlaceholderHomePage() : null;
  const page = publishedPage || placeholderPage;

  return buildPublicRouteMetadata({
    pathname: "/",
    placeholderMode,
    title: page?.seo?.metaTitle || page?.h1 || page?.title || siteName,
    description: page?.seo?.metaDescription || page?.intro || "Главная страница компании и переход к опубликованным услугам.",
    seo: page?.seo,
    siteName
  });
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

  const [publishedPage, globalSettings, lookups] = await Promise.all([
    getPublishedHomePage(),
    getPublishedGlobalSettings(),
    buildPublishedLookups()
  ]);

  const placeholderPage = placeholderMode ? getPlaceholderHomePage() : null;
  const page = publishedPage || placeholderPage;

  if (!page) {
    // Sticky canon: root is content-managed Page(type=home). Keep this honest
    // until the owner-approved Home page exists and is explicitly published.
    notFound();
  }

  const usingPlaceholder = !publishedPage && Boolean(placeholderPage);
  const resolvedGlobalSettings = globalSettings || (placeholderMode ? getPlaceholderGlobalSettings() : null);
  const resolvedServiceLinks = lookups.services.length > 0
    ? lookups.services
    : (placeholderMode ? getPlaceholderServices() : []);
  const hasPublishedCases = lookups.cases.some((item) => item?.slug && item?.title);

  return (
    <StandalonePage
      page={page}
      globalSettings={resolvedGlobalSettings}
      services={(id) => lookups.serviceMap.get(id) || null}
      equipment={(id) => lookups.equipmentMap.get(id) || null}
      cases={(id) => lookups.caseMap.get(id) || null}
      galleries={(id) => lookups.galleryMap.get(id) || null}
      resolveMedia={(id) => lookups.mediaMap.get(id) || null}
      serviceLinks={resolvedServiceLinks}
      allowStructuredData={!placeholderMode}
      placeholderMarker={usingPlaceholder}
      showCasesNav={hasPublishedCases}
    />
  );
}
