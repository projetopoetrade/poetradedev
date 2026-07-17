import { createClient } from "@sanity/client";
import { createReadStream } from "fs";
import { resolve } from "path";

const PRESS_KIT = "C:/Users/alexa/Downloads/PressKit (1)/PressKit";

const client = createClient({
  projectId: "rrv9tvop",
  dataset: "production",
  apiVersion: "2025-05-21",
  token: process.env.SANITY_API_KEY,
  useCdn: false,
});

async function uploadImage(filename) {
  const path = resolve(PRESS_KIT, filename);
  console.log(`  Uploading ${filename}...`);
  const asset = await client.assets.upload("image", createReadStream(path), {
    filename,
  });
  console.log(`  -> ${asset._id}`);
  return asset._id;
}

function imageRef(assetId) {
  return { _type: "image", asset: { _type: "reference", _ref: assetId } };
}

function key(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
}

const MECHANICS = [
  {
    title: { en: "Descend Into the Depths" },
    summary: {
      en: "Dive to the ocean floor where lanterns imbued with the spark of the Allflame will shield you from the crushing waves. Explore and claim what you can while you can! Lost gold, valuable chests, and lurking threats await you...\n\nAs the lanterns flicker and fade you'll need to rush back to the safety of the Bathysphere, to escape the clawing creatures that despise the light you bring.",
    },
    category: "league",
    imageFile: "LeagueEncounter_Cinematic1.png",
    bullets: [],
  },
  {
    title: { en: "Plan Your Voyage" },
    summary: {
      en: "Once you have charted enough areas, connect them together to create a Voyage — one giant seafloor excursion. Revisit each chart to claim its rewards again, while also amplifying those rewards in several different ways.\n\nAny area you chart reveals a modifier that applies during a Voyage. The edges of the Voyage Board also feature randomised effects that influence adjacent Charts each Voyage, adding extra rewards.",
    },
    category: "league",
    imageFile: "Voyage_UI.png",
    bullets: [
      { en: "Connect Charts together to plan a profitable Voyage" },
      { en: "Randomised edge effects amplify adjacent Charts" },
      { en: "Special Charts lead to sunken treasures, Abyssal pits, and ancient artifacts" },
    ],
  },
  {
    title: { en: "Allflame Crafting" },
    summary: {
      en: "Head belowdecks, and you'll find the heart of the ship at work. Feed it an item, and it will split into a multitude of ghostly outcomes, one of which you can keep for yourself.\n\nFind valuable Ducats on the seafloor and use them to warp and twist items in ways not seen in centuries.",
    },
    category: "league",
    imageFile: "AllflameCrafting_UI.png",
    bullets: [],
  },
  {
    title: { en: "Survive the Black Current" },
    summary: {
      en: "Keep an eye out for special types of Charts on your travels throughout Wraeclast! You may even find some that lead to notably… unwelcoming waters.",
    },
    category: "league",
    imageFile: "League_Boss_Cinematic.png",
    bullets: [],
  },
  {
    title: { en: "Mercenaries Return" },
    summary: {
      en: "The Mercenaries of Trarthus are once again roaming Wraeclast, seeking challengers. Defeat one in a duel to claim a powerful item they're carrying and recruit them as an ally for the rest of the area.\n\nIn Maps, if you don't like a Mercenary's items, you can request a Warrant that summons that specific Mercenary in a future Map with the same skills but a new set of items.",
    },
    category: "endgame",
    imageFile: "MercenariesinTown.png",
    bullets: [
      { en: "Full Atlas Tree and Scarab support for Mercenaries" },
    ],
  },
  {
    title: { en: "The Luminary Ascendancy" },
    summary: {
      en: "In Curse of the Allflame, the Scion is getting a new Ascendancy class, the Luminary.\n\nUpon becoming a Luminary, you can permanently hire a Mercenary as an active ally in combat. Unlike regular Mercenaries, Luminary's hired Mercenaries can have their equipment changed, unlocking countless new build possibilities.",
    },
    category: "endgame",
    imageFile: "LuminaryAscendancy.png",
    bullets: [],
  },
  {
    title: { en: "Abyss Reworked" },
    summary: {
      en: "Abyss has been significantly reworked. Abyssal cracks are now open, spilling their energy into the surrounding area, influencing nearby enemies. Slay them to draw the attention of Abyssal hordes that emerge from the depths to tear you apart.\n\nMore visceral feedback in moment-to-moment gameplay with audio and visual cues drawing you along. Complete refresh of Scarabs and passive tree investment.",
    },
    category: "endgame",
    imageFile: "AbyssEncounter_Gameplay.png",
    bullets: [],
  },
  {
    title: { en: "Crystallise Your Power" },
    summary: {
      en: "Legion has received a major reward overhaul. Use the new Enshrouding Crystals on your Unique Armours, then place them in a crystal within the Domain of Timeless Conflict to create a Vestigial Unique Item with powerful modifiers transferred from the Unique you've selected. Vestigial Unique Items are exclusive to Legion and replace Incubators.",
    },
    category: "endgame",
    imageFile: null,
    bullets: [],
  },
  {
    title: { en: "Atlas Anomalies" },
    summary: {
      en: "Strange locations have begun to manifest across the Atlas. When you complete Maps affected by a Voidstone, there is a chance that an anomaly will appear on the Atlas.\n\nAnomalies are areas that can be run once, granting potentially powerful rewards. Examples include Cadiro Perandus, a mysterious trader offering strange curios for your Gold, or a fully revealed Heist Blueprint wing.",
    },
    category: "endgame",
    imageFile: "AtlasAnomaly.png",
    bullets: [],
  },
  {
    title: { en: "Socket Colours Reworked" },
    summary: {
      en: "Socket colours will no longer restrict which Skills and Supports you can put in them, allowing any coloured gem to be socketed. Red, blue, and green sockets still serve a purpose, granting additional quality to gems of the matching colour.",
    },
    category: "balance",
    imageFile: null,
    bullets: [],
  },
  {
    title: { en: "Spellcaster Rebalance" },
    summary: {
      en: "Spellcasters have received major improvements across the board, particularly for those that cast Spells themselves. Over one hundred existing spells rebalanced, with more points of difference for spells of different damage types. The Assassin, Inquisitor, and Occultist Ascendancies all have new or reworked notables supporting Casters.",
    },
    category: "balance",
    imageFile: null,
    bullets: [],
  },
  {
    title: { en: "New Spellcaster Skills" },
    summary: {
      en: "A new set of Exceptional Skill Gems called Pacts that you can get from Beyond bosses and Lycia in the Forbidden Sanctum. Make a bargain with a powerful Beyond Demon to empower your Spells at the cost of afflicting yourself. Also includes Mana-Infused Staff reservation skill and several new Transfigured Skill Gems.",
    },
    category: "balance",
    imageFile: "PactSkillGem_Cinematic.png",
    bullets: [],
  },
];

