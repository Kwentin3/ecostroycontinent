import fs from "node:fs/promises";
import path from "node:path";

import { EntityOpsAdminClient } from "../lib/entity-ops/client.js";
import { getEntityOpsConfig } from "../lib/entity-ops/config.js";
import { normalizeEntityOperations, parseEntityOpsDocument } from "../lib/entity-ops/input.js";
import {
  readEntityOpsInputFile,
  resolveEntityOpsOutputFormat,
  serializeEntityOpsReport,
  writeUtf8
} from "../lib/entity-ops/io.js";
import { runEntityOperations } from "../lib/entity-ops/runner.js";

function printHelp() {
  writeUtf8(process.stdout, `Usage:
  node --env-file=.env scripts/entity-ops.mjs --input <file> [--kind <kind>] [--entity-type <type>] [--mode <mode>] [--execute]

Options:
  --input <file>           JSON or JSONL batch file
  --kind <kind>            Default kind: entity | media | display_mode | removal
  --entity-type <type>     Default entity type for entries without entityType
  --mode <mode>            Default mode for the selected kind
  --base-url <url>         Override APP_BASE_URL / ENTITY_OPS_BASE_URL
  --username <name>        Override ENTITY_OPS_USERNAME
  --password <value>       Override ENTITY_OPS_PASSWORD
  --change-intent <text>   Default changeIntent for every item
  --creation-origin <val>  Default creationOrigin for every item
  --format <kind>          Output format: text | json
  --json                   Shorthand for --format json
  --report <file>          Write JSON report to file
  --execute                Apply changes; without this flag the script runs in dry-run mode
  --help                   Show this help
`);
}

function parseArgs(argv) {
  const options = {
    execute: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--execute") {
      options.execute = true;
      continue;
    }

    if (arg === "--help") {
      options.help = true;
      continue;
    }

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const key = arg.slice(2);
    const nextValue = argv[index + 1];

    if (!nextValue || nextValue.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }

    options[key.replace(/-([a-z])/g, (_, char) => char.toUpperCase())] = nextValue;
    index += 1;
  }

  return options;
}

async function writeReport(reportPath, report) {
  const resolved = path.resolve(reportPath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeUtf8(process.stdout, `Report written to ${resolved}\n`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (!args.input) {
    throw new Error("--input is required.");
  }

  const inputPath = path.resolve(args.input);
  const inputText = await readEntityOpsInputFile(inputPath);
  const document = parseEntityOpsDocument(inputText, inputPath);
  const operations = normalizeEntityOperations(document, {
    defaultKind: args.kind,
    defaultEntityType: args.entityType,
    defaultMode: args.mode,
    defaultChangeIntent: args.changeIntent,
    defaultCreationOrigin: args.creationOrigin
  });
  const config = getEntityOpsConfig(process.env, {
    baseUrl: args.baseUrl,
    username: args.username,
    password: args.password
  });
  const client = new EntityOpsAdminClient(config);
  const report = await runEntityOperations(client, operations, {
    execute: args.execute
  });

  writeUtf8(process.stdout, serializeEntityOpsReport(report, {
    format: resolveEntityOpsOutputFormat(args)
  }));

  if (args.report) {
    await writeReport(args.report, report);
  }

  if (!report.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  writeUtf8(process.stderr, `${error?.message || error}\n`);
  process.exitCode = 1;
});
