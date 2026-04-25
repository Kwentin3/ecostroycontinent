const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseContactProjectionSignals(html) {
  const bindingMode = html.match(/data-contact-binding-mode="([^"]+)"/)?.[1] ?? null;
  const readiness = html.match(/data-contact-readiness="([^"]+)"/)?.[1] ?? null;
  const token = html.match(/data-contact-consistency-token="([^"]+)"/)?.[1] ?? null;

  return {
    bindingMode,
    readiness,
    token
  };
}

async function fetchSurface(path) {
  const response = await fetch(new URL(path, baseUrl), {
    method: "GET",
    redirect: "manual"
  });
  const html = await response.text();

  return {
    path,
    status: response.status,
    signals: response.status === 200 ? parseContactProjectionSignals(html) : null
  };
}

function summarizeMode(mode, surfaces) {
  const successful = surfaces.filter((surface) => surface.status === 200);
  const tokenSet = new Set();
  const readinessSet = new Set();
  const bindingModeSet = new Set();

  for (const surface of successful) {
    ensure(surface.signals?.token, `[${mode}] Missing contact consistency token on ${surface.path}.`);
    ensure(surface.signals?.readiness, `[${mode}] Missing contact readiness marker on ${surface.path}.`);
    ensure(surface.signals?.bindingMode, `[${mode}] Missing contact binding marker on ${surface.path}.`);

    tokenSet.add(surface.signals.token);
    readinessSet.add(surface.signals.readiness);
    bindingModeSet.add(surface.signals.bindingMode);
  }

  return {
    mode,
    inspected: successful.length,
    uniqueTokens: [...tokenSet],
    uniqueReadiness: [...readinessSet],
    uniqueBindingModes: [...bindingModeSet],
    routes: surfaces
  };
}

async function runMode(mode, routes) {
  const surfaces = [];

  for (const route of routes) {
    surfaces.push(await fetchSurface(route));
  }

  const summary = summarizeMode(mode, surfaces);

  ensure(summary.inspected > 0, `[${mode}] No 200 public routes were available for consistency checks.`);
  ensure(summary.uniqueTokens.length === 1, `[${mode}] Contact consistency token drift detected across public surfaces.`);
  ensure(summary.uniqueReadiness.length === 1, `[${mode}] Contact readiness drift detected across public surfaces.`);
  ensure(summary.uniqueBindingModes.length === 1, `[${mode}] Contact binding mode drift detected across public surfaces.`);

  return summary;
}

async function main() {
  const offModeRoutes = ["/", "/services", "/cases", "/contacts"];
  const onModeRoutes = [
    "/?__placeholder=on",
    "/services?__placeholder=on",
    "/cases?__placeholder=on",
    "/contacts?__placeholder=on",
    "/services/placeholder-drainage?__placeholder=on",
    "/cases/placeholder-case-drainage-pit?__placeholder=on"
  ];

  const offSummary = await runMode("off", offModeRoutes);
  const onSummary = await runMode("on", onModeRoutes);

  const report = {
    traceId: `contact-consistency-${Date.now().toString(36)}`,
    baseUrl,
    off: offSummary,
    on: onSummary
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(`[contact-consistency] FAILED: ${error.message}`);
  process.exitCode = 1;
});
