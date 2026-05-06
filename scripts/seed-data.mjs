import crypto from "node:crypto";

import pg from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "";

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for seeding.");
}

const client = new pg.Client({
  connectionString: databaseUrl
});

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function upsertUser({ username, displayName, role, password }) {
  const existing = await client.query("SELECT id FROM app_users WHERE username = $1", [username]);

  if (existing.rows[0]) {
    await client.query(
      `UPDATE app_users
       SET display_name = $2, role = $3, password_hash = $4, active = TRUE, updated_at = NOW()
       WHERE username = $1`,
      [username, displayName, role, hashPassword(password)]
    );

    return existing.rows[0].id;
  }

  const id = createId("user");

  await client.query(
    `INSERT INTO app_users (id, username, display_name, role, password_hash)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, username, displayName, role, hashPassword(password)]
  );

  return id;
}

async function main() {
  await client.connect();

  const superadminId = await upsertUser({
    username: process.env.SEED_SUPERADMIN_USERNAME ?? "superadmin",
    displayName: "Системный суперадмин",
    role: "superadmin",
    password: process.env.SEED_SUPERADMIN_PASSWORD ?? "change-me-superadmin"
  });

  await upsertUser({
    username: process.env.SEED_SEO_USERNAME ?? "seo",
    displayName: "SEO Manager",
    role: "seo_manager",
    password: process.env.SEED_SEO_PASSWORD ?? "change-me-seo"
  });

  await upsertUser({
    username: process.env.SEED_OWNER_USERNAME ?? "owner",
    displayName: "Business Owner",
    role: "business_owner",
    password: process.env.SEED_OWNER_PASSWORD ?? "change-me-owner"
  });

  const settingsEntity = await client.query(
    "SELECT id, active_published_revision_id FROM content_entities WHERE entity_type = 'global_settings'"
  );

  let entityId = settingsEntity.rows[0]?.id;

  if (!entityId) {
    entityId = createId("entity");
    await client.query(
      `INSERT INTO content_entities (id, entity_type, created_by, updated_by)
       VALUES ($1, 'global_settings', $2, $2)`,
      [entityId, superadminId]
    );
  }

  const latestRevision = await client.query(
    "SELECT revision_number FROM content_revisions WHERE entity_id = $1 ORDER BY revision_number DESC LIMIT 1",
    [entityId]
  );

  if (!latestRevision.rows[0]) {
    const revisionId = createId("rev");

    await client.query(
      `INSERT INTO content_revisions (
        id, entity_id, revision_number, state, payload, change_class, change_intent,
        owner_review_required, owner_approval_status, created_by, updated_by, published_at, published_by
      )
      VALUES (
        $1, $2, 1, 'published', $3::jsonb, 'class_e_global_truth_change',
        'Initial global settings seed', TRUE, 'approved', $4, $4, NOW(), $4
      )`,
      [
        revisionId,
        entityId,
        JSON.stringify({
          publicBrandName: "Экостройконтинент",
          legalName: "ООО \"ЭКОСТРОЙКОНТИНЕНТ\"",
          primaryPhone: "+7 (900) 000-00-00",
          activeMessengers: ["telegram", "whatsapp"],
          publicEmail: "info@example.com",
          serviceArea: "Сочи и Большой Сочи",
          primaryRegion: "Сочи",
          defaultCtaLabel: "Связаться",
          defaultCtaDescription: "Обсудим задачу и подготовим следующий шаг.",
          organization: {
            city: "Сочи",
            country: "RU"
          },
          contactTruthConfirmed: false
        }),
        superadminId
      ]
    );

    await client.query(
      "UPDATE content_entities SET active_published_revision_id = $2, updated_by = $3, updated_at = NOW() WHERE id = $1",
      [entityId, revisionId, superadminId]
    );
  }

  console.log("Seed completed. Users: superadmin / seo / owner");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
