import { query } from "../db/client";
import { createId } from "../utils/id";

function queryWithDb(db, text, params = []) {
  if (db) {
    return db.query(text, params);
  }

  return query(text, params);
}

function mapEntityRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    entityType: row.entity_type,
    locale: row.locale,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    activePublishedRevisionId: row.active_published_revision_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapRevisionRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    entityId: row.entity_id,
    revisionNumber: row.revision_number,
    state: row.state,
    payload: row.payload,
    changeClass: row.change_class,
    changeIntent: row.change_intent,
    ownerReviewRequired: row.owner_review_required,
    ownerApprovalStatus: row.owner_approval_status,
    ownerApprovedBy: row.owner_approved_by,
    ownerApprovedAt: row.owner_approved_at,
    reviewComment: row.review_comment,
    previewStatus: row.preview_status,
    previewFailureReason: row.preview_failure_reason,
    aiInvolvement: row.ai_involvement,
    aiSourceBasis: row.ai_source_basis,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    submittedAt: row.submitted_at,
    publishedAt: row.published_at,
    publishedBy: row.published_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function findEntityById(entityId, db = null) {
  const result = await queryWithDb(db, "SELECT * FROM content_entities WHERE id = $1", [entityId]);
  return mapEntityRow(result.rows[0]);
}

export async function findEntityByTypeSingleton(entityType, db = null) {
  const result = await queryWithDb(db, "SELECT * FROM content_entities WHERE entity_type = $1", [entityType]);
  return mapEntityRow(result.rows[0]);
}

export async function createEntity(entityType, userId, db = null) {
  const entityId = createId("entity");
  const result = await queryWithDb(
    db,
    `INSERT INTO content_entities (id, entity_type, created_by, updated_by)
     VALUES ($1, $2, $3, $3)
     RETURNING *`,
    [entityId, entityType, userId]
  );

  return mapEntityRow(result.rows[0]);
}

export async function updateEntityTimestamps(entityId, userId, activePublishedRevisionId = null, db = null) {
  const result = await queryWithDb(
    db,
    `UPDATE content_entities
     SET updated_by = $2,
         updated_at = NOW(),
         active_published_revision_id = COALESCE($3, active_published_revision_id)
     WHERE id = $1
     RETURNING *`,
    [entityId, userId, activePublishedRevisionId]
  );

  return mapEntityRow(result.rows[0]);
}

export async function findLatestRevision(entityId, db = null) {
  const result = await queryWithDb(
    db,
    "SELECT * FROM content_revisions WHERE entity_id = $1 ORDER BY revision_number DESC LIMIT 1",
    [entityId]
  );

  return mapRevisionRow(result.rows[0]);
}

export async function findDraftRevision(entityId, db = null) {
  const result = await queryWithDb(
    db,
    "SELECT * FROM content_revisions WHERE entity_id = $1 AND state = 'draft' ORDER BY revision_number DESC LIMIT 1",
    [entityId]
  );

  return mapRevisionRow(result.rows[0]);
}

export async function findRevisionById(revisionId, db = null) {
  const result = await queryWithDb(db, "SELECT * FROM content_revisions WHERE id = $1", [revisionId]);
  return mapRevisionRow(result.rows[0]);
}

export async function findActivePublishedRevision(entityId, db = null) {
  const result = await queryWithDb(
    db,
    `SELECT r.*
     FROM content_entities e
     JOIN content_revisions r ON r.id = e.active_published_revision_id
     WHERE e.id = $1`,
    [entityId]
  );

  return mapRevisionRow(result.rows[0]);
}

export async function listRevisionsForEntity(entityId, db = null) {
  const result = await queryWithDb(
    db,
    "SELECT * FROM content_revisions WHERE entity_id = $1 ORDER BY revision_number DESC",
    [entityId]
  );

  return result.rows.map(mapRevisionRow);
}

