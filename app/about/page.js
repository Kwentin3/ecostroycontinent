import { notFound } from "next/navigation";

import { StandalonePage } from "../../components/public/PublicRenderers";
import { buildPublishedLookups, getPublishedAboutPage, getPublishedGlobalSettings } from "../../lib/read-side/public-content";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [page, globalSettings, lookups] = await Promise.all([
    getPublishedAboutPage(),
    getPublishedGlobalSettings(),
    buildPublishedLookups()
  ]);

  if (!page) {
    notFound();
  }

  return (
    <StandalonePage
      page={page}
      globalSettings={globalSettings}
      services={(id) => lookups.serviceMap.get(id) || null}
      cases={(id) => lookups.caseMap.get(id) || null}
      galleries={(id) => lookups.galleryMap.get(id) || null}
      resolveMedia={(id) => lookups.mediaMap.get(id) || null}
      serviceLinks={lookups.services}
    />
  );
}
