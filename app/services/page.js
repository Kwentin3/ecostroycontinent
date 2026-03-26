import { PublicListPage } from "../../components/public/PublicRenderers";
import { getPublishedServices } from "../../lib/read-side/public-content";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await getPublishedServices();

  return (
    <PublicListPage
      eyebrow="Публичный раздел"
      title="Услуги"
      intro="Здесь показываются только опубликованные версии услуг."
      items={services}
      itemHrefPrefix="/services"
    />
  );
}