export async function createRevision(input, db = null) {
  const revisionId = createId("rev");
  const result = await queryWithDb(
    db,
    `INSERT INTO content_revisions (
      id, entity_id, revision_number, state, payload, change_class, change_intent,
      owner_review_required, owner_approval_status, preview_status, preview_failure_reason,
      ai_involvement, ai_source_basis, created_by, updated_by, submitted_at, published_at, published_by, review_comment
    )
    VALUES (
      $1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11,
      $12, $13, $14, $14, $15, $16, $17, $18
    )
    RETURNING *`,
    [
      revisionId,
      input.entityId,
      input.revisionNumber,
      input.state,
      JSON.stringify(input.payload),
      input.changeClass,
      input.changeIntent,
      input.ownerReviewRequired ?? false,
      input.ownerApprovalStatus ?? "not_required",
      input.previewStatus ?? "preview_renderable",
      input.previewFailureReason ?? null,
      input.aiInvolvement ?? false,
      input.aiSourceBasis ?? null,
      input.userId,
      input.submittedAt ?? null,
      input.publishedAt ?? null,
      input.publishedBy ?? null,
      input.reviewComment ?? null
    ]
  );

  return mapRevisionRow(result.rows[0]);
}

export async function updateRevision(revisionId, input, db = null) {
  const current = await findRevisionById(revisionId, db);
  const result = await queryWithDb(
    db,
    `UPDATE content_revisions
     SET payload = $2::jsonb,
         change_class = $3,
         change_intent = $4,
         owner_review_required = $5,
         owner_approval_status = $6,
         owner_approved_by = $7,
         owner_approved_at = $8,
         review_comment = $9,
         preview_status = $10,
         preview_failure_reason = $11,
         ai_involvement = $12,
         ai_source_basis = $13,
         updated_by = $14,
         updated_at = NOW(),
         submitted_at = $15,
         published_at = $16,
         published_by = $17,
         state = $18
     WHERE id = $1
     RETURNING *`,
    [
      revisionId,
      JSON.stringify(input.payload ?? current.payload),
      input.changeClass ?? current.changeClass,
      input.changeIntent ?? current.changeIntent,
      input.ownerReviewRequired ?? current.ownerReviewRequired,
      input.ownerApprovalStatus ?? current.ownerApprovalStatus,
      input.ownerApprovedBy ?? current.ownerApprovedBy,
      input.ownerApprovedAt ?? current.ownerApprovedAt,
      input.reviewComment ?? current.reviewComment,
      input.previewStatus ?? current.previewStatus,
      input.previewFailureReason ?? current.previewFailureReason,
      input.aiInvolvement ?? current.aiInvolvement,
      input.aiSourceBasis ?? current.aiSourceBasis,
      input.userId ?? current.updatedBy,
      input.submittedAt ?? current.submittedAt,
      input.publishedAt ?? current.publishedAt,
      input.publishedBy ?? current.publishedBy,
      input.state ?? current.state
    ]
  );

  return mapRevisionRow(result.rows[0]);
}

export async function listEntitiesWithLatestRevision(entityType, db = null) {
  const result = await queryWithDb(
    db,
    `SELECT
       e.*,
       r.id AS revision_id,
       r.revision_number,
       r.state,
       r.payload,
       r.owner_review_required,
       r.owner_approval_status,
       r.preview_status,
       r.updated_at AS revision_updated_at
     FROM content_entities e
     LEFT JOIN LATERAL (
       SELECT *
       FROM content_revisions
       WHERE entity_id = e.id
       ORDER BY revision_number DESC
       LIMIT 1
     ) r ON TRUE
     WHERE e.entity_type = $1
     ORDER BY e.updated_at DESC`,
    [entityType]
  );

  return result.rows.map((row) => ({
    entity: mapEntityRow(row),
    latestRevision: row.revision_id
      ? {
          id: row.revision_id,
          revisionNumber: row.revision_number,
          state: row.state,
          payload: row.payload,
          ownerReviewRequired: row.owner_review_required,
          ownerApprovalStatus: row.owner_approval_status,
          previewStatus: row.preview_status,
          updatedAt: row.revision_updated_at
        }
      : null
  }));
}

