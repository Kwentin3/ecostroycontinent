import test from "node:test";
import assert from "node:assert/strict";

import { createLlmTransport } from "../lib/llm/transport.js";
import { buildLlmConfigSnapshot, LLM_CONFIG_STATES } from "../lib/llm/config.js";
import { createLlmError, LLM_ERROR_KINDS } from "../lib/llm/errors.js";
import { requestStructuredArtifact } from "../lib/llm/facade.js";
import { runLlmConnectivityDiagnostic, runSocks5TransportDiagnostic } from "../lib/llm/diagnostics.js";
import { llmDiagnosticProbeJsonSchema, llmDiagnosticProbeSchema } from "../lib/llm/structured-output.js";
import { createGeminiProviderAdapter } from "../lib/llm/providers/gemini.js";
import { userIsSuperadmin } from "../lib/auth/roles.js";

function makeConfiguredLlmConfig() {
  return buildLlmConfigSnapshot({
    llmProvider: "gemini",
    llmModel: "gemini-3-flash-preview",
    llmGeminiApiKey: "test-gemini-api-key",
    llmGeminiBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    llmSocks5Enabled: "true",
    llmSocks5Host: "127.0.0.1",
    llmSocks5Port: "1080",
    llmSocks5Username: "proxy-user",
    llmSocks5Password: "proxy-pass"
  });
}

test("buildLlmConfigSnapshot classifies not configured, partial, and configured states", () => {
  const empty = buildLlmConfigSnapshot({});
  assert.equal(empty.state, LLM_CONFIG_STATES.NOT_CONFIGURED);

  const partial = buildLlmConfigSnapshot({
    llmProvider: "gemini",
    llmModel: "gemini-3-flash-preview",
    llmGeminiApiKey: "test-gemini-api-key",
    llmGeminiBaseUrl: "https://generativelanguage.googleapis.com/v1beta"
  });
  assert.equal(partial.state, LLM_CONFIG_STATES.PARTIALLY_CONFIGURED);

  const configured = makeConfiguredLlmConfig();
  assert.equal(configured.state, LLM_CONFIG_STATES.CONFIGURED);
  assert.equal(configured.providerConfigured, true);
  assert.equal(configured.transportConfigured, true);
});

test("userIsSuperadmin stays narrow and explicit", () => {
  assert.equal(userIsSuperadmin({ role: "superadmin" }), true);
  assert.equal(userIsSuperadmin({ role: "seo_manager" }), false);
  assert.equal(userIsSuperadmin(null), false);
});

test("createLlmTransport wires a SOCKS5 agent into outbound requests", async () => {
  const config = makeConfiguredLlmConfig();
  let capturedRequest = null;

  const transport = createLlmTransport(config, {
    requestImpl: async (request) => {
      capturedRequest = request;
      return {
        requestId: request.requestId,
        status: 200,
        headers: {},
        text: "{}"
      };
    }
  });

  const response = await transport.postJson({
    url: "https://example.test/llm",
    body: "{}",
    requestId: "req_1"
  });

  assert.equal(response.status, 200);
  assert.equal(transport.transportMode, "socks5");
  assert.ok(capturedRequest);
  assert.equal(capturedRequest.requestId, "req_1");
  assert.equal(capturedRequest.agent?.constructor?.name, "SocksProxyAgent");
});

test("createLlmTransport normalizes SOCKS5 transport failures", async () => {
  const config = makeConfiguredLlmConfig();
  const transport = createLlmTransport(config, {
    requestImpl: async () => {
      const error = new Error("connect ECONNREFUSED 127.0.0.1:1080");
      error.code = "ECONNREFUSED";
      throw error;
    }
  });

  await assert.rejects(
    () =>
      transport.postJson({
        url: "https://example.test/llm",
        body: "{}",
        requestId: "req_2"
      }),
    (error) =>
      error.kind === LLM_ERROR_KINDS.TRANSPORT &&
      error.code === "LLM_TRANSPORT_PROXY_UNREACHABLE" &&
      error.retryable === true
  );
});

