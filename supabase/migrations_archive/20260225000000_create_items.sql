-- Create items table based on PoE Wiki Cargo data
CREATE TABLE IF NOT EXISTS items (
    id                          UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Identity
    name                        TEXT NOT NULL,
    class                       TEXT,
    class_id                    TEXT,
    rarity                      TEXT,
    rarity_id                   TEXT,
    base_item                   TEXT,
    metadata_id                 TEXT UNIQUE,
    release_version             TEXT,
    removal_version             TEXT,

    -- Drop
    drop_enabled                BOOLEAN,
    drop_level                  INTEGER,
    drop_level_maximum          INTEGER,
    is_drop_restricted          BOOLEAN DEFAULT FALSE,
    drop_text                   TEXT,

    -- Requirements
    required_level              INTEGER,
    required_strength           INTEGER,
    required_dexterity          INTEGER,
    required_intelligence       INTEGER,

    -- Flags
    is_corrupted                BOOLEAN DEFAULT FALSE,
    is_replica                  BOOLEAN DEFAULT FALSE,
    is_fractured                BOOLEAN DEFAULT FALSE,
    is_synthesised              BOOLEAN DEFAULT FALSE,
    is_in_game                  BOOLEAN DEFAULT TRUE,
    is_account_bound            BOOLEAN DEFAULT FALSE,
    is_unmodifiable             BOOLEAN DEFAULT FALSE,
    is_veiled                   BOOLEAN DEFAULT FALSE,
    is_eater_of_worlds_item     BOOLEAN DEFAULT FALSE,
    is_searing_exarch_item      BOOLEAN DEFAULT FALSE,
    cannot_be_traded_or_modified BOOLEAN DEFAULT FALSE,

    -- Properties
    frame_type                  INTEGER,
    quality                     INTEGER,
    size_x                      INTEGER,
    size_y                      INTEGER,
    tags                        TEXT[],
    influences                  TEXT[],

    -- Text
    description                 TEXT,
    stat_text                   TEXT,
    explicit_stat_text          TEXT,
    implicit_stat_text          TEXT,
    flavour_text                TEXT,
    help_text                   TEXT,

    -- Assets
    inventory_icon              TEXT,

    -- Timestamps
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_items_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_items_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_items_name          ON items (name);
CREATE INDEX IF NOT EXISTS idx_items_class         ON items (class);
CREATE INDEX IF NOT EXISTS idx_items_class_id      ON items (class_id);
CREATE INDEX IF NOT EXISTS idx_items_rarity        ON items (rarity);
CREATE INDEX IF NOT EXISTS idx_items_base_item     ON items (base_item);
CREATE INDEX IF NOT EXISTS idx_items_drop_level    ON items (drop_level);
CREATE INDEX IF NOT EXISTS idx_items_frame_type    ON items (frame_type);
CREATE INDEX IF NOT EXISTS idx_items_is_in_game    ON items (is_in_game);
CREATE INDEX IF NOT EXISTS idx_items_release       ON items (release_version);
CREATE INDEX IF NOT EXISTS idx_items_tags          ON items USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_items_influences    ON items USING GIN (influences);

-- RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read items"
    ON items FOR SELECT
    USING (true);

CREATE POLICY "Allow service_role write items"
    ON items FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
