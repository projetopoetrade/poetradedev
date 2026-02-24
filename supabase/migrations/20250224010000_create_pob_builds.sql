-- Create table to store PoB share hashes
CREATE TABLE IF NOT EXISTS pob_builds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pob_code TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pob_builds_pob_code_unique UNIQUE (pob_code)
);

-- Enable RLS and allow public read/insert (codes are not sensitive)
ALTER TABLE pob_builds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select pob builds"
    ON pob_builds FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert pob builds"
    ON pob_builds FOR INSERT
    WITH CHECK (true);

