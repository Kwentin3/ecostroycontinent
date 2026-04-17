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
import { buildPlaceholderRobotsMetadata, resolvePlaceholderMode } from "../../../lib/public-launch/placeholder-mode";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const placeholderMode = await resolvePlaceholderMode(await searchParams);
  return buildPlaceholderRobotsMetadata(placeholderMode);
}

export default async function ServiceDetailPage({ params, searchParams }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const placeholderMode = await resolvePlaceholderMode(resolvedSearchParams);

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
      placeholderMarker={usingPlaceholder}
    />
  );
}
