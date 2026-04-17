import { notFound } from "next/navigation";

import { PublicHoldingPage, StandalonePage } from "../../components/public/PublicRenderers";
import {
  buildPublishedLookups,
  getPublishedAboutPage,
  getPublishedGlobalSettings,
  getPublishedServices
} from "../../lib/read-side/public-content";
import {
  getPlaceholderAboutPage,
  getPlaceholderGlobalSettings,
  getPlaceholderServices
} from "../../lib/public-launch/placeholder-fixtures";
import { resolvePublicRuntimeDisplayMode } from "../../lib/public-launch/runtime-display-mode";
import { buildPublicRouteMetadata } from "../../lib/public-launch/seo-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const runtimeDisplayMode = await resolvePublicRuntimeDisplayMode(await searchParams);
  const placeholderMode = runtimeDisplayMode.placeholderFallbackEnabled || runtimeDisplayMode.underConstruction;
  const globalSettings = await getPublishedGlobalSettings();
  const siteName = globalSettings?.publicBrandName || "Экостройконтинент";

  if (runtimeDisplayMode.underConstruction) {
    return buildPublicRouteMetadata({
      pathname: "/about",
      placeholderMode,
      title: "О компании — в режиме подготовки",
      description: "Маршрут /about временно показывает holding-поверхность.",
      siteName
    });
  }

  const publishedPage = await getPublishedAboutPage();
  const placeholderPage = placeholderMode ? getPlaceholderAboutPage() : null;
  const page = publishedPage || placeholderPage;

  return buildPublicRouteMetadata({
    pathname: "/about",
    placeholderMode,
    title: page?.seo?.metaTitle || page?.h1 || page?.title || "О компании",
    description: page?.seo?.metaDescription || page?.intro || "О компании, подходе и зоне работ в рамках launch-core.",
    seo: page?.seo,
    siteName
  });
}

export default async function AboutPage({ searchParams }) {
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
        currentPath="/about"
        serviceLinks={services}
        title="Раздел о компании в режиме подготовки"
        description="/about временно переведён в under construction режим."
      />
    );
  }

  const [publishedPage, globalSettings, lookups] = await Promise.all([
    getPublishedAboutPage(),
    getPublishedGlobalSettings(),
    buildPublishedLookups()
  ]);

  const placeholderPage = placeholderMode ? getPlaceholderAboutPage() : null;
  const page = publishedPage || placeholderPage;

  if (!page) {
    notFound();
  }

  const usingPlaceholder = !publishedPage && Boolean(placeholderPage);
  const resolvedGlobalSettings = globalSettings || (placeholderMode ? getPlaceholderGlobalSettings() : null);
  const resolvedServiceLinks = lookups.services.length > 0
    ? lookups.services
    : (placeholderMode ? getPlaceholderServices() : []);

  return (
    <StandalonePage
      page={page}
      globalSettings={resolvedGlobalSettings}
      services={(id) => lookups.serviceMap.get(id) || null}
      cases={(id) => lookups.caseMap.get(id) || null}
      galleries={(id) => lookups.galleryMap.get(id) || null}
      resolveMedia={(id) => lookups.mediaMap.get(id) || null}
      serviceLinks={resolvedServiceLinks}
      allowStructuredData={!placeholderMode}
      placeholderMarker={usingPlaceholder}
    />
  );
}
