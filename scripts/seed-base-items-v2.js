/**
 * Seed script v2: fetch base items from RePoE static JSON (4028 entries)
 * and insert into Supabase. One HTTP request, no rate limiting.
 *
 * Usage: node scripts/seed-base-items-v2.js
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const REPOE_URL =
  "https://raw.githubusercontent.com/brather1ng/RePoE/master/RePoE/data/base_items.json";

async function main() {
  console.log("Fetching RePoE base_items.json...");
  const res = await fetch(REPOE_URL);
  const data = await res.json();
  const entries = Object.entries(data);

  console.log(`Total base items: ${entries.length}`);

  const toInsert = [];
  for (const [metaId, info] of entries) {
    const name = info.name;
    if (!name || !metaId) continue;
    // Wiki file name pattern: "File:{name} inventory icon.png"
    const iconFile = `File:${name} inventory icon.png`;
    toInsert.push({
      name,
      metadata_id: metaId,
      inventory_icon: iconFile,
      class_id: info.item_class || null,
      rarity: "Normal",
    });
  }

  console.log(`Items to insert: ${toInsert.length}`);

  const BATCH = 100;
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    const { error } = await supabase.from("items").insert(batch);

    if (error) {
      // Duplicate key errors are OK — means already seeded
      if (error.message.includes("duplicate")) {
        failed += batch.length;
      } else {
        console.error(`  Batch ${i}-${i + batch.length}:`, error.message);
        failed += batch.length;
      }
    } else {
      inserted += batch.length;
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Duplicates/skipped: ${failed}`);
  console.log(`Sample: ${toInsert[0].name} -> ${toInsert[0].metadata_id}`);
}

main().catch(console.error);
