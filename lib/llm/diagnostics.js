import { buildLlmDiagnosticProbeRequest } from "./structured-output.js";
import { requestStructuredArtifact } from "./facade.js";

function makeSummary(result) {
  if (result.status === "ok") {
    return "LLM-базовый контур доступен и вернул проверенный структурированный артефакт.";
  }

  const kind = result.error?.kind ?? "unknown";

  switch (kind) {
    case "factory_resolution_error":
      return "Конфигурация LLM неполна или не поддерживается.";
    case "transport_error":
      return "Исходящий транспортный путь завершился с ошибкой до ответа провайдера.";
    case "provider_error":
      return "Провайдер ответил, но не завершил запрос успешно.";
    case "structured_output_error":
      return "Ответ провайдера не удалось нормализовать в структурированный артефакт.";
    case "local_validation_error":
      return "Нормализованный структурированный артефакт не прошёл локальную валидацию.";
    default:
      return "Диагностический запрос завершился с ошибкой.";
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
