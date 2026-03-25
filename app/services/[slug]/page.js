import { notFound } from "next/navigation";

import { ServicePage } from "../../../components/public/PublicRenderers";
import { buildPublishedLookups, getPublishedGlobalSettings, getPublishedServiceBySlug } from "../../../lib/read-side/public-content";

export const dynamic = "force-dynamic";

export default async function ServiceDetailPage({ params }) {
  const { slug } = await params;
  const [service, globalSettings, lookups] = await Promise.all([
    getPublishedServiceBySlug(slug),
    getPublishedGlobalSettings(),
    buildPublishedLookups()
  ]);

  if (!service) {
    notFound();
  }

  const relatedCases = (service.relatedCaseIds || []).map((id) => lookups.caseMap.get(id)).filter(Boolean);

  return (
    <ServicePage
      service={service}
      relatedCases={relatedCases}
      galleries={(id) => lookups.galleryMap.get(id) || null}
      globalSettings={globalSettings}
    />
  );
}