test("requestStructuredArtifact succeeds with normalized and locally validated structured output", async () => {
  const config = makeConfiguredLlmConfig();
  const result = await requestStructuredArtifact(
    {
      prompt: "Return the probe payload.",
      artifactClass: "llm_diagnostic_probe",
      schemaId: "llm_diagnostic_probe.v1",
      schemaVersion: "v1",
      schemaValidator: llmDiagnosticProbeSchema,
      responseJsonSchema: llmDiagnosticProbeJsonSchema
    },
    {
      llmConfig: config,
      traceIdFactory: () => "trace_success",
      providerAdapter: {
        requestStructuredArtifact: async () => ({
          providerId: "gemini",
          modelId: config.modelId,
          providerRequestId: "provider_req_1",
          text: JSON.stringify({
            probe: "llm_diagnostic_probe",
            ok: true,
            echo: "pong"
          }),
          transportUsed: "socks5"
        })
      }
    }
  );

  assert.equal(result.status, "ok");
  assert.equal(result.traceId, "trace_success");
  assert.equal(result.transportState, "success");
  assert.equal(result.providerState, "success");
  assert.equal(result.structuredOutputState, "success");
  assert.equal(result.validationState, "success");
  assert.deepEqual(result.artifact, {
    probe: "llm_diagnostic_probe",
    ok: true,
    echo: "pong"
  });
});

test("requestStructuredArtifact fails closed when LLM config is incomplete", async () => {
  let providerCalled = false;
  const result = await requestStructuredArtifact(
    {
      prompt: "This call should never reach the provider.",
      artifactClass: "llm_diagnostic_probe",
      schemaId: "llm_diagnostic_probe.v1",
      schemaVersion: "v1",
      schemaValidator: llmDiagnosticProbeSchema,
      responseJsonSchema: llmDiagnosticProbeJsonSchema
    },
    {
      llmConfig: buildLlmConfigSnapshot({
        llmProvider: "gemini",
        llmModel: "gemini-3-flash-preview",
        llmGeminiApiKey: "test-gemini-api-key",
        llmGeminiBaseUrl: "https://generativelanguage.googleapis.com/v1beta"
      }),
      providerAdapter: {
        requestStructuredArtifact: async () => {
          providerCalled = true;
          throw new Error("provider should not be reached");
        }
      }
    }
  );

  assert.equal(result.status, "error");
  assert.equal(result.error.kind, LLM_ERROR_KINDS.FACTORY_RESOLUTION);
  assert.equal(result.configState, LLM_CONFIG_STATES.PARTIALLY_CONFIGURED);
  assert.equal(result.transportState, "not_attempted");
  assert.equal(providerCalled, false);
});

test("requestStructuredArtifact fails closed when local validation rejects the normalized artifact", async () => {
  const config = makeConfiguredLlmConfig();
  const result = await requestStructuredArtifact(
    {
      prompt: "Return an invalid probe payload.",
      artifactClass: "llm_diagnostic_probe",
      schemaId: "llm_diagnostic_probe.v1",
      schemaVersion: "v1",
      schemaValidator: llmDiagnosticProbeSchema,
      responseJsonSchema: llmDiagnosticProbeJsonSchema
    },
    {
      llmConfig: config,
      traceIdFactory: () => "trace_validation_failure",
      providerAdapter: {
        requestStructuredArtifact: async () => ({
          providerId: "gemini",
          modelId: config.modelId,
          providerRequestId: "provider_req_2",
          text: JSON.stringify({
            probe: "llm_diagnostic_probe",
            ok: true,
            echo: ""
          }),
          transportUsed: "socks5"
        })
      }
    }
  );

  assert.equal(result.status, "error");
  assert.equal(result.error.kind, LLM_ERROR_KINDS.LOCAL_VALIDATION);
  assert.equal(result.validationState, "failed");
  assert.equal(result.structuredOutputState, "success");
});

