import { NextResponse } from "next/server.js";

import { requireRouteSuperadmin } from "../../../../../lib/admin/route-helpers.js";
import { runLlmConnectivityDiagnostic, runSocks5TransportDiagnostic } from "../../../../../lib/llm/diagnostics.js";

function jsonResponse(body, init = {}) {
  return NextResponse.json(body, {
    status: init.status ?? 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, private, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
      ...(init.headers ?? {})
    }
  });
}

export async function POST(request) {
  const { response } = await requireRouteSuperadmin(request);

  if (response) {
    return response;
  }

  let body = null;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const diagnosticKind = body?.diagnosticKind;

  if (diagnosticKind !== "llm_test" && diagnosticKind !== "socks5_transport_test") {
    return jsonResponse(
      {
        ok: false,
        diagnosticKind: diagnosticKind ?? "unknown",
        error: "INVALID_DIAGNOSTIC_KIND",
        message: "Неизвестный diagnosticKind."
      },
      { status: 400 }
    );
  }

  try {
    const result =
      diagnosticKind === "llm_test"
        ? await runLlmConnectivityDiagnostic()
        : await runSocks5TransportDiagnostic();

    return jsonResponse({
      ok: result.status === "ok",
      diagnosticKind,
      result
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        diagnosticKind,
        error: "RUNTIME_FAILURE",
        message: error instanceof Error ? error.message : "Диагностика завершилась с ошибкой."
      },
      { status: 500 }
    );
  }
}
