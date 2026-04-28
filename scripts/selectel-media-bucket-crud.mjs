#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";

const DEFAULT_ENDPOINT = "https://s3.ru-3.storage.selcloud.ru";
const DEFAULT_REGION = "ru-3";
const DEFAULT_SECRET_PACK = "docs/selectel/LOCAL_SECRETS_NOT_FOR_GIT.md";
const DEFAULT_PREFIX = "media/__crud-smoke";

function parseArgs(argv) {
  const options = {
    bucket: "",
    endpoint: "",
    region: "",
    accessKeyId: "",
    secretAccessKey: "",
    prefix: DEFAULT_PREFIX,
    purpose: "media",
    fromLocalSecrets: "",
    json: false,
    keepObject: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--bucket") {
      options.bucket = argv[++index] ?? "";
      continue;
    }

    if (value === "--endpoint") {
      options.endpoint = argv[++index] ?? "";
      continue;
    }

    if (value === "--region") {
      options.region = argv[++index] ?? "";
      continue;
    }

    if (value === "--access-key-id") {
      options.accessKeyId = argv[++index] ?? "";
      continue;
    }

    if (value === "--secret-access-key") {
      options.secretAccessKey = argv[++index] ?? "";
      continue;
    }

    if (value === "--prefix") {
      options.prefix = argv[++index] ?? "";
      continue;
    }

    if (value === "--purpose") {
      options.purpose = argv[++index] ?? "";
      continue;
    }

    if (value === "--from-local-secrets") {
      const next = argv[index + 1];
      options.fromLocalSecrets = next && !next.startsWith("--") ? next : DEFAULT_SECRET_PACK;
      if (next && !next.startsWith("--")) {
        index += 1;
      }
      continue;
    }

    if (value === "--json") {
      options.json = true;
      continue;
    }

    if (value === "--keep-object") {
      options.keepObject = true;
      continue;
    }

    if (value === "--help" || value === "-h") {
      options.help = true;
      continue;
    }

    throw new Error(`Unknown argument: ${value}`);
  }

  return options;
}

function printHelp() {
  console.log("Usage: node scripts/selectel-media-bucket-crud.mjs [options]");
  console.log("");
  console.log("Isolated CRUD probe for the Selectel S3 media bucket.");
  console.log("");
  console.log("Options:");
  console.log("  --from-local-secrets [PATH]  Read credentials from local secret-pack markdown.");
  console.log("  --purpose media              Secret-pack block to read. Default: media.");
  console.log("  --bucket NAME                Bucket to probe. Required unless env/secret-pack supplies it.");
  console.log("  --endpoint URL               S3 endpoint. Default/env/secret-pack.");
  console.log("  --region REGION              S3 region. Default/env/secret-pack.");
  console.log("  --access-key-id VALUE        Access key. Prefer env or local secret-pack.");
  console.log("  --secret-access-key VALUE    Secret key. Prefer env or local secret-pack.");
  console.log("  --prefix PREFIX              Test object prefix. Default: media/__crud-smoke.");
  console.log("  --keep-object                Do not delete the test object after a successful put.");
  console.log("  --json                       Print machine-readable JSON.");
}

function cleanValue(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/^`|`$/g, "")
    .trim();

  return /^<.*>$/.test(cleaned) ? "" : cleaned;
}

function readField(block, label) {
  const pattern = new RegExp(`^-\\s*${label}:\\s*(.+)$`, "im");
  return cleanValue(block.match(pattern)?.[1] ?? "");
}

