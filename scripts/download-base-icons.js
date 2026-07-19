/**
 * Download base item inventory icons from the PoE Wiki CDN and save
 * them to public/images/bases/.
 *
 * Uses the metadata_id stored in Supabase items table (populated by
 * seed-base-items.js) to resolve each base's wiki file name.
 *
 * Usage: node scripts/download-base-icons.js
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
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

const OUT_DIR = path.join(__dirname, "..", "public", "images", "bases");
const DELAY_MS = 2000; // wiki rate limit: max ~30 req/min

function sanitize(name) {
  return name
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function downloadWithRetry(url, dest, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await download(url, dest);
      return;
    } catch (e) {
      if (attempt === retries) throw e;
      if (e.message.includes("429")) {
        await new Promise((r) => setTimeout(r, 10000));
      } else {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const mod = url.startsWith("https") ? https : http;
    mod.get(url, { headers: { "User-Agent": "PathOfTrade/1.0 (download-icons)" } }, (res) => {
      if (res.statusCode === 429) { reject(new Error("429")); return; }
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", reject);
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Fetch all items with inventory_icon from Supabase
  const BATCH = 1000;
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("items")
      .select("name, inventory_icon, metadata_id, class_id")
      .not("inventory_icon", "is", null)
      .not("metadata_id", "is", null)
      .range(offset, offset + BATCH - 1);

    if (error) {
      console.error("Supabase error:", error.message);
      break;
    }
    if (!data || data.length === 0) break;

    for (const item of data) {
      const iconFile = item.inventory_icon;
      if (!iconFile || typeof iconFile !== "string" || !iconFile.startsWith("File:")) {
        skipped++;
        continue;
      }

      const fileName = iconFile.replace(/^File:/, "").replace(/ /g, "_");
      const wikiUrl = `https://www.poewiki.net/wiki/Special:FilePath/${fileName}`;

      const outName = sanitize(item.name) + ".webp";
      const dest = path.join(OUT_DIR, outName);

      if (fs.existsSync(dest)) {
        skipped++;
        continue;
      }

      try {
        await downloadWithRetry(wikiUrl, dest);
        downloaded++;
        console.log(`  OK  ${item.name} -> ${outName}`);
      } catch (e) {
        failed++;
        console.log(`  ERR ${item.name}: ${e.message}`);
      }

      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    offset += BATCH;
    console.log(`\nProgress: ${downloaded} ok, ${skipped} skipped, ${failed} failed\n`);
  }

  console.log(`\nDone. Total: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed`);
}

main().catch(console.error);
