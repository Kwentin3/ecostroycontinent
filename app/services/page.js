import { PublicListPage } from "../../components/public/PublicRenderers";
import {
  getPublishedGlobalSettings,
  getPublishedServices
} from "../../lib/read-side/public-content";
import { getPlaceholderGlobalSettings, getPlaceholderServices } from "../../lib/public-launch/placeholder-fixtures";
import { resolvePlaceholderMode } from "../../lib/public-launch/placeholder-mode";
import { buildPublicRouteMetadata } from "../../lib/public-launch/seo-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const placeholderMode = await resolvePlaceholderMode(await searchParams);
  const globalSettings = await getPublishedGlobalSettings();
  const siteName = globalSettings?.publicBrandName || "Экостройконтинент";
  return buildPublicRouteMetadata({
    pathname: "/services",
    placeholderMode,
    title: "Услуги",
    description: "Каталог услуг с переходом на отдельные service detail страницы.",
    siteName
  });
}

export default async function ServicesPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const placeholderMode = await resolvePlaceholderMode(resolvedSearchParams);
  const [services, globalSettings] = await Promise.all([
    getPublishedServices(),
    getPublishedGlobalSettings()
  ]);

  const usingPlaceholder = placeholderMode && services.length === 0;
  const resolvedServices = usingPlaceholder ? getPlaceholderServices() : services;
  const resolvedGlobalSettings = globalSettings || (placeholderMode ? getPlaceholderGlobalSettings() : null);

  return (
    <PublicListPage
      eyebrow="Каталог услуг"
      title="Услуги"
      intro="Раздел ведёт к отдельным service detail страницам с scope, proof и следующим действием."
      items={resolvedServices}
      itemHrefPrefix="/services"
      globalSettings={resolvedGlobalSettings}
      currentPath="/services"
      serviceLinks={resolvedServices}
      allowStructuredData={!placeholderMode}
      placeholderMarker={usingPlaceholder}
      emptyTitle="Каталог услуг пока пуст"
      emptyDescription="Опубликованные service detail страницы ещё не готовы для этого режима."
      emptyActionHref="/cases"
      emptyActionLabel="Перейти в раздел кейсов"
      nextStepTitle="Следующий шаг"
      nextStepDescription="Выберите услугу для перехода к деталям или сразу откройте контактный маршрут."
      nextStepPrimaryHref="/contacts"
      nextStepPrimaryLabel="Связаться"
      nextStepSecondaryHref="/cases"
      nextStepSecondaryLabel="Смотреть кейсы"
      nextStepTone="tinted"
    />
  );
}
