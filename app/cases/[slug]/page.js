import { notFound } from "next/navigation";

import { CasePage } from "../../../components/public/PublicRenderers";
import {
  buildPublishedLookups,
  getPublishedCaseBySlug,
  getPublishedGlobalSettings
} from "../../../lib/read-side/public-content";
import {
  getPlaceholderCaseBySlug,
  getPlaceholderGlobalSettings,
  getPlaceholderServices
} from "../../../lib/public-launch/placeholder-fixtures";
import { buildPlaceholderRobotsMetadata, resolvePlaceholderMode } from "../../../lib/public-launch/placeholder-mode";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const placeholderMode = await resolvePlaceholderMode(await searchParams);
  return buildPlaceholderRobotsMetadata(placeholderMode);
}

export default async function CaseDetailPage({ params, searchParams }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const placeholderMode = await resolvePlaceholderMode(resolvedSearchParams);

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
      placeholderMarker={usingPlaceholder}
    />
  );
}
