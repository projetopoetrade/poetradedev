const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const https = require("https");
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const BASES_ROOT = path.join(__dirname, "..", "public", "images", "bases");
const POBBIN_BASE = "https://assets.pobb.in/1";

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

const CLASS_FOLDER = {
  Amulet: "amulets", Belt: "belts", Boots: "boots", "Body Armour": "body-armours",
  Bow: "weapons", Claw: "weapons", Dagger: "weapons", Gloves: "gloves",
  Helmet: "helmets", Quiver: "quivers", Ring: "rings", Shield: "shields",
  Staff: "weapons", Wand: "weapons", Sceptre: "weapons",
  "One Hand Axe": "weapons", "One Hand Mace": "weapons", "One Hand Sword": "weapons",
  "Two Hand Axe": "weapons", "Two Hand Mace": "weapons", "Two Hand Sword": "weapons",
};

async function main() {
  console.log("Fetching items from Supabase...");
  let downloaded = 0, skipped = 0, failed = 0;
  let offset = 0;
  const BATCH = 500;

  while (true) {
    const { data } = await supabase
      .from("items")
      .select("name, class_id, metadata_id")
      .not("metadata_id", "is", null)
      .order("name")
      .range(offset, offset + BATCH - 1);

    if (!data || data.length === 0) break;

    for (const item of data) {
      const cls = item.class_id || "Misc";
      const folder = CLASS_FOLDER[cls] || "misc";
      const fname = sanitize(item.name) + ".webp";
      const dest = path.join(BASES_ROOT, folder, fname);
      if (fs.existsSync(dest)) { skipped++; continue; }

      const url = POBBIN_BASE + "/" + encodeURIComponent(item.name) + ".webp";
      try {
        await download(url, dest);
        downloaded++;
        console.log("  OK " + item.name + " -> " + folder + "/" + fname);
      } catch (e) {
        failed++;
      }
    }

    offset += BATCH;
    console.log("Progress: offset=" + offset + " ok=" + downloaded + " skip=" + skipped + " fail=" + failed);
  }

  console.log("\nDone: " + downloaded + " new, " + skipped + " skipped, " + failed + " failed");
}

main().catch(console.error);
