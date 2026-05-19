import { cookies } from "next/headers.js";

import { INTERNAL_TRAFFIC_COOKIE_NAME } from "../../lib/telemetry/internal-marker.js";
import { getMetricaPublicConfig } from "../../lib/telemetry/metrica-config.js";
import { AnalyticsTracker } from "./AnalyticsTracker.js";
import { MetricaCounter } from "./MetricaCounter.js";

export async function PublicTrackingBoundary({ currentPath = "/" }) {
  const cookieStore = await cookies();
  const internalMarked = cookieStore.get(INTERNAL_TRAFFIC_COOKIE_NAME)?.value === "1";
  const trackingAllowed = !internalMarked && !String(currentPath || "").startsWith("/admin");
  const metricaConfig = getMetricaPublicConfig({
    currentPath,
    trackingAllowed
  });

  return (
    <>
      <MetricaCounter config={metricaConfig} />
      <AnalyticsTracker metricaConfig={metricaConfig} />
    </>
  );
}
