import { NextResponse } from "next/server";

import { getBoolean, getString } from "../../../../../lib/admin/form-data.js";
import { redirectWithError } from "../../../../../lib/admin/operation-feedback.js";
import { BootstrapSuperadminError, bootstrapSuperadminCredentials, renderBootstrapRevealHtml } from "../../../../../lib/auth/superadmin-bootstrap.js";
import { findUserByUsername, createUserRecord, deleteUserRecord } from "../../../../../lib/content-core/repository.js";
import { recordAuditEvent } from "../../../../../lib/content-ops/audit.js";

export async function POST(request) {
  const formData = await request.formData();
  const bootstrapToken = getString(formData, "bootstrapToken");
  const confirmationAccepted = getBoolean(formData, "confirm");

  try {
    const result = await bootstrapSuperadminCredentials({
      bootstrapToken,
      confirmationAccepted
    }, {
      findUserByUsername,
      createUser: createUserRecord,
      deleteUser: deleteUserRecord,
      writeAuditEvent: recordAuditEvent
    });

    const response = new NextResponse(
      renderBootstrapRevealHtml({
        targetLogin: result.targetLogin,
        generatedPassword: result.generatedPassword,
        traceId: result.traceId
      }),
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          "Content-Type": "text/html; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Referrer-Policy": "no-referrer",
          "X-Robots-Tag": "noindex, nofollow"
        }
      }
    );

    return response;
  } catch (error) {
    if (error instanceof BootstrapSuperadminError) {
      return redirectWithError(request, "/admin/bootstrap/superadmin", error);
    }

    return redirectWithError(
      request,
      "/admin/bootstrap/superadmin",
      new BootstrapSuperadminError("RUNTIME_FAILURE", "Superadmin bootstrap failed.")
    );
  }
}
