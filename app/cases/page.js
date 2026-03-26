import { PublicListPage } from "../../components/public/PublicRenderers";
import { getPublishedCases } from "../../lib/read-side/public-content";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const cases = await getPublishedCases();

  return (
    <PublicListPage
      eyebrow="Публичный раздел"
      title="Кейсы"
      intro="Здесь показываются только опубликованные версии кейсов."
      items={cases}
      itemHrefPrefix="/cases"
    />
  );
}
