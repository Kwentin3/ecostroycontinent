import { PublicListPage } from "../../components/public/PublicRenderers";
import { getPublishedGlobalSettings, getPublishedServices } from "../../lib/read-side/public-content";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const [services, globalSettings] = await Promise.all([
    getPublishedServices(),
    getPublishedGlobalSettings()
  ]);

  return (
    <PublicListPage
      eyebrow="Публичный раздел"
      title="Услуги"
      intro="Здесь показываются только опубликованные версии услуг."
      items={services}
      itemHrefPrefix="/services"
      globalSettings={globalSettings}
      currentPath="/services"
      serviceLinks={services}
    />
  );
}
