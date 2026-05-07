export async function noopTelemetryAdapter(_event) {
  return { ok: true, adapter: "noop" };
}

export async function dispatchTelemetryEvent(event, { adapters = [noopTelemetryAdapter] } = {}) {
  const results = [];

  for (const adapter of adapters) {
    try {
      results.push(await adapter(event));
    } catch {
      results.push({ ok: false, adapter: "unknown", error: "ADAPTER_FAILED" });
    }
  }

  return results;
}
