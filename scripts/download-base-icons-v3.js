/**
 * Download base item icons v3: organized by category folder.
 *
 * Folder structure matches the existing pattern (flask_images/, tinctures/):
 *   public/images/bases/
 *     amulets/  belts/  boots/  body-armours/
 *     gloves/   helmets/ rings/  shields/
 *     weapons/  quivers/ ...
 *
 * Also generates a mapping file: lib/pob/base-icon-urls.ts
 * that getEffectiveItemIconUrl imports for O(1) lookup.
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const https = require("https");
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const BASES_ROOT = path.join(__dirname, "..", "public", "images", "bases");
const MAPPING_OUT = path.join(__dirname, "..", "lib", "pob", "base-icon-urls.ts");
const REPOE_URL = "https://raw.githubusercontent.com/brather1ng/RePoE/master/RePoE/data/base_items.json";

// Class name → folder name
const CLASS_FOLDER = {
  "Amulet": "amulets",
  "Belt": "belts",
  "Boots": "boots",
  "Body Armour": "body-armours",
  "Bow": "weapons",
  "Claw": "weapons",
  "Dagger": "weapons",
  "Fishing Rod": "weapons",
  "Gloves": "gloves",
  "Helmet": "helmets",
  "One Hand Axe": "weapons",
  "One Hand Mace": "weapons",
  "One Hand Sword": "weapons",
  "Quiver": "quivers",
  "Ring": "rings",
  "Rune Dagger": "weapons",
  "Sceptre": "weapons",
  "Shield": "shields",
  "Staff": "weapons",
  "Thrusting One Hand Sword": "weapons",
  "Two Hand Axe": "weapons",
  "Two Hand Mace": "weapons",
  "Two Hand Sword": "weapons",
  "Wand": "weapons",
  "Warstaff": "weapons",
  "Jewel": "jewels",
  "AbyssJewel": "jewels",
  "Flask": "flasks",
  "HybridFlask": "flasks",
  "LifeFlasks": "flasks",
  "ManaFlask": "flasks",
  "UtilityFlask": "flasks",
  "UtilityFlaskCritical": "flasks",
  "Currency": "currency",
  "StackableCurrency": "currency",
  "DivinationCard": "cards",
  "Map": "maps",
};

function sanitize(name) {
  return name.toLowerCase().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    fs.mkdirSync(dir, { recursive: true });
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { "User-Agent": "PathOfTrade/1.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close(); try { fs.unlinkSync(dest); } catch {}
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close(); try { fs.unlinkSync(dest); } catch {}
        reject(new Error("HTTP " + res.statusCode));
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
  // Load RePoE data
  console.log("Loading RePoE...");
  const res = await fetch(REPOE_URL);
  const repoeData = await res.json();

  // Build maps: metaId → { dds, class, name }
  const repoeMap = new Map();
  for (const [metaId, info] of Object.entries(repoeData)) {
    const dds = info.visual_identity?.dds_file;
    const cls = info.item_class;
    if (dds && cls) repoeMap.set(metaId, { dds, cls, name: info.name });
  }
  console.log("RePoE items with dds+class:", repoeMap.size);

  // Download
  let gggOk = 0, wikiOk = 0, skip = 0, fail = 0;
  let offset = 0;
  const BATCH = 500;

  // Also build mapping: baseName → local path
  const urlMap = {};

  while (true) {
    const { data, error } = await supabase
      .from("items")
      .select("name, metadata_id")
      .not("metadata_id", "is", null)
      .order("name")
      .range(offset, offset + BATCH - 1);

    if (error || !data || data.length === 0) break;

    for (const item of data) {
      const repoe = repoeMap.get(item.metadata_id);
      const cls = repoe?.cls || "Misc";
      const folder = CLASS_FOLDER[cls] || "misc";
      const fileName = sanitize(item.name) + ".webp";
      const dest = path.join(BASES_ROOT, folder, fileName);

      if (fs.existsSync(dest)) { skip++; continue; }

      let ok = false;
      if (repoe?.dds) {
        const pngPath = repoe.dds.replace(/\.dds$/, ".png");
        try {
          await download("https://web.poecdn.com/image/" + pngPath, dest);
          gggOk++; ok = true;
        } catch {}
      }

      if (!ok) {
        try {
          await download(wikiUrl(item.name), dest);
          wikiOk++; ok = true;
        } catch {}
      }

      if (!ok) { fail++; }

      // Record mapping regardless of success (will be filtered later)
      if (ok) {
        urlMap[item.name] = "/images/bases/" + folder + "/" + fileName;
      }
    }

    offset += BATCH;
    console.log("Progress: offset=" + offset + " ggg=" + gggOk + " wiki=" + wikiOk + " skip=" + skip + " fail=" + fail);
  }

  // Write mapping file
  const mapContent = "// Auto-generated by scripts/download-base-icons-v3.js\n" +
    "// Maps base item name -> local image path.\n\n" +
    "const BASE_ICON_URLS: Record<string, string> = {\n" +
    Object.entries(urlMap).map(([k, v]) => "  " + JSON.stringify(k) + ": " + JSON.stringify(v)).join(",\n") +
    "\n};\n\n" +
    "export default BASE_ICON_URLS;\n";

  fs.writeFileSync(MAPPING_OUT, mapContent, "utf-8");
  console.log("\nMapping written to: " + MAPPING_OUT);
  console.log("Total mappings: " + Object.keys(urlMap).length);
  console.log("GGG:" + gggOk + " Wiki:" + wikiOk + " Skip:" + skip + " Fail:" + fail);
}

main().catch(console.error);
