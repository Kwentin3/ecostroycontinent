import { PublicHoldingPage, PublicListPage } from "../../components/public/PublicRenderers";
import {
  getPublishedCases,
  getPublishedGlobalSettings,
  getPublishedServices
} from "../../lib/read-side/public-content";
import { getPlaceholderGlobalSettings, getPlaceholderServices } from "../../lib/public-launch/placeholder-fixtures";
import { resolvePublicRuntimeDisplayMode } from "../../lib/public-launch/runtime-display-mode";
import { buildPublicRouteMetadata } from "../../lib/public-launch/seo-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const runtimeDisplayMode = await resolvePublicRuntimeDisplayMode(await searchParams);
  const placeholderMode = runtimeDisplayMode.placeholderFallbackEnabled || runtimeDisplayMode.underConstruction;
  const globalSettings = await getPublishedGlobalSettings();
  const siteName = globalSettings?.publicBrandName || "Экостройконтинент";
  const title = runtimeDisplayMode.underConstruction ? "Услуги — в режиме подготовки" : "Услуги";
  const description = runtimeDisplayMode.underConstruction
    ? "Раздел услуг временно показывает поверхность режима подготовки."
    : "Каталог услуг с переходом на отдельные страницы услуг.";

  return buildPublicRouteMetadata({
    pathname: "/services",
    placeholderMode,
    title,
    description,
    siteName
  });
}

export default async function ServicesPage({ searchParams }) {
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
        currentPath="/services"
        serviceLinks={services}
        title="Раздел услуг в режиме подготовки"
        description="Каталог услуг временно переведён в режим подготовки."
      />
    );
  }

  const [services, cases, globalSettings] = await Promise.all([
    getPublishedServices(),
    getPublishedCases(),
    getPublishedGlobalSettings()
  ]);

  const usingPlaceholder = placeholderMode && services.length === 0;
  const resolvedServices = usingPlaceholder ? getPlaceholderServices() : services;
  const resolvedGlobalSettings = globalSettings || (placeholderMode ? getPlaceholderGlobalSettings() : null);
  const hasPublishedCases = cases.some((item) => item?.slug && item?.title);

  return (
      <PublicListPage
        title="Услуги"
        items={resolvedServices}
      itemHrefPrefix="/services"
      globalSettings={resolvedGlobalSettings}
      currentPath="/services"
      serviceLinks={resolvedServices}
      allowStructuredData={!placeholderMode}
      placeholderMarker={usingPlaceholder}
      showCasesNav={hasPublishedCases}
      showIntroHero={false}
      emptyTitle="Каталог услуг пока пуст"
      emptyDescription="Опубликованные страницы услуг ещё не готовы для этого режима."
    />
  );
}
