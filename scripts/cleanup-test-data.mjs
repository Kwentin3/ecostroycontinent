// Internal-only maintenance tool for proof/demo content cleanup.
// Future operators/agents should prefer the runtime wrapper
// `scripts/cleanup-test-data-runtime.sh` on the VM so the script runs
// against the canonical server env and DB network rather than the IDE host.
// When removing one specific smoke/demo entity, prefer
// `--entity-id ... --exact-entity-ids` so default proof matchers do not widen
// the target set unexpectedly.
import {
  collectMediaStorageKeys,
  createCleanupMatchers,
  findEntityCleanupSignals,
  findExternalReferences,
  formatCandidateLabel,
  matchesCleanupCandidate
} from "../lib/internal/test-data-cleanup.js";
import { validateCleanupSchemaContract } from "../lib/internal/test-data-cleanup-schema-contract.js";

function loadLocalEnvFileIfPresent() {
  if (typeof process.loadEnvFile !== "function") {
    return;
  }

  try {
    process.loadEnvFile();
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

loadLocalEnvFileIfPresent();

const ALLOWED_ENTITY_TYPES = new Set(["media_asset", "gallery", "service", "case", "page"]);

function parseArgs(argv) {
  const options = {
    confirm: false,
    json: false,
    skipStorage: false,
    allowReferenced: false,
    exactEntityIdsOnly: false,
    entityTypes: new Set(),
    patterns: [],
    entityIds: new Set()
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--confirm") {
      options.confirm = true;
      continue;
    }

    if (value === "--dry-run") {
      options.confirm = false;
      continue;
    }

    if (value === "--json") {
      options.json = true;
      continue;
    }

    if (value === "--skip-storage") {
      options.skipStorage = true;
      continue;
    }

    if (value === "--allow-referenced") {
      options.allowReferenced = true;
      continue;
    }

    if (value === "--exact-entity-ids") {
      options.exactEntityIdsOnly = true;
      continue;
    }

    if (value === "--entity-type") {
      const entityType = argv[index + 1];

      if (!entityType || !ALLOWED_ENTITY_TYPES.has(entityType)) {
        throw new Error(`--entity-type requires one of: ${[...ALLOWED_ENTITY_TYPES].join(", ")}`);
      }

      options.entityTypes.add(entityType);
      index += 1;
      continue;
    }

    if (value === "--pattern") {
      const pattern = argv[index + 1]?.trim();

      if (!pattern) {
        throw new Error("--pattern requires a non-empty value.");
      }

      options.patterns.push(pattern);
      index += 1;
      continue;
    }

    if (value === "--entity-id") {
      const entityId = argv[index + 1]?.trim();

      if (!entityId) {
        throw new Error("--entity-id requires a non-empty value.");
      }

      options.entityIds.add(entityId);
      index += 1;
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
  console.log("Usage: node scripts/cleanup-test-data.mjs [options]");
  console.log("");
  console.log("Internal-only cleanup for proof/demo content entities.");
  console.log("");
  console.log("Options:");
  console.log("  --confirm           Apply deletion. Without this flag the script runs in dry-run mode.");
  console.log("  --dry-run           Explicitly stay in dry-run mode (this is the default).");
  console.log("  --entity-type TYPE  Limit to one entity type. Repeatable.");
  console.log("  --pattern REGEX     Add an extra cleanup-matching regex. Repeatable.");
  console.log("  --entity-id ID      Force-include a specific entity id. Repeatable.");
  console.log("  --exact-entity-ids  Limit cleanup strictly to the entity ids passed via --entity-id.");
  console.log("  --allow-referenced  Delete even if non-candidate entities still reference the candidate ids.");
  console.log("  --skip-storage      Skip media binary deletion after DB cleanup.");
  console.log("  --json              Print JSON summary instead of human-readable output.");
}

async function loadEntityAggregates(entityTypes) {
  const { getDbPool } = await import("../lib/db/client.js");
  const params = [];
  let whereClause = "WHERE e.entity_type <> 'global_settings'";

  if (entityTypes.size > 0) {
    params.push([...entityTypes]);
    whereClause += ` AND e.entity_type = ANY($${params.length}::text[])`;
  }

  const result = await getDbPool().query(
    `SELECT
       e.id AS entity_id,
       e.entity_type,
       e.active_published_revision_id,
       e.created_at AS entity_created_at,
       e.updated_at AS entity_updated_at,
       r.id AS revision_id,
       r.revision_number,
       r.state,
       r.payload,
       r.change_intent,
       r.review_comment,
       r.created_at AS revision_created_at,
       r.updated_at AS revision_updated_at
     FROM content_entities e
     JOIN content_revisions r ON r.entity_id = e.id
     ${whereClause}
     ORDER BY e.entity_type ASC, e.id ASC, r.revision_number DESC`,
    params
  );

  const aggregates = new Map();

  for (const row of result.rows) {
    if (!aggregates.has(row.entity_id)) {
      aggregates.set(row.entity_id, {
        entity: {
          id: row.entity_id,
          entityType: row.entity_type,
          activePublishedRevisionId: row.active_published_revision_id,
          createdAt: row.entity_created_at,
          updatedAt: row.entity_updated_at
        },
        revisions: []
      });
    }

    aggregates.get(row.entity_id).revisions.push({
      id: row.revision_id,
      revisionNumber: row.revision_number,
      state: row.state,
      payload: row.payload,
      changeIntent: row.change_intent,
      reviewComment: row.review_comment,
      createdAt: row.revision_created_at,
      updatedAt: row.revision_updated_at
    });
  }

  return [...aggregates.values()];
}

async function assertCleanupSchemaContract() {
  const { getDbPool } = await import("../lib/db/client.js");
  const tables = ["content_entities", "content_revisions", "publish_obligations", "audit_events"];
  const pool = getDbPool();
  const migrationTableResult = await pool.query("SELECT to_regclass('public.schema_migrations') AS table_name");
  let migrationIds = [];

  if (migrationTableResult.rows[0]?.table_name) {
    const migrationsResult = await pool.query("SELECT id FROM schema_migrations");
    migrationIds = migrationsResult.rows.map((row) => row.id);
  }

  const [columnsResult, foreignKeysResult] = await Promise.all([
    pool.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = ANY($1::text[])`,
      [tables]
    ),
    pool.query(
      `SELECT
         tc.table_name,
         kcu.column_name,
         ccu.table_name AS foreign_table_name,
         ccu.column_name AS foreign_column_name,
         rc.delete_rule
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
       JOIN information_schema.constraint_column_usage ccu
         ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
       JOIN information_schema.referential_constraints rc
         ON tc.constraint_name = rc.constraint_name
        AND tc.table_schema = rc.constraint_schema
       WHERE tc.constraint_type = 'FOREIGN KEY'
         AND tc.table_schema = 'public'
         AND tc.table_name = ANY($1::text[])`,
      [tables]
    )
  ]);

  const columnsByTable = {};

  for (const row of columnsResult.rows) {
    if (!columnsByTable[row.table_name]) {
      columnsByTable[row.table_name] = [];
    }

    columnsByTable[row.table_name].push(row.column_name);
  }

  const foreignKeys = foreignKeysResult.rows.map((row) => ({
    table: row.table_name,
    column: row.column_name,
    foreignTable: row.foreign_table_name,
    foreignColumn: row.foreign_column_name,
    deleteRule: row.delete_rule
  }));
  const problems = validateCleanupSchemaContract({
    columnsByTable,
    foreignKeys,
    migrationIds
  });

  if (problems.length > 0) {
    throw new Error(
      `Cleanup schema contract drift detected. Update the tool before running it against this database.\n- ${problems.join("\n- ")}`
    );
  }
}

function buildSummary(candidates, signalsByEntity, references, options) {
  const countsByType = {};

  for (const candidate of candidates) {
    countsByType[candidate.entity.entityType] = (countsByType[candidate.entity.entityType] ?? 0) + 1;
  }

  return {
    confirm: options.confirm,
    skipStorage: options.skipStorage,
    allowReferenced: options.allowReferenced,
    exactEntityIdsOnly: options.exactEntityIdsOnly,
    patterns: options.patterns,
    entityTypes: [...options.entityTypes],
    entityIds: [...options.entityIds],
    candidateCount: candidates.length,
    countsByType,
    candidates: candidates.map((candidate) => ({
      entityId: candidate.entity.id,
      entityType: candidate.entity.entityType,
      label: formatCandidateLabel(candidate),
      revisionCount: candidate.revisions.length,
      signals: signalsByEntity.get(candidate.entity.id) ?? [],
      storageKeys: collectMediaStorageKeys(candidate)
    })),
    blockingReferences: references
  };
}

function printHumanSummary(summary) {
  console.log(`Mode: ${summary.confirm ? "apply" : "dry-run"}`);
  console.log(`Candidates: ${summary.candidateCount}`);

  if (summary.candidateCount === 0) {
    console.log("No matching proof/demo entities were found.");
    return;
  }

  for (const [entityType, count] of Object.entries(summary.countsByType)) {
    console.log(`- ${entityType}: ${count}`);
  }

  console.log("");

  for (const candidate of summary.candidates) {
    console.log(`[${candidate.entityType}] ${candidate.label} (${candidate.entityId})`);

    if (candidate.storageKeys.length > 0) {
      console.log(`  storage: ${candidate.storageKeys.join(", ")}`);
    }

    const shortSignals = candidate.signals.slice(0, 3).map((signal) => `${signal.source}="${signal.value}"`);

    if (shortSignals.length > 0) {
      console.log(`  matched by: ${shortSignals.join(" | ")}`);
    }
  }

  if (summary.blockingReferences.length > 0) {
    console.log("");
    console.log("Blocking references from non-candidate entities:");

    for (const reference of summary.blockingReferences) {
      console.log(
        `  ${reference.sourceEntityType} ${reference.sourceEntityId} -> ${reference.referencedEntityId}`
      );
    }
  }

  if (!summary.confirm) {
    console.log("");
    console.log("Dry run only. Re-run with --confirm to delete the matched entities.");
  }
}

async function applyCleanup(candidates, options) {
  const { withTransaction } = await import("../lib/db/client.js");
  const { deleteMediaFile } = await import("../lib/media/storage.js");
  const entityIds = candidates.map((candidate) => candidate.entity.id);
  const storageKeys = [...new Set(candidates.flatMap((candidate) => collectMediaStorageKeys(candidate)))];

  const deletedRows = await withTransaction(async (tx) => {
    const result = await tx.query(
      `DELETE FROM content_entities
       WHERE id = ANY($1::text[])
       RETURNING id, entity_type`,
      [entityIds]
    );

    return result.rows;
  });

  const storageResults = [];

  if (!options.skipStorage) {
    for (const storageKey of storageKeys) {
      try {
        await deleteMediaFile(storageKey);
        storageResults.push({ storageKey, status: "deleted" });
      } catch (error) {
        storageResults.push({ storageKey, status: "error", message: error.message });
      }
    }
  }

  return {
    deletedRows,
    storageResults
  };
}

async function main() {
  const { assertDatabaseConfigured, getAppConfig } = await import("../lib/config.js");
  assertDatabaseConfigured();
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  if (options.exactEntityIdsOnly && options.entityIds.size === 0) {
    throw new Error("--exact-entity-ids requires at least one --entity-id.");
  }

  const config = getAppConfig();
  await assertCleanupSchemaContract();
  const matchers = createCleanupMatchers(options.patterns);
  const aggregates = await loadEntityAggregates(options.entityTypes);
  const candidates = [];
  const signalsByEntity = new Map();

  for (const aggregate of aggregates) {
    if (options.exactEntityIdsOnly) {
      if (options.entityIds.has(aggregate.entity.id)) {
        signalsByEntity.set(aggregate.entity.id, []);
        candidates.push(aggregate);
      }

      continue;
    }

    const signals = findEntityCleanupSignals(aggregate, matchers);

    if (signals.length > 0 || options.entityIds.has(aggregate.entity.id)) {
      signalsByEntity.set(aggregate.entity.id, signals);
    }

    if (matchesCleanupCandidate(aggregate, matchers, options.entityIds)) {
      candidates.push(aggregate);
    }
  }

  const candidateIds = candidates.map((candidate) => candidate.entity.id);
  const nonCandidates = aggregates.filter((aggregate) => !candidateIds.includes(aggregate.entity.id));
  const blockingReferences = findExternalReferences(nonCandidates, candidateIds);
  const summary = buildSummary(candidates, signalsByEntity, blockingReferences, options);

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    printHumanSummary(summary);
  }

  if (blockingReferences.length > 0 && !options.allowReferenced) {
    throw new Error("Cleanup aborted because non-candidate entities still reference the matched entity ids. Re-run with --allow-referenced only if this is expected.");
  }

  if (!options.confirm || candidates.length === 0) {
    return;
  }

  const result = await applyCleanup(candidates, options);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log("");
  console.log(`Deleted entities: ${result.deletedRows.length}`);

  if (!options.skipStorage) {
    const deleted = result.storageResults.filter((item) => item.status === "deleted").length;
    const failed = result.storageResults.filter((item) => item.status === "error");

    console.log(`Storage objects deleted: ${deleted}`);

    if (failed.length > 0) {
      console.log("Storage cleanup errors:");

      for (const item of failed) {
        console.log(`  ${item.storageKey}: ${item.message}`);
      }
    }
  }

  console.log(`Database target: ${config.databaseUrl ? "configured" : "missing"}`);
}

main().catch((error) => {
  if (error?.code === "ECONNREFUSED") {
    console.error("Cannot reach the configured database. Start the target runtime DB first or run this script inside the server/runtime container.");
  } else {
    console.error(error.message);
  }
  process.exitCode = 1;
});
