import { createClient } from "@sanity/client";
import { createReadStream } from "fs";
import { resolve } from "path";

const client = createClient({
  projectId: "rrv9tvop",
  dataset: "production",
  apiVersion: "2025-05-21",
  token: process.env.SANITY_API_KEY,
  useCdn: false,
});

const ASSETS_DIR = "C:/Users/alexa/Downloads/allflame-assets";

const PANELS = [
  { mechanic: "Descend Into the Depths",   image: "Panel2-DescendIntoTheDepths.webp",   video: "Panel2-DescendIntoTheDepths.webm" },
  { mechanic: "Plan Your Voyage",          image: "Panel3-PlanYourVoyage.webp",          video: null },
  { mechanic: "Allflame Crafting",          image: "Panel4-AllflameCrafting.webp",        video: "Panel4-AllflameCrafting.webm" },
  { mechanic: "Survive the Black Current",  image: "Panel5-SurviveTheBlackCurrent.webp", video: "Panel5-SurviveTheBlackCurrent.webm" },
  { mechanic: "Mercenaries Return",         image: "Panel6-MercenariesReturn.webp",      video: "Panel6-MercenariesReturn.webm" },
  { mechanic: "The Luminary Ascendancy",    image: "Panel7-LuminaryAscendancy.webp",     video: null },
  { mechanic: "Abyss Reworked",             image: "Panel8-AbyssReworked.webp",           video: "Panel8-AbyssReworked.webm" },
  { mechanic: "Crystallise Your Power",     image: "Panel9-CrystalliseYourPower.webp",   video: "Panel9-CrystalliseYourPower.webm" },
  { mechanic: "Atlas Anomalies",            image: "Panel10-AtlasAnomalies.webp",        video: "Panel10-AtlasAnomalies.webm" },
  { mechanic: "Socket Colours Reworked",    image: "Panel11-SocketColoursReworked.webp",  video: null },
  { mechanic: "Spellcaster Rebalance",      image: "Panel12-SpellcasterRebalance.webp",  video: null },
  { mechanic: "New Spellcaster Skills",     image: "Panel13-NewSpellcasterSkills.webp",  video: "Panel13-NewSpellcasterSkills.webm" },
];

const doc = await client.fetch(`*[_type == "leagueLanding" && slug.current == "curse-of-the-allflame"][0]{ _id, mechanics }`);
if (!doc) { console.error("Document not found"); process.exit(1); }

const mechanics = doc.mechanics ?? [];
console.log(`Found ${mechanics.length} mechanics in Sanity`);

for (const panel of PANELS) {
  const idx = mechanics.findIndex((m) => m.title?.en === panel.mechanic);
  if (idx === -1) {
    console.log(`⚠ Mechanic "${panel.mechanic}" not found, skipping`);
    continue;
  }

  console.log(`\n── ${panel.mechanic} (index ${idx}) ──`);

  // Upload image
  const imgPath = resolve(ASSETS_DIR, "images", panel.image);
  console.log(`  Uploading image: ${panel.image}...`);
  const imgAsset = await client.assets.upload("image", createReadStream(imgPath), {
    filename: panel.image,
  });
  console.log(`  Image uploaded: ${imgAsset._id}`);

  // Patch the mechanic's image
  await client
    .patch(doc._id)
    .set({
      [`mechanics[${idx}].image`]: {
        _type: "image",
        asset: { _type: "reference", _ref: imgAsset._id },
      },
    })
    .commit();

  // Upload video if exists
  if (panel.video) {
    const vidPath = resolve(ASSETS_DIR, "videos", panel.video);
    console.log(`  Uploading video: ${panel.video}...`);
    const vidAsset = await client.assets.upload("file", createReadStream(vidPath), {
      filename: panel.video,
      contentType: "video/webm",
    });
    console.log(`  Video uploaded: ${vidAsset._id}`);

    await client
      .patch(doc._id)
      .set({
        [`mechanics[${idx}].video`]: {
          _type: "file",
          asset: { _type: "reference", _ref: vidAsset._id },
        },
      })
      .commit();
  }

  console.log(`  ✓ Done`);
}

// Also upload the intro panel image (Panel1)
console.log(`\n── Uploading intro panel image ──`);
const introPath = resolve(ASSETS_DIR, "images", "Panel1-Intro.webp");
const introAsset = await client.assets.upload("image", createReadStream(introPath), {
  filename: "Panel1-Intro.webp",
});
console.log(`Intro image uploaded: ${introAsset._id}`);

// Also upload the hero bg
console.log(`\n── Uploading hero background ──`);
const bgPath = resolve(ASSETS_DIR, "images", "top-bg.webp");
const bgAsset = await client.assets.upload("image", createReadStream(bgPath), {
  filename: "allflame-top-bg.webp",
});
console.log(`Hero bg uploaded: ${bgAsset._id}`);

console.log("\n✅ All panel assets uploaded and mechanics patched!");