const HIGHLIGHTS = [
  { label: { en: "New Features" }, value: { en: "13" } },
  { label: { en: "Spells Rebalanced" }, value: { en: "100+" } },
  { label: { en: "New Ascendancy" }, value: { en: "1" } },
  { label: { en: "Reworked Systems" }, value: { en: "3" } },
];

async function main() {
  console.log("Finding Curse of the Allflame document...");
  const doc = await client.fetch(
    `*[_type == "leagueLanding" && slug.current == "curse-of-the-allflame"][0]{ _id }`
  );
  if (!doc) {
    console.error("Document not found! Make sure the slug is correct.");
    process.exit(1);
  }
  console.log(`Found: ${doc._id}`);

  // Upload key art and logo
  console.log("\n--- Uploading hero assets ---");
  const keyArtId = await uploadImage("KeyArt_Hero.png");
  const logoId = await uploadImage("Logo.png");

  // Upload mechanic images
  console.log("\n--- Uploading mechanic images ---");
  const mechanicImageIds = {};
  for (const m of MECHANICS) {
    if (m.imageFile) {
      mechanicImageIds[m.imageFile] = await uploadImage(m.imageFile);
    }
  }

  // Build mechanics array
  const mechanics = MECHANICS.map((m) => ({
    _type: "mechanic",
    _key: key(m.title.en),
    title: m.title,
    summary: m.summary,
    category: m.category,
    ...(m.imageFile && mechanicImageIds[m.imageFile]
      ? { image: imageRef(mechanicImageIds[m.imageFile]) }
      : {}),
    ...(m.bullets.length > 0
      ? {
          bullets: m.bullets.map((b, i) => ({
            _type: "localeString",
            _key: `${key(m.title.en)}-b${i}`,
            ...b,
          })),
        }
      : {}),
  }));

  // Build highlights array
  const highlights = HIGHLIGHTS.map((h, i) => ({
    _type: "object",
    _key: `hl-${i}`,
    label: h.label,
    value: h.value,
  }));

  console.log("\n--- Patching document ---");
  await client
    .patch(doc._id)
    .set({
      keyArt: {
        _type: "image",
        asset: { _type: "reference", _ref: keyArtId },
        alt: "Valerie holds an Allflame lantern against the deep ocean darkness",
      },
      logo: {
        _type: "image",
        asset: { _type: "reference", _ref: logoId },
      },
      intro: {
        en: "Discover sunken artefacts and battle the horrors of the deep in Path of Exile: Curse of the Allflame. Our July expansion introduces a new challenge league, significant improvements to Abyss and Legion, the return of the Mercenaries of Trarthus, another new Ascendancy Class for the Scion, an all-new endgame system, and much more!",
        ptBr: "Descubra artefatos submersos e enfrente os horrores das profundezas em Path of Exile: Curse of the Allflame. A expansão de julho traz uma nova liga desafio, melhorias significativas em Abyss e Legion, o retorno dos Mercenários de Trarthus, outra nova Classe de Ascendência para a Scion, um sistema de endgame inédito e muito mais!",
      },
      officialUrl: "https://www.pathofexile.com/allflame",
      mechanics,
      highlights,
    })
    .commit();

  console.log("\nDone! Document updated successfully.");
  console.log("Key art, logo, 12 mechanic sections, and highlights are now live.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
