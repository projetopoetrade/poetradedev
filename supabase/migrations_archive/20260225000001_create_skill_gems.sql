-- Create skill_gems table based on PoE Wiki Cargo data
CREATE TABLE IF NOT EXISTS skill_gems (
    id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Nome da gem (página wiki via _pageName)
    name                    TEXT UNIQUE,

    -- Atributos de requisito (% de cada atributo necessário)
    strength_percent        INTEGER,
    dexterity_percent       INTEGER,
    intelligence_percent    INTEGER,
    primary_attribute       TEXT,          -- none | strength | dexterity | intelligence

    -- Dados da gem
    gem_description         TEXT,
    gem_tags                TEXT[],        -- ex: ['Spell', 'AoE', 'Cold', 'Nova']
    support_gem_letter      TEXT,          -- letra exibida no socket (ex: 'S', 'T')

    -- Flags
    is_awakened_support_gem BOOLEAN DEFAULT FALSE,
    is_vaal_skill_gem       BOOLEAN DEFAULT FALSE,

    -- Referências a variantes (metadata_id da tabela items)
    awakened_variant_id     TEXT,
    vaal_variant_id         TEXT,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skill_gems_name               ON skill_gems (name);
CREATE INDEX IF NOT EXISTS idx_skill_gems_primary_attribute  ON skill_gems (primary_attribute);
CREATE INDEX IF NOT EXISTS idx_skill_gems_is_vaal            ON skill_gems (is_vaal_skill_gem);
CREATE INDEX IF NOT EXISTS idx_skill_gems_is_awakened        ON skill_gems (is_awakened_support_gem);
CREATE INDEX IF NOT EXISTS idx_skill_gems_tags               ON skill_gems USING GIN (gem_tags);

-- RLS
ALTER TABLE skill_gems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read skill_gems"
    ON skill_gems FOR SELECT
    USING (true);

CREATE POLICY "Allow service_role write skill_gems"
    ON skill_gems FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
