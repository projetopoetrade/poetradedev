/**
 * Download base item icons v2: RePoE + GGG CDN as primary, Wiki as fallback.
 *
 * 1. Load RePoE base_items.json (local or fetch)
 * 2. For each Supabase item with metadata_id, find visual_identity.dds_file
 * 3. Construct GGG CDN URL: https://web.poecdn.com/image/{dds_file_with_png}
 * 4. Download → /public/images/bases/{name}.webp
 * 5. If not in RePoE, fall back to wiki
 *
 * Usage: node scripts/download-base-icons-v2.js
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const https = require("https");
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const OUT_DIR = path.join(__dirname, "..", "public", "images", "bases");
const REPOE_URL = "https://raw.githubusercontent.com/brather1ng/RePoE/master/RePoE/data/base_items.json";

function sanitize(name) {
  return name.toLowerCase().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { "User-Agent": "PathOfTrade/1.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", (e) => { file.close(); try { fs.unlinkSync(dest); } catch {} reject(e); });
  });
}

function wikiUrl(name) {
  const fn = "File:" + name + " inventory icon.png";
  return "https://www.poewiki.net/wiki/Special:FilePath/" + fn.replace(/ /g, "_");
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Load RePoE data
  console.log("Loading RePoE data...");
  let repoeData = {};
  try {
    const res = await fetch(REPOE_URL);
    repoeData = await res.json();
    console.log(`RePoE: ${Object.keys(repoeData).length} items`);
  } catch (e) {
    console.error("Failed to load RePoE:", e.message);
    return;
  }

  // Build metaId → dds_file map
  const ddsMap = new Map();
  for (const [metaId, info] of Object.entries(repoeData)) {
    const dds = info.visual_identity?.dds_file;
    if (dds) ddsMap.set(metaId, dds);
  }
  console.log(`DDS mappings: ${ddsMap.size}`);

  // Fetch Supabase items with metadata_id
  console.log("Fetching Supabase items...");
  let fetched = 0;
  let gggOk = 0;
  let wikiOk = 0;
  let skipped = 0;
  let failed = 0;
  let offset = 0;
  const BATCH = 500;

  while (true) {
    const { data } = await supabase
      .from("items")
      .select("name, metadata_id")
      .not("metadata_id", "is", null)
      .range(offset, offset + BATCH - 1);

    if (!data || data.length === 0) break;
    fetched += data.length;

    for (const item of data) {
      const outName = sanitize(item.name) + ".webp";
      const dest = path.join(OUT_DIR, outName);
      if (fs.existsSync(dest)) { skipped++; continue; }

      // Try GGG CDN via RePoE
      const dds = ddsMap.get(item.metadata_id);
      if (dds) {
        const pngPath = dds.replace(/\.dds$/, ".png");
        const cdnUrl = "https://web.poecdn.com/image/" + pngPath;
        try {
          await download(cdnUrl, dest);
          gggOk++;
          console.log("  GGG " + item.name + " -> " + outName);
          continue;
        } catch (e) {
          // fall through to wiki
        }
      }

      // Fallback: Wiki
      try {
        await download(wikiUrl(item.name), dest);
        wikiOk++;
        console.log("  WIKI " + item.name + " -> " + outName);
      } catch (e) {
        failed++;
      }
    }

    offset += BATCH;
    console.log("Progress: fetched=" + fetched + " ggg=" + gggOk + " wiki=" + wikiOk + " skip=" + skipped + " fail=" + failed);
  }

  console.log("\nDone. GGG:" + gggOk + " Wiki:" + wikiOk + " Skip:" + skipped + " Fail:" + failed);
}

main().catch(console.error);
