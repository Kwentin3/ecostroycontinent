ALTER TABLE content_entities
  DROP CONSTRAINT IF EXISTS content_entities_entity_type_check;

ALTER TABLE content_entities
  ADD CONSTRAINT content_entities_entity_type_check
  CHECK (
    entity_type IN (
      'global_settings',
      'media_asset',
      'gallery',
      'service',
      'equipment',
      'case',
      'page'
    )
  );