export async function getEntityAggregate(entityId, db = null) {
  const entity = await findEntityById(entityId, db);

  if (!entity) {
    return null;
  }

  const revisions = await listRevisionsForEntity(entityId, db);
  const activePublishedRevision = entity.activePublishedRevisionId
    ? revisions.find((revision) => revision.id === entity.activePublishedRevisionId) ?? await findActivePublishedRevision(entityId, db)
    : null;

  return {
    entity,
    revisions,
    activePublishedRevision
  };
}

export async function listPublishedEntities(entityType, db = null) {
  const result = await queryWithDb(
    db,
    `SELECT e.id AS entity_id, e.entity_type, r.*
     FROM content_entities e
     JOIN content_revisions r ON r.id = e.active_published_revision_id
     WHERE e.entity_type = $1
     ORDER BY r.published_at DESC NULLS LAST, r.updated_at DESC`,
    [entityType]
  );

  return result.rows.map((row) => ({
    entityId: row.entity_id,
    entityType: row.entity_type,
    revision: mapRevisionRow(row)
  }));
}

export async function findPublishedBySlug(entityType, slug, db = null) {
  const result = await queryWithDb(
    db,
    `SELECT e.id AS entity_id, r.*
     FROM content_entities e
     JOIN content_revisions r ON r.id = e.active_published_revision_id
     WHERE e.entity_type = $1
       AND r.payload ->> 'slug' = $2
     LIMIT 1`,
    [entityType, slug]
  );

  if (!result.rows[0]) {
    return null;
  }

  return {
    entityId: result.rows[0].entity_id,
    revision: mapRevisionRow(result.rows[0])
  };
}

export async function findPublishedPageByPageType(pageType, db = null) {
  const result = await queryWithDb(
    db,
    `SELECT e.id AS entity_id, r.*
     FROM content_entities e
     JOIN content_revisions r ON r.id = e.active_published_revision_id
     WHERE e.entity_type = 'page'
       AND r.payload ->> 'pageType' = $1
     LIMIT 1`,
    [pageType]
  );

  if (!result.rows[0]) {
    return null;
  }

  return {
    entityId: result.rows[0].entity_id,
    revision: mapRevisionRow(result.rows[0])
  };
}

export async function findPublishedPageTypeCollision(pageType, excludedEntityId, db = null) {
  const result = await queryWithDb(
    db,
    `SELECT e.id
     FROM content_entities e
     JOIN content_revisions r ON r.id = e.active_published_revision_id
     WHERE e.entity_type = 'page'
       AND r.payload ->> 'pageType' = $1
       AND e.id <> $2
     LIMIT 1`,
    [pageType, excludedEntityId]
  );

  return result.rows[0]?.id ?? null;
}

export async function findEntityByPublishedSlugCollision(entityType, slug, excludedEntityId, db = null) {
  const result = await queryWithDb(
    db,
    `SELECT e.id
     FROM content_entities e
     JOIN content_revisions r ON r.id = e.active_published_revision_id
     WHERE e.entity_type = $1
       AND r.payload ->> 'slug' = $2
       AND e.id <> $3
     LIMIT 1`,
    [entityType, slug, excludedEntityId]
  );

  return result.rows[0]?.id ?? null;
}