test("requestStructuredArtifact preserves provider and structured-output failure layers", async () => {
  const config = makeConfiguredLlmConfig();

  const providerFailure = await requestStructuredArtifact(
    {
      prompt: "Trigger provider failure.",
      artifactClass: "llm_diagnostic_probe",
      schemaId: "llm_diagnostic_probe.v1",
      schemaVersion: "v1",
      schemaValidator: llmDiagnosticProbeSchema,
      responseJsonSchema: llmDiagnosticProbeJsonSchema
    },
    {
      llmConfig: config,
      providerAdapter: {
        requestStructuredArtifact: async () => {
          throw createLlmError({
            kind: LLM_ERROR_KINDS.PROVIDER,
            code: "GEMINI_HTTP_429",
            message: "The Gemini provider rejected the request.",
            retryable: true,
            stage: "provider",
            details: {
              providerId: "gemini",
              modelId: config.modelId
            }
          });
        }
      }
    }
  );

  assert.equal(providerFailure.status, "error");
  assert.equal(providerFailure.error.kind, LLM_ERROR_KINDS.PROVIDER);
  assert.equal(providerFailure.providerState, "failed");

  const structuredFailure = await requestStructuredArtifact(
    {
      prompt: "Trigger structured output failure.",
      artifactClass: "llm_diagnostic_probe",
      schemaId: "llm_diagnostic_probe.v1",
      schemaVersion: "v1",
      schemaValidator: llmDiagnosticProbeSchema,
      responseJsonSchema: llmDiagnosticProbeJsonSchema
    },
    {
      llmConfig: config,
      providerAdapter: {
        requestStructuredArtifact: async () => ({
          providerId: "gemini",
          modelId: config.modelId,
          providerRequestId: "provider_req_3",
          text: "not-json",
          transportUsed: "socks5"
        })
      }
    }
  );

  assert.equal(structuredFailure.status, "error");
  assert.equal(structuredFailure.error.kind, LLM_ERROR_KINDS.STRUCTURED_OUTPUT);
  assert.equal(structuredFailure.structuredOutputState, "failed");
});

test("diagnostic wrappers preserve kind and human-readable summary", async () => {
  const config = makeConfiguredLlmConfig();
  const providerAdapter = {
    requestStructuredArtifact: async () => ({
      providerId: "gemini",
      modelId: config.modelId,
      providerRequestId: "provider_req_4",
      text: JSON.stringify({
        probe: "llm_diagnostic_probe",
        ok: true,
        echo: "pong"
      }),
      transportUsed: "socks5"
    })
  };

  const llmResult = await runLlmConnectivityDiagnostic({
    llmConfig: config,
    providerAdapter,
    traceIdFactory: () => "trace_diag_llm"
  });

  const socksResult = await runSocks5TransportDiagnostic({
    llmConfig: config,
    providerAdapter,
    traceIdFactory: () => "trace_diag_socks"
  });

  assert.equal(llmResult.diagnosticKind, "llm_test");
  assert.equal(socksResult.diagnosticKind, "socks5_transport_test");
  assert.equal(llmResult.summary, "LLM baseline is reachable and returned a validated structured artifact.");
  assert.equal(socksResult.summary, "LLM baseline is reachable and returned a validated structured artifact.");
});

test("createGeminiProviderAdapter enables minimal thinking for gemini 3 preview models", async () => {
  const config = makeConfiguredLlmConfig();
  const requestBodies = [];

  const adapter = createGeminiProviderAdapter({
    configSnapshot: config,
    transport: {
      transportMode: "socks5",
      async postJson(request) {
        requestBodies.push(JSON.parse(request.body));
        return {
          requestId: request.requestId,
          status: 200,
          headers: {},
          text: JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        probe: "llm_diagnostic_probe",
                        ok: true,
                        echo: "pong"
                      })
                    }
                  ]
                }
              }
            ]
          })
        };
      }
    }
  });

  const result = await adapter.requestStructuredArtifact({
    prompt: "Return the probe payload.",
    responseJsonSchema: llmDiagnosticProbeJsonSchema,
    requestId: "req_preview",
    traceId: "trace_preview"
  });

  assert.equal(result.providerId, "gemini");
  assert.equal(result.modelId, "gemini-3-flash-preview");
  assert.equal(requestBodies[0].generationConfig.thinkingConfig.thinkingLevel, "minimal");
});
