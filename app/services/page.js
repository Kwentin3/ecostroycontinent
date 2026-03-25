import { PublicListPage } from "../../components/public/PublicRenderers";
import { getPublishedServices } from "../../lib/read-side/public-content";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await getPublishedServices();

  return (
    <PublicListPage
      eyebrow="Published read-side"
      title="Services"
      intro="Only published service revisions appear on the public surface."
      items={services}
      itemHrefPrefix="/services"
    />
  );
}
