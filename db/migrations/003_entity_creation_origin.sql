ALTER TABLE content_entities
  ADD COLUMN IF NOT EXISTS creation_origin TEXT;

ALTER TABLE content_entities
  DROP CONSTRAINT IF EXISTS content_entities_creation_origin_check;

ALTER TABLE content_entities
  ADD CONSTRAINT content_entities_creation_origin_check
  CHECK (
    creation_origin IS NULL
    OR creation_origin = 'agent_test'
  );
