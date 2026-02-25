-- Create table to store PoB share hashes
CREATE TABLE IF NOT EXISTS pob_builds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pob_code TEXT NOT NULL,
    pob_hash VARCHAR(12),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on pob_hash for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_pob_builds_hash ON pob_builds(pob_hash);

-- Create index on created_at for potential cleanup
CREATE INDEX IF NOT EXISTS idx_pob_builds_created_at ON pob_builds(created_at);

-- Enable RLS and allow public read/insert (codes are not sensitive)
ALTER TABLE pob_builds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select pob builds"
    ON pob_builds FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert pob builds"
    ON pob_builds FOR INSERT
    WITH CHECK (true);

