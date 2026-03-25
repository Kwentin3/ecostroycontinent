import { PublicListPage } from "../../components/public/PublicRenderers";
import { getPublishedCases } from "../../lib/read-side/public-content";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const cases = await getPublishedCases();

  return (
    <PublicListPage
      eyebrow="Published read-side"
      title="Cases"
      intro="Only published case revisions appear on the public surface."
      items={cases}
      itemHrefPrefix="/cases"
    />
  );
}
