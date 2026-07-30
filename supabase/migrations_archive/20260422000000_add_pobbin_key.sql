-- Cache the pobb.in paste key alongside the shareable PoB hash. Lets the
-- "Open in PoB" flow skip the upload round-trip for any PoB that has
-- already been uploaded once, even across sessions/devices.
ALTER TABLE pob_builds
    ADD COLUMN IF NOT EXISTS pobbin_key TEXT NULL;
