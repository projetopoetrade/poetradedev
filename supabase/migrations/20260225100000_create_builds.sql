CREATE TABLE builds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Identity
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,

    -- PoE Classification
    game_version TEXT NOT NULL DEFAULT 'path-of-exile-1',
    league TEXT,
    class TEXT NOT NULL,
    ascendancy TEXT NOT NULL,
    main_skill TEXT,

    -- Tags
    tags TEXT[] DEFAULT '{}',

    -- Optional metadata
    difficulty TEXT,
    budget TEXT,

    -- PoB
    pob_code TEXT NOT NULL,
    pob_hash VARCHAR(12),

    -- Media
    image_url TEXT,
    video_url TEXT,

    -- Guide content
    guide_content TEXT,

    -- SEO
    seo_title TEXT,
    seo_description TEXT,

    -- Publishing
    is_published BOOLEAN NOT NULL DEFAULT false,
    author TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_builds_slug ON builds(slug);
CREATE INDEX idx_builds_game_version ON builds(game_version);
CREATE INDEX idx_builds_league ON builds(league);
CREATE INDEX idx_builds_class ON builds(class);
CREATE INDEX idx_builds_ascendancy ON builds(ascendancy);
CREATE INDEX idx_builds_tags ON builds USING gin(tags);
CREATE INDEX idx_builds_published_created ON builds(is_published, created_at DESC);

-- RLS
ALTER TABLE builds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published builds"
    ON builds FOR SELECT USING (is_published = true);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_builds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_builds_updated_at
    BEFORE UPDATE ON builds
    FOR EACH ROW EXECUTE PROCEDURE update_builds_updated_at();
