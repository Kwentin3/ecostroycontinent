import { notFound } from "next/navigation";

import { CasePage } from "../../../components/public/PublicRenderers";
import { buildPublishedLookups, getPublishedCaseBySlug, getPublishedGlobalSettings } from "../../../lib/read-side/public-content";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({ params }) {
  const { slug } = await params;
  const [item, lookups, globalSettings] = await Promise.all([
    getPublishedCaseBySlug(slug),
    buildPublishedLookups(),
    getPublishedGlobalSettings()
  ]);

  if (!item) {
    notFound();
  }

  const relatedServices = (item.serviceIds || []).map((id) => lookups.serviceMap.get(id)).filter(Boolean);

  return (
    <CasePage
      item={item}
      relatedServices={relatedServices}
      galleries={(id) => lookups.galleryMap.get(id) || null}
      resolveMedia={(id) => lookups.mediaMap.get(id) || null}
      globalSettings={globalSettings}
      serviceLinks={lookups.services}
    />
  );
}