function loadSecretPack(filePath, purpose) {
  const resolvedPath = path.resolve(filePath);
  const text = fs.readFileSync(resolvedPath, "utf8");
  const heading = new RegExp(`^###\\s+${purpose}\\s+bucket\\s+credentials\\s*$`, "im");
  const match = heading.exec(text);

  if (!match) {
    throw new Error(`Could not find "${purpose} bucket credentials" block in ${filePath}.`);
  }

  const rest = text.slice(match.index + match[0].length);
  const nextHeading = rest.search(/^###\s+/m);
  const block = nextHeading === -1 ? rest : rest.slice(0, nextHeading);

  return {
    bucket: readField(block, "Bucket name"),
    endpoint: readField(block, "Endpoint"),
    accessKeyId: readField(block, "Access key"),
    secretAccessKey: readField(block, "Secret key")
  };
}

function resolveConfig(options) {
  const secretPack = options.fromLocalSecrets
    ? loadSecretPack(options.fromLocalSecrets, options.purpose || "media")
    : {};

  const bucket = options.bucket
    || process.env.MEDIA_S3_BUCKET
    || secretPack.bucket
    || "";
  const endpoint = options.endpoint
    || process.env.MEDIA_S3_ENDPOINT_URL
    || secretPack.endpoint
    || DEFAULT_ENDPOINT;
  const region = options.region
    || process.env.MEDIA_S3_REGION
    || DEFAULT_REGION;
  const accessKeyId = options.accessKeyId
    || process.env.MEDIA_S3_ACCESS_KEY_ID
    || secretPack.accessKeyId
    || "";
  const secretAccessKey = options.secretAccessKey
    || process.env.MEDIA_S3_SECRET_ACCESS_KEY
    || secretPack.secretAccessKey
    || "";

  const missing = [];

  if (!bucket) missing.push("bucket");
  if (!endpoint) missing.push("endpoint");
  if (!region) missing.push("region");
  if (!accessKeyId) missing.push("access key id");
  if (!secretAccessKey) missing.push("secret access key");

  if (missing.length > 0) {
    throw new Error(`Missing required S3 values: ${missing.join(", ")}.`);
  }

  return {
    bucket,
    endpoint,
    region,
    accessKeyId,
    secretAccessKey,
    prefix: cleanValue(options.prefix) || DEFAULT_PREFIX
  };
}

function fingerprint(value) {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function formatError(error) {
  return {
    ok: false,
    errorName: error?.name || "Error",
    message: error?.message || String(error),
    httpStatusCode: error?.$metadata?.httpStatusCode ?? null,
    requestId: error?.$metadata?.requestId ?? null
  };
}

async function bodyToBuffer(body) {
  if (!body) {
    return Buffer.alloc(0);
  }

  if (Buffer.isBuffer(body)) {
    return body;
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }

  if (typeof body.transformToByteArray === "function") {
    return Buffer.from(await body.transformToByteArray());
  }

  const chunks = [];

  for await (const chunk of body) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function step(name, fn) {
  try {
    const value = await fn();
    return {
      name,
      ok: true,
      ...value
    };
  } catch (error) {
    return {
      name,
      ...formatError(error)
    };
  }
}

function printHuman(result) {
  console.log(`bucket: ${result.bucket}`);
  console.log(`endpoint: ${result.endpoint}`);
  console.log(`region: ${result.region}`);
  console.log(`accessKeyFingerprint: ${result.accessKeyFingerprint}`);
  console.log(`objectKey: ${result.objectKey}`);
  console.log("");

  for (const item of result.steps) {
    if (item.ok) {
      console.log(`ok   ${item.name}${item.detail ? `: ${item.detail}` : ""}`);
    } else {
      console.log(`fail ${item.name}: ${item.errorName || "Error"} ${item.httpStatusCode || ""} ${item.message || ""}`.trim());
    }
  }

  console.log("");
  console.log(`overall: ${result.ok ? "ok" : "failed"}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const config = resolveConfig(options);
  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });
  const objectKey = `${config.prefix.replace(/\/+$/, "")}/${Date.now()}-${crypto.randomUUID()}.txt`;
  const expectedBody = `selectel media bucket crud smoke ${new Date().toISOString()}\n`;
  const steps = [];

  steps.push(await step("headBucket", async () => {
    await client.send(new HeadBucketCommand({ Bucket: config.bucket }));
    return {};
  }));

  const putResult = await step("putObject", async () => {
    await client.send(new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
      Body: expectedBody,
      ContentType: "text/plain; charset=utf-8"
    }));
    return { detail: `${Buffer.byteLength(expectedBody)} bytes` };
  });
  steps.push(putResult);

  if (putResult.ok) {
    steps.push(await step("headObject", async () => {
      const response = await client.send(new HeadObjectCommand({
        Bucket: config.bucket,
        Key: objectKey
      }));
      return { detail: `contentLength=${response.ContentLength ?? "unknown"}` };
    }));

    steps.push(await step("getObject", async () => {
      const response = await client.send(new GetObjectCommand({
        Bucket: config.bucket,
        Key: objectKey
      }));
      const body = (await bodyToBuffer(response.Body)).toString("utf8");

      if (body !== expectedBody) {
        throw new Error("Downloaded body does not match uploaded body.");
      }

      return { detail: "body matched" };
    }));
  }

  steps.push(await step("listPrefix", async () => {
    const response = await client.send(new ListObjectsV2Command({
      Bucket: config.bucket,
      Prefix: objectKey,
      MaxKeys: 10
    }));
    const found = (response.Contents ?? []).some((item) => item.Key === objectKey);

    if (putResult.ok && !found) {
      throw new Error("Uploaded object was not present in prefix listing.");
    }

    return { detail: `keyCount=${response.KeyCount ?? 0}` };
  }));

  if (putResult.ok && !options.keepObject) {
    steps.push(await step("deleteObject", async () => {
      await client.send(new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: objectKey
      }));
      return {};
    }));

    steps.push(await step("headObjectAfterDelete", async () => {
      try {
        await client.send(new HeadObjectCommand({
          Bucket: config.bucket,
          Key: objectKey
        }));
      } catch (error) {
        const statusCode = error?.$metadata?.httpStatusCode;
        const errorCode = error?.name || error?.Code;

        if (statusCode === 404 || errorCode === "NotFound" || errorCode === "NoSuchKey") {
          return { detail: "not found after delete" };
        }

        throw error;
      }

      throw new Error("Object still exists after delete.");
    }));
  }

  const result = {
    ok: steps.every((item) => item.ok),
    bucket: config.bucket,
    endpoint: config.endpoint,
    region: config.region,
    accessKeyFingerprint: fingerprint(config.accessKeyId),
    objectKey,
    keptObject: Boolean(options.keepObject && putResult.ok),
    steps
  };

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHuman(result);
  }

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error?.message || String(error));
  process.exitCode = 1;
});
