/**
 * Seed script: fetch ALL base items (rarity=Normal) from poewiki Cargo API
 * and upsert their metadata_id into the Supabase items table.
 *
 * Usage: node scripts/seed-base-items.js
 *
 * The Wiki Cargo API paginates with `limit` + `offset`. We fetch in
 * batches of 500, extract name + metadata_id, and upsert by name match
 * into the public.items table.
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// Wiki Cargo API gives us ~40 unique class_id values. We fetch each one
// completely (paginated), because offsets > 10k are rejected.
const CLASSES = [
  "Amulet", "Belt", "Boots", "Body Armour", "Bow", "Claw", "Dagger",
  "Fishing Rod", "Gloves", "Helmet", "One Hand Axe", "One Hand Mace",
  "One Hand Sword", "Quiver", "Ring", "Rune Dagger", "Sceptre",
  "Shield", "Staff", "Thrusting One Hand Sword", "Two Hand Axe",
  "Two Hand Mace", "Two Hand Sword", "Wand", "Warstaff",
];

const WIKI_BASE = "https://www.poewiki.net/w/api.php";
const BATCH_SIZE = 500;
const DELAY_MS = 1500; // wiki rate limit safety

async function fetchClass(className) {
  const all = [];
  let offset = 0;
  while (true) {
    const url = `${WIKI_BASE}?action=cargoquery&format=json&tables=items&fields=name,metadata_id,class_id,inventory_icon&where=class_id='${encodeURIComponent(className)}'%20AND%20rarity='Normal'&limit=${BATCH_SIZE}&offset=${offset}`;
    console.log(`  Fetching ${className} offset=${offset}...`);
    const res = await fetch(url, {
      headers: { "User-Agent": "PathOfTrade/1.0 (seed script)" },
    });
    if (!res.ok) {
      console.error(`  HTTP ${res.status} for ${className}, stopping`);
      break;
    }
    const data = await res.json();
    const items = data?.cargoquery ?? [];
    if (items.length === 0) break;
    all.push(...items);
    offset += BATCH_SIZE;
    if (items.length < BATCH_SIZE) break;
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  return all;
}

async function main() {
  console.log("Fetching base items from wiki...");
  const allItems = [];
  for (const cls of CLASSES) {
    const items = await fetchClass(cls);
    allItems.push(...items);
    console.log(`  ${cls}: ${items.length} items (total: ${allItems.length})`);
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  console.log(`\nTotal base items: ${allItems.length}`);

  // Transform: extract name + metadata_id
  const toUpsert = [];
  for (const entry of allItems) {
    const t = entry.title;
    const name = t.name;
    const metaId = t["metadata id"] || null;
    const iconFile = t["inventory icon"] || null;
    if (!name) continue;
    toUpsert.push({
      name,
      metadata_id: metaId,
      inventory_icon: iconFile,
    });
  }

  console.log(`Items with metadata_id: ${toUpsert.filter((i) => i.metadata_id).length}`);

  // Upsert into Supabase in batches (update if name matches)
  const UPDATE_BATCH = 100;
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < toUpsert.length; i += UPDATE_BATCH) {
    const batch = toUpsert.slice(i, i + UPDATE_BATCH);
    const { error } = await supabase.from("items").insert(
      batch.map((item) => ({
        name: item.name,
        metadata_id: item.metadata_id || null,
        inventory_icon: item.inventory_icon || null,
      })),
    );

    if (error) {
      console.error(`  Batch ${i}-${i + batch.length}:`, error.message);
      failed += batch.length;
    } else {
      updated += batch.length;
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`\nDone. Updated: ${updated}, Failed: ${failed}`);
  console.log(`Sample: ${JSON.stringify(toUpsert.slice(0, 3))}`);
}

main().catch(console.error);
