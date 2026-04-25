import { notFound } from "next/navigation";

import { PublicHoldingPage, ServicePage } from "../../../components/public/PublicRenderers";
import { ENTITY_TYPES } from "../../../lib/content-core/content-types";
import { resolveEquipmentRecordsForEntity } from "../../../lib/content-core/equipment-relations.js";
import {
  buildPublishedLookups,
  getPublishedGlobalSettings,
  getPublishedServices,
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
  const placeholderMode = runtimeDisplayMode.placeholderFallbackEnabled || runtimeDisplayMode.underConstruction;
  const globalSettings = await getPublishedGlobalSettings();
  const siteName = globalSettings?.publicBrandName || "Экостройконтинент";

  if (runtimeDisplayMode.underConstruction) {
    return buildPublicRouteMetadata({
      pathname: `/services/${slug}`,
      placeholderMode,
      title: "Услуга — в режиме подготовки",
      description: "Маршрут услуги временно показывает поверхность режима подготовки.",
      siteName
    });
  }

  const publishedService = await getPublishedServiceBySlug(slug);
  const placeholderService = placeholderMode ? getPlaceholderServiceBySlug(slug) : null;
  const service = publishedService || placeholderService;
  return buildPublicRouteMetadata({
    pathname: `/services/${slug}`,
    placeholderMode,
    title: service?.seo?.metaTitle || service?.h1 || service?.title || "Услуга",
    description: service?.seo?.metaDescription || service?.summary || "Детальная страница услуги: объём работ, подтверждение и следующий шаг к контакту.",
    seo: service?.seo,
    siteName
  });
}

export default async function ServiceDetailPage({ params, searchParams }) {
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
        currentPath={`/services/${slug}`}
        serviceLinks={services}
        title="Детальная страница услуги в режиме подготовки"
        description="Детальная страница услуги временно отключена в пользу единого режима подготовки."
      />
    );
  }

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
  const relatedEquipment = usingPlaceholder
    ? []
    : resolveEquipmentRecordsForEntity({
        payload: service,
        equipmentRecords: lookups.equipment,
        entityType: ENTITY_TYPES.SERVICE,
        entityId: service.entityId
      });

  const resolvedGlobalSettings = globalSettings || (placeholderMode ? getPlaceholderGlobalSettings() : null);
  const resolvedServiceLinks = lookups.services.length > 0
    ? lookups.services
    : (placeholderMode ? getPlaceholderServices() : []);

  return (
    <ServicePage
      service={service}
      relatedCases={relatedCases}
      relatedEquipment={relatedEquipment}
      galleries={(id) => lookups.galleryMap.get(id) || null}
      resolveMedia={(id) => lookups.mediaMap.get(id) || null}
      globalSettings={resolvedGlobalSettings}
      serviceLinks={resolvedServiceLinks}
      allowStructuredData={!placeholderMode}
      placeholderMarker={usingPlaceholder}
    />
  );
}
