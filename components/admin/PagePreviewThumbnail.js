import adminStyles from "./admin-ui.module.css";
import { PagePreview } from "./PagePreview";

export function PagePreviewThumbnail({
  page = null,
  globalSettings = null,
  previewLookupRecords = null,
  pageTypeLabel = "",
  title = "",
  intro = "",
  live = false
}) {
  if (!page || !globalSettings) {
    return (
      <div className={adminStyles.reviewPageThumb} title={intro}>
        <div className={adminStyles.reviewPageThumbShell}>
          <div className={adminStyles.reviewPageThumbScreen}>
            <div className={adminStyles.reviewPageThumbBrowser}>
              <span className={adminStyles.reviewPageThumbDot} />
              <span className={adminStyles.reviewPageThumbDot} />
              <span className={adminStyles.reviewPageThumbDot} />
            </div>
            <div className={adminStyles.reviewPageThumbCanvasFallback}>
              {pageTypeLabel ? <span className={adminStyles.reviewPageThumbEyebrow}>{pageTypeLabel}</span> : null}
              <strong className={adminStyles.reviewPageThumbTitle}>{title}</strong>
              <p className={adminStyles.reviewPageThumbText}>{intro}</p>
            </div>
          </div>
          <div className={adminStyles.reviewPageThumbStand} aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div className={adminStyles.reviewPageThumb} title={intro}>
      <div className={adminStyles.reviewPageThumbShell}>
        <div className={adminStyles.reviewPageThumbScreen}>
          <div className={adminStyles.reviewPageThumbBrowser}>
            <span className={adminStyles.reviewPageThumbDot} />
            <span className={adminStyles.reviewPageThumbDot} />
            <span className={adminStyles.reviewPageThumbDot} />
          </div>
          <div className={adminStyles.reviewPageThumbCanvas}>
            <div className={adminStyles.reviewPageThumbViewport}>
              <div className={adminStyles.reviewPageThumbScaler}>
                <div className={adminStyles.reviewPageThumbSurface}>
                  <PagePreview
                    page={page}
                    globalSettings={globalSettings}
                    previewLookupRecords={previewLookupRecords}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={adminStyles.reviewPageThumbStand} aria-hidden="true" />
      </div>
    </div>
  );
}
