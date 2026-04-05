# LLM.INFRA.BASELINE.PREVIEW_CUTOVER_AND_RUNTIME_CANON_ALIGNMENT_Экостройконтинент_v0.1.report

## 1. Executive Summary

This report documents the LLM infra baseline cutover from the non-working `gemini-3-flash` runtime posture to the working `gemini-3-flash-preview` posture, and the corresponding runtime canon alignment across workspace env, server env, Docker Compose, and app runtime.

What was broken:
- `LLM Test` and `SOCKS5 Transport Test` were failing in the WebGUI.
- Live diagnostics showed that the transport layer was healthy, but the provider/model posture was not.
- The configured model id `gemini-3-flash` returned `GEMINI_HTTP_404`.
- The preview model initially answered with a non-JSON preamble, which caused structured-output normalization to fail.

What fixed it:
- The runtime baseline was moved to `gemini-3-flash-preview`.
- The Gemini adapter was updated to use a minimal-thinking posture for Gemini 3 preview models so structured-output requests return deterministic JSON for this baseline.
- The workspace env, server runtime env, docs, tests, and live runtime were synchronized to the same canonical posture.

Final outcome:
- `LLM Test` returns `ok`.
- `SOCKS5 Transport Test` returns `ok`.
- Local tests pass.
- Production runtime on the VM passes the same probe end-to-end.

## 2. Starting Point

The project already had a narrow LLM infra baseline in place:
- one internal LLM facade
- provider resolution from env
- authenticated SOCKS5 transport
- structured output as the default path for contract artifacts
- local schema validation after normalization
- admin-only diagnostics for LLM and SOCKS5

The remaining issue was not architectural scope. It was a runtime truth mismatch:
- the model id in env was not the one accepted by the provider
- the preview model needed a small adapter-side posture adjustment to make structured output deterministic in our probe path

The canonical runtime path remained the same:

`server env -> docker compose -> container env -> process.env`

## 3. Root Cause

Two independent problems were visible in diagnostics:

1. Wrong model id in runtime env
- `LLM_MODEL=gemini-3-flash` produced provider-level `404`.
- This was the immediate reason the diagnostics were red in the WebGUI.

2. Provider response shape on Gemini 3 preview
- When the model id was switched to `gemini-3-flash-preview`, the provider reached the request successfully.
- However, with the default generation posture, the response sometimes started with a human preamble such as `Here is the JSON requested:` and did not include parseable JSON.
- That meant provider success still did not guarantee structured-output success.

The fix therefore needed two parts:
- align the model id to the real preview code
- adjust the adapter posture for Gemini 3 preview so the diagnostic structured-output path is deterministic

## 4. Implementation

### 4.1 Runtime env alignment

The workspace and server runtime env were aligned to the preview model:
- `LLM_PROVIDER=gemini`
- `LLM_MODEL=gemini-3-flash-preview`
- authenticated SOCKS5 env remained unchanged in shape

The canonical app runtime env source stayed:
- `/opt/ecostroycontinent/runtime/.env`

### 4.2 Adapter posture change

The Gemini adapter was updated so that Gemini 3 preview models use a minimal-thinking posture for structured-output requests.

This change was intentionally narrow:
- it applies only to Gemini 3 preview models
- it stays inside the provider adapter boundary
- it does not change business logic
- it does not weaken local validation

The key behavioral result is that the minimal diagnostic artifact now comes back as parseable JSON instead of a preamble-only response.

### 4.3 Test updates

The LLM infra test coverage was updated to reflect the new baseline:
- the configured baseline now uses `gemini-3-flash-preview`
- a test now asserts that the Gemini adapter enables minimal thinking for preview models

### 4.4 Documentation updates

The accepted docs were updated so they no longer describe the old non-working model id as the baseline:
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/engineering/LLM_FACTORY_CONTRACT_v1.md`
- `docs/engineering/LLM_STRUCTURED_OUTPUT_CONTRACT_v1.md`
- `docs/engineering/LLM_INFRA_DOMAIN_MAP_v1.md`
- `docs/engineering/LLM_INFRA_IMPLEMENTATION_PLAN_v1.md`
- `docs/engineering/LLM_INTEGRATION_IMPLEMENTATION_PLAN_v1.md`

## 5. Local Verification

The following local checks passed after the cutover:

- `npm test`
- `npm run build`

Test result:
- `68/68` tests passed
- no test failures

Build result:
- production build succeeded
- the existing Turbopack NFT trace warning remained non-blocking and unchanged from previous runs

### Local probe result

The structured-output probe using `gemini-3-flash-preview` returned a valid artifact:

```json
{
  "status": "ok",
  "providerState": "success",
  "structuredOutputState": "success",
  "validationState": "success",
  "artifact": {
    "probe": "llm_diagnostic_probe",
    "ok": true,
    "echo": "pong"
  }
}
```

## 6. Server Rollout

The live VM was updated to match the repository baseline.

### Server-side changes performed

- `/opt/ecostroycontinent/runtime/.env` was updated to use `LLM_MODEL=gemini-3-flash-preview`
- the server checkout under `/opt/ecostroycontinent/repo` was updated to commit `ce385ca`
- the app image `ghcr.io/kwentin3/ecostroycontinent-app:latest` was rebuilt on the VM
- the `repo-app-1` container was recreated with the new image and runtime env

### Runtime canon after rollout

The canonical app runtime path stayed:

`server env -> docker compose -> container env -> process.env`

The app container now sees the preview model directly from runtime env, not from any workspace-only fallback.

## 7. Live Verification

Live verification was run inside the server container after the rollout.

Observed runtime state:
- `configState: configured`
- `providerId: gemini`
- `modelId: gemini-3-flash-preview`
- `transportConfigured: true`

Observed diagnostics:
- `LLM Test`: `ok`
- `SOCKS5 Transport Test`: `ok`

Observed result envelope:
- `providerState: success`
- `structuredOutputState: success`
- `validationState: success`
- `summary: LLM baseline is reachable and returned a validated structured artifact.`

Observed artifact:
- `probe: llm_diagnostic_probe`
- `ok: true`
- `echo: pong`

This confirmed that:
- the provider is reachable
- authenticated SOCKS5 transport is working
- the structured-output path is producing JSON
- the local validator accepts the normalized artifact

## 8. Git Trail

Relevant commits in the cutover chain:
- `e0b7f56` `fix: align llm baseline with gemini 2.5 flash`
- `ce385ca` `fix: switch llm baseline to gemini 3 flash preview`

The final pushed state is:
- branch: `main`
- remote: `origin/main`

## 9. Risks and Notes

1. Gemini 3 preview is not identical to a stable non-preview model.
- The baseline now depends on a model-specific adapter posture.
- If Google changes preview behavior, the adapter may need a follow-up update.

2. The model-specific minimal-thinking posture is intentionally narrow.
- It exists to keep the diagnostic structured-output path deterministic.
- It does not relax local validation.
- It does not weaken the contract that provider compliance is not the final truth boundary.

3. No landing-generation scope was added.
- This cutover only stabilizes the infra baseline that landing-factory work depends on.
- No public AI surface was created.
- No publish path was introduced.

## 10. Final Status

Final status:
- **LLM infra baseline is working**
- **runtime canon is aligned**
- **WebGUI diagnostics are green**
- **server rollout is complete**

The current production-ready baseline is:

`gemini` + `gemini-3-flash-preview` + authenticated SOCKS5 + structured output + local validation

This is now the canonical runtime posture for the LLM baseline in this repository.
