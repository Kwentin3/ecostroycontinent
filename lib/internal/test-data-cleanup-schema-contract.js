export const TEST_DATA_CLEANUP_SCHEMA_CONTRACT = {
  contractId: "test-data-cleanup-v1",
  requiredMigrationIds: ["001_admin_first_slice.sql"],
  requiredColumns: {
    content_entities: [
      "id",
      "entity_type",
      "active_published_revision_id",
      "created_at",
      "updated_at"
    ],
    content_revisions: [
      "id",
      "entity_id",
      "revision_number",
      "state",
      "payload",
      "change_intent",
      "review_comment",
      "created_at",
      "updated_at"
    ],
    publish_obligations: ["id", "entity_id", "revision_id"],
    audit_events: ["id", "entity_id", "revision_id"]
  },
  requiredForeignKeys: [
    {
      table: "content_revisions",
      column: "entity_id",
      foreignTable: "content_entities",
      foreignColumn: "id",
      deleteRule: "CASCADE"
    },
    {
      table: "content_entities",
      column: "active_published_revision_id",
      foreignTable: "content_revisions",
      foreignColumn: "id",
      deleteRule: "SET NULL"
    },
    {
      table: "publish_obligations",
      column: "entity_id",
      foreignTable: "content_entities",
      foreignColumn: "id",
      deleteRule: "CASCADE"
    },
    {
      table: "publish_obligations",
      column: "revision_id",
      foreignTable: "content_revisions",
      foreignColumn: "id",
      deleteRule: "CASCADE"
    },
    {
      table: "audit_events",
      column: "entity_id",
      foreignTable: "content_entities",
      foreignColumn: "id",
      deleteRule: "CASCADE"
    },
    {
      table: "audit_events",
      column: "revision_id",
      foreignTable: "content_revisions",
      foreignColumn: "id",
      deleteRule: "CASCADE"
    }
  ]
};

function formatForeignKey(contractItem) {
  return `${contractItem.table}.${contractItem.column} -> ${contractItem.foreignTable}.${contractItem.foreignColumn} ON DELETE ${contractItem.deleteRule}`;
}

export function validateCleanupSchemaContract(
  snapshot,
  contract = TEST_DATA_CLEANUP_SCHEMA_CONTRACT
) {
  const problems = [];
  const columnsByTable = snapshot.columnsByTable ?? {};
  const foreignKeys = snapshot.foreignKeys ?? [];
  const migrationIds = new Set(snapshot.migrationIds ?? []);

  for (const requiredMigrationId of contract.requiredMigrationIds) {
    if (!migrationIds.has(requiredMigrationId)) {
      problems.push(`missing required migration marker: ${requiredMigrationId}`);
    }
  }

  for (const [tableName, requiredColumns] of Object.entries(contract.requiredColumns)) {
    const availableColumns = new Set(columnsByTable[tableName] ?? []);

    if (availableColumns.size === 0) {
      problems.push(`missing required table: ${tableName}`);
      continue;
    }

    for (const columnName of requiredColumns) {
      if (!availableColumns.has(columnName)) {
        problems.push(`missing required column: ${tableName}.${columnName}`);
      }
    }
  }

  for (const requiredForeignKey of contract.requiredForeignKeys) {
    const matches = foreignKeys.some(
      (foreignKey) =>
        foreignKey.table === requiredForeignKey.table &&
        foreignKey.column === requiredForeignKey.column &&
        foreignKey.foreignTable === requiredForeignKey.foreignTable &&
        foreignKey.foreignColumn === requiredForeignKey.foreignColumn &&
        foreignKey.deleteRule === requiredForeignKey.deleteRule
    );

    if (!matches) {
      problems.push(`missing required foreign key: ${formatForeignKey(requiredForeignKey)}`);
    }
  }

  return problems;
}
