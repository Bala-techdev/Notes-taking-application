ALTER TABLE notes
    ADD COLUMN favorite BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN pinned BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_notes_user_pinned_updated_at ON notes (user_id, pinned, updated_at DESC);
