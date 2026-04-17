import { notFound } from "next/navigation";

import { ServicePage } from "../../../components/public/PublicRenderers";
import {
  buildPublishedLookups,
  getPublishedGlobalSettings,
  getPublishedServiceBySlug
} from "../../../lib/read-side/public-content";
import {
  getPlaceholderCases,
  getPlaceholderGlobalSettings,
  getPlaceholderServiceBySlug,
  getPlaceholderServices
} from "../../../lib/public-launch/placeholder-fixtures";
import { resolvePublicRuntimeDisplayMode } from "../../../lib/public-launch/runtime-display-mode";
import { buildPublicRouteMetadata } from "../../../lib/public-launch/seo-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const runtimeDisplayMode = await resolvePublicRuntimeDisplayMode(await searchParams);
  const placeholderMode = runtimeDisplayMode.placeholderFallbackEnabled;
  const [publishedService, globalSettings] = await Promise.all([
    getPublishedServiceBySlug(slug),
    getPublishedGlobalSettings()
  ]);
  const placeholderService = placeholderMode ? getPlaceholderServiceBySlug(slug) : null;
  const service = publishedService || placeholderService;
  const siteName = globalSettings?.publicBrandName || "Экостройконтинент";
  return buildPublicRouteMetadata({
    pathname: `/services/${slug}`,
    placeholderMode,
    title: service?.seo?.metaTitle || service?.h1 || service?.title || "Услуга",
    description: service?.seo?.metaDescription || service?.summary || "Детальная страница услуги: scope, proof и следующий шаг к контакту.",
    seo: service?.seo,
    siteName
  });
}

export default async function ServiceDetailPage({ params, searchParams }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const runtimeDisplayMode = await resolvePublicRuntimeDisplayMode(resolvedSearchParams);
  const placeholderMode = runtimeDisplayMode.placeholderFallbackEnabled;

  const [publishedService, globalSettings, lookups] = await Promise.all([
    getPublishedServiceBySlug(slug),
    getPublishedGlobalSettings(),
    buildPublishedLookups()
  ]);

  const placeholderService = placeholderMode ? getPlaceholderServiceBySlug(slug) : null;
  const service = publishedService || placeholderService;

  if (!service) {
    notFound();
  }

  const usingPlaceholder = !publishedService && Boolean(placeholderService);
  const relatedCases = usingPlaceholder
    ? getPlaceholderCases().filter((item) => (service.relatedCaseIds || []).includes(item.entityId))
    : (service.relatedCaseIds || []).map((id) => lookups.caseMap.get(id)).filter(Boolean);

  const resolvedGlobalSettings = globalSettings || (placeholderMode ? getPlaceholderGlobalSettings() : null);
  const resolvedServiceLinks = lookups.services.length > 0
    ? lookups.services
    : (placeholderMode ? getPlaceholderServices() : []);

  return (
    <ServicePage
      service={service}
      relatedCases={relatedCases}
      galleries={(id) => lookups.galleryMap.get(id) || null}
      resolveMedia={(id) => lookups.mediaMap.get(id) || null}
      globalSettings={resolvedGlobalSettings}
      serviceLinks={resolvedServiceLinks}
      allowStructuredData={!placeholderMode}
      placeholderMarker={usingPlaceholder}
    />
  );
}
