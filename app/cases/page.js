import { PublicListPage } from "../../components/public/PublicRenderers";
import { getPublishedCases, getPublishedGlobalSettings, getPublishedServices } from "../../lib/read-side/public-content";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const [cases, globalSettings, services] = await Promise.all([
    getPublishedCases(),
    getPublishedGlobalSettings(),
    getPublishedServices()
  ]);

  return (
    <PublicListPage
      eyebrow="Публичный раздел"
      title="Кейсы"
      intro="Здесь показываются только опубликованные версии кейсов."
      items={cases}
      itemHrefPrefix="/cases"
      globalSettings={globalSettings}
      currentPath="/cases"
      serviceLinks={services}
    />
  );
}
