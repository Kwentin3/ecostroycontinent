import { buildPagePreviewContext } from "../../lib/admin/page-preview.js";
import { StandalonePage } from "../public/PublicRenderers";

export function PagePreview({
  page = null,
  globalSettings = null,
  previewLookupRecords = {}
}) {
  if (!page || !globalSettings) {
    return null;
  }

  const previewContext = buildPagePreviewContext({
    globalSettings,
    previewLookupRecords
  });

  return (
    <StandalonePage
      page={page}
      globalSettings={previewContext.globalSettings}
      services={previewContext.lookupResolvers.services}
      equipment={previewContext.lookupResolvers.equipment}
      cases={previewContext.lookupResolvers.cases}
      galleries={previewContext.lookupResolvers.galleries}
      resolveMedia={previewContext.lookupResolvers.media}
    />
  );
}
