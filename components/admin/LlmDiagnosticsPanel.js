"use client";

import { useState } from "react";

import styles from "./admin-ui.module.css";

const DIAGNOSTICS = {
  llm_test: {
    title: "LLM Test",
    description: "Проверяет, что провайдер, structured output и local validation отрабатывают end-to-end через внутренний фасад.",
    buttonLabel: "Запустить LLM Test"
  },
  socks5_transport_test: {
    title: "SOCKS5 Transport Test",
    description: "Проверяет, что outbound LLM traffic реально проходит через authenticated SOCKS5 path и сбой виден на правильном слое.",
    buttonLabel: "Проверить SOCKS5"
  }
};

function formatValue(value) {
  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }

  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

function DiagnosticResultDetails({ payload }) {
  const result = payload?.result;

  if (!payload) {
    return <p className={styles.mutedText}>Пока тест не запускался.</p>;
  }

  if (!result) {
    return (
      <div className={styles.statusPanelBlocking}>
        <strong>Диагностика недоступна</strong>
        <p className={styles.mutedText}>{payload.message || payload.error || "Не удалось получить результат диагностики."}</p>
      </div>
    );
  }

  const summaryTone = result.status === "ok" ? styles.statusPanelInfo : styles.statusPanelBlocking;

  return (
    <div className={styles.stack}>
      <div className={summaryTone}>
        <strong>{result.status === "ok" ? "Успешно" : "Ошибка"}</strong>
        <p className={styles.mutedText}>{result.summary || "—"}</p>
      </div>

      <table className={styles.table}>
        <tbody>
          <tr>
            <th>HTTP status</th>
            <td>{formatValue(payload.httpStatus)}</td>
          </tr>
          <tr>
            <th>Diagnostic kind</th>
            <td>{formatValue(payload.diagnosticKind)}</td>
          </tr>
          <tr>
            <th>Effective provider</th>
            <td>{formatValue(result.providerId)}</td>
          </tr>
          <tr>
            <th>Effective model</th>
            <td>{formatValue(result.modelId)}</td>
          </tr>
          <tr>
            <th>Config state</th>
            <td>{formatValue(result.configState)}</td>
          </tr>
          <tr>
            <th>SOCKS5 used</th>
            <td>{formatValue(result.transportUsed)}</td>
          </tr>
          <tr>
            <th>Transport result</th>
            <td>{formatValue(result.transportState)}</td>
          </tr>
          <tr>
            <th>Provider result</th>
            <td>{formatValue(result.providerState)}</td>
          </tr>
          <tr>
            <th>Structured output</th>
            <td>{formatValue(result.structuredOutputState)}</td>
          </tr>
          <tr>
            <th>Local validation</th>
            <td>{formatValue(result.validationState)}</td>
          </tr>
          <tr>
            <th>Retryable</th>
            <td>{formatValue(result.retryable)}</td>
          </tr>
          <tr>
            <th>Trace ID</th>
            <td>{formatValue(result.traceId)}</td>
          </tr>
          <tr>
            <th>Request ID</th>
            <td>{formatValue(result.requestId)}</td>
          </tr>
        </tbody>
      </table>

      {result.error ? (
        <details className={styles.statusPanelWarning}>
          <summary style={{ cursor: "pointer" }}>Failure details</summary>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {JSON.stringify(result.error, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

function DiagnosticCard({ diagnosticKind, payload, isLoading, onRun }) {
  const meta = DIAGNOSTICS[diagnosticKind];

  return (
    <article className={styles.panel}>
      <div className={styles.stack}>
        <div>
          <p className={styles.eyebrow}>{meta.title}</p>
          <p className={styles.mutedText}>{meta.description}</p>
        </div>
        <div className={styles.inlineActions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => onRun(diagnosticKind)}
            disabled={isLoading}
          >
            {isLoading ? "Выполняется..." : meta.buttonLabel}
          </button>
        </div>
        <DiagnosticResultDetails payload={payload} />
      </div>
    </article>
  );
}

export function LlmDiagnosticsPanel() {
  const [results, setResults] = useState({});
  const [loadingKind, setLoadingKind] = useState("");

  async function runDiagnostic(diagnosticKind) {
    setLoadingKind(diagnosticKind);

    try {
      const response = await fetch("/api/admin/diagnostics/llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ diagnosticKind })
      });

      const payload = await response.json().catch(() => null);
      setResults((current) => ({
        ...current,
        [diagnosticKind]: {
          ...(payload ?? {}),
          httpStatus: response.status
        }
      }));
    } catch (error) {
      setResults((current) => ({
        ...current,
        [diagnosticKind]: {
          httpStatus: 0,
          diagnosticKind,
          error: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Не удалось выполнить диагностику.",
          result: null
        }
      }));
    } finally {
      setLoadingKind("");
    }
  }

  return (
    <div className={styles.gridTwo}>
      <DiagnosticCard
        diagnosticKind="llm_test"
        payload={results.llm_test}
        isLoading={loadingKind === "llm_test"}
        onRun={runDiagnostic}
      />
      <DiagnosticCard
        diagnosticKind="socks5_transport_test"
        payload={results.socks5_transport_test}
        isLoading={loadingKind === "socks5_transport_test"}
        onRun={runDiagnostic}
      />
    </div>
  );
}
