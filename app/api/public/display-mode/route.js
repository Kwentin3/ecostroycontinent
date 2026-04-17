import { NextResponse } from "next/server";

import { buildPublicDisplayModeSnapshot } from "../../../../lib/public-launch/display-mode.js";
import { getDisplayModeState } from "../../../../lib/public-launch/display-mode-store.js";

export const dynamic = "force-dynamic";

export async function GET() {
  const displayModeState = await getDisplayModeState();
  const snapshot = buildPublicDisplayModeSnapshot({
    mode: displayModeState?.mode,
    source: "persisted"
  });

  return NextResponse.json(
    {
      mode: snapshot.mode,
      placeholderFallbackEnabled: snapshot.placeholderFallbackEnabled,
      underConstruction: snapshot.underConstruction,
      indexingSuppressed: snapshot.indexingSuppressed
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
