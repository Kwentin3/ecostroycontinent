import { getRuntimeConfig } from "../../../lib/runtime-config";

export async function GET() {
  const config = getRuntimeConfig();

  return Response.json({
    status: "ok",
    service: "next-app",
    nodeEnv: config.nodeEnv,
    databaseConfigured: config.databaseConfigured
  });
}
