import { notFound } from "next/navigation";

import { CasePage, PublicHoldingPage } from "../../../components/public/PublicRenderers";
import {
  buildPublishedLookups,
  getPublishedCaseBySlug,
  getPublishedGlobalSettings,
  getPublishedServices
} from "../../../lib/read-side/public-content";
import {
  getPlaceholderCaseBySlug,
  getPlaceholderGlobalSettings,
  getPlaceholderServices
} from "../../../lib/public-launch/placeholder-fixtures";
import { resolvePublicRuntimeDisplayMode } from "../../../lib/public-launch/runtime-display-mode";
import { buildPublicRouteMetadata } from "../../../lib/public-launch/seo-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const runtimeDisplayMode = await resolvePublicRuntimeDisplayMode(await searchParams);
  const placeholderMode = runtimeDisplayMode.placeholderFallbackEnabled || runtimeDisplayMode.underConstruction;
  const globalSettings = await getPublishedGlobalSettings();
  const siteName = globalSettings?.publicBrandName || "Экостройконтинент";

  if (runtimeDisplayMode.underConstruction) {
    return buildPublicRouteMetadata({
      pathname: `/cases/${slug}`,
      placeholderMode,
      title: "Кейс — в режиме подготовки",
      description: "Детальная страница кейса временно показывает поверхность режима подготовки.",
      siteName
    });
  }

  const publishedCase = await getPublishedCaseBySlug(slug);
  const placeholderCase = placeholderMode ? getPlaceholderCaseBySlug(slug) : null;
  const item = publishedCase || placeholderCase;

  return buildPublicRouteMetadata({
    pathname: `/cases/${slug}`,
    placeholderMode,
    title: item?.seo?.metaTitle || item?.title || "Кейс",
    description: item?.seo?.metaDescription || item?.result || item?.task || "Детальная страница кейса с задачей, объёмом работ и результатом.",
    seo: item?.seo,
    siteName
  });
}

export default async function CaseDetailPage({ params, searchParams }) {
  const { slug } = await params;
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
        currentPath={`/cases/${slug}`}
        serviceLinks={services}
        title="Детальная страница кейса в режиме подготовки"
        description="Детальная страница кейса временно отключена в пользу единого режима подготовки."
      />
    );
  }

  const [publishedCase, lookups, globalSettings] = await Promise.all([
    getPublishedCaseBySlug(slug),
    buildPublishedLookups(),
    getPublishedGlobalSettings()
  ]);

  const placeholderCase = placeholderMode ? getPlaceholderCaseBySlug(slug) : null;
  const item = publishedCase || placeholderCase;

  if (!item) {
    notFound();
  }

  const usingPlaceholder = !publishedCase && Boolean(placeholderCase);
  const relatedServices = usingPlaceholder
    ? getPlaceholderServices().filter((service) => (item.serviceIds || []).includes(service.entityId))
    : (item.serviceIds || []).map((id) => lookups.serviceMap.get(id)).filter(Boolean);

  const resolvedGlobalSettings = globalSettings || (placeholderMode ? getPlaceholderGlobalSettings() : null);
  const resolvedServiceLinks = lookups.services.length > 0
    ? lookups.services
    : (placeholderMode ? getPlaceholderServices() : []);

  return (
    <CasePage
      item={item}
      relatedServices={relatedServices}
      galleries={(id) => lookups.galleryMap.get(id) || null}
      resolveMedia={(id) => lookups.mediaMap.get(id) || null}
      globalSettings={resolvedGlobalSettings}
      serviceLinks={resolvedServiceLinks}
      allowStructuredData={!placeholderMode}
      placeholderMarker={usingPlaceholder}
    />
  );
}
