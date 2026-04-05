import { buildLlmDiagnosticProbeRequest } from "./structured-output.js";
import { requestStructuredArtifact } from "./facade.js";

function makeSummary(result) {
  if (result.status === "ok") {
    return "LLM baseline is reachable and returned a validated structured artifact.";
  }

  const kind = result.error?.kind ?? "unknown";

  switch (kind) {
    case "factory_resolution_error":
      return "LLM configuration is incomplete or unsupported.";
    case "transport_error":
      return "The outbound transport path failed before provider completion.";
    case "provider_error":
      return "The provider responded but did not complete the request successfully.";
    case "structured_output_error":
      return "The provider response could not be normalized into a structured artifact.";
    case "local_validation_error":
      return "The normalized structured artifact failed local validation.";
    default:
      return "The diagnostic request failed.";
  }
}

function withDiagnosticSummary(result, diagnosticKind) {
  return {
    ...result,
    diagnosticKind,
    summary: makeSummary(result)
  };
}

export async function runLlmConnectivityDiagnostic(deps = {}) {
  const request = buildLlmDiagnosticProbeRequest();
  const result = await requestStructuredArtifact(request, deps);
  return withDiagnosticSummary(result, "llm_test");
}

export async function runSocks5TransportDiagnostic(deps = {}) {
  const request = buildLlmDiagnosticProbeRequest();
  const result = await requestStructuredArtifact(request, deps);
  return withDiagnosticSummary(result, "socks5_transport_test");
}