export async function insertAuditEvent(input, db = null) {
  await queryWithDb(
    db,
    `INSERT INTO audit_events (id, entity_id, revision_id, actor_user_id, event_key, summary, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      createId("audit"),
      input.entityId ?? null,
      input.revisionId ?? null,
      input.actorUserId ?? null,
      input.eventKey,
      input.summary,
      JSON.stringify(input.details ?? {})
    ]
  );
}

export async function listAuditEventsForEntity(entityId, db = null) {
  const result = await queryWithDb(
    db,
    "SELECT * FROM audit_events WHERE entity_id = $1 ORDER BY created_at DESC",
    [entityId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    entityId: row.entity_id,
    revisionId: row.revision_id,
    actorUserId: row.actor_user_id,
    eventKey: row.event_key,
    summary: row.summary,
    details: row.details,
    createdAt: row.created_at
  }));
}

export async function listReviewQueue() {
  const result = await query(
    `SELECT e.entity_type, e.id AS entity_id, r.*
     FROM content_entities e
     JOIN content_revisions r ON r.entity_id = e.id
     WHERE r.state = 'review'
     ORDER BY r.submitted_at ASC NULLS LAST, r.updated_at ASC`
  );

  return result.rows.map((row) => ({
    entityId: row.entity_id,
    entityType: row.entity_type,
    revision: mapRevisionRow(row)
  }));
}

export async function insertPublishObligation(input, db = null) {
  await queryWithDb(
    db,
    `INSERT INTO publish_obligations (id, entity_id, revision_id, obligation_type, status, payload)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [
      createId("obligation"),
      input.entityId,
      input.revisionId,
      input.obligationType,
      input.status ?? "open",
      JSON.stringify(input.payload ?? {})
    ]
  );
}

export async function listPublishObligations(entityId, db = null) {
  const result = await queryWithDb(
    db,
    "SELECT * FROM publish_obligations WHERE entity_id = $1 ORDER BY created_at DESC",
    [entityId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    entityId: row.entity_id,
    revisionId: row.revision_id,
    obligationType: row.obligation_type,
    status: row.status,
    payload: row.payload,
    createdAt: row.created_at
  }));
}

export async function markPublishObligationCompleted(obligationId, db = null) {
  await queryWithDb(db, "UPDATE publish_obligations SET status = 'completed' WHERE id = $1", [obligationId]);
}

export async function listUsers(db = null) {
  const result = await queryWithDb(
    db,
    `SELECT u.id, u.username, u.display_name, u.role, u.active, u.created_at, u.updated_at,
            MAX(a.created_at) AS latest_activity_at
     FROM app_users u
     LEFT JOIN audit_events a ON a.actor_user_id = u.id
     GROUP BY u.id
     ORDER BY u.created_at ASC`
  );

  return result.rows;
}

export async function findUserByUsername(username, db = null) {
  const result = await queryWithDb(
    db,
    "SELECT id, username, display_name, role, active FROM app_users WHERE username = $1",
    [username]
  );

  return result.rows[0] ?? null;
}

export async function findUserById(userId, db = null) {
  const result = await queryWithDb(
    db,
    "SELECT id, username, display_name, role, active, created_at, updated_at FROM app_users WHERE id = $1",
    [userId]
  );

  return result.rows[0] ?? null;
}

export async function createUserRecord(input, db = null) {
  const result = await queryWithDb(
    db,
    `INSERT INTO app_users (id, username, display_name, role, password_hash, active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, username, display_name, role, active, created_at, updated_at`,
    [createId("user"), input.username, input.displayName, input.role, input.passwordHash, true]
  );

  return result.rows[0];
}

export async function updateUserActiveState(userId, active, db = null) {
  const result = await queryWithDb(
    db,
    `UPDATE app_users
     SET active = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, username, display_name, role, active, created_at, updated_at`,
    [userId, active]
  );

  return result.rows[0];
}

export async function updateUserRecord(userId, input, db = null) {
  const result = await queryWithDb(
    db,
    `UPDATE app_users
     SET username = $2,
         display_name = $3,
         role = $4,
         password_hash = COALESCE($5, password_hash),
         active = $6,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, username, display_name, role, active, created_at, updated_at`,
    [userId, input.username, input.displayName, input.role, input.passwordHash ?? null, input.active]
  );

  return result.rows[0] ?? null;
}

export async function deleteUserRecord(userId, db = null) {
  await queryWithDb(db, "DELETE FROM app_users WHERE id = $1", [userId]);
}
