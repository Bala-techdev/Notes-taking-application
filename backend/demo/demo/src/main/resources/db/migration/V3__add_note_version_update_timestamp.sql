ALTER TABLE notes
    ADD COLUMN version_updated_at DATETIME NULL;

UPDATE notes
SET version_updated_at = COALESCE(
    NULLIF(updated_at, '0000-00-00 00:00:00'),
    NULLIF(created_at, '0000-00-00 00:00:00'),
    NOW()
)
WHERE version_updated_at IS NULL;

ALTER TABLE notes
    MODIFY COLUMN version_updated_at DATETIME NOT NULL;
