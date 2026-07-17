"use client";

import Script from "next/script";

import { normalizeMetricaPublicConfig } from "../../lib/telemetry/metrica-goals.js";

function buildMetricaSnippet({ counterId, initOptions }) {
  const numericCounterId = Number(counterId);
  const serializedOptions = JSON.stringify(initOptions);

  return `
    (function(m,e,t,r,i,k,a){
      m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for (var j = 0; j < e.scripts.length; j++) {
        if (e.scripts[j].src === r) { return; }
      }
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    ym(${numericCounterId}, "init", ${serializedOptions});
  `;
}

export function MetricaCounter({ config }) {
  const normalized = normalizeMetricaPublicConfig(config);

  if (!normalized.enabled) {
    return null;
  }

  return (
    <Script
      id="yandex-metrica-counter"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: buildMetricaSnippet(normalized)
      }}
    />
  );
}
