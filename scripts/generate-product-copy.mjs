/**
 * Gera texto de produto para o Sanity, como RASCUNHO, nos itens que não têm
 * documento nenhum.
 *
 * Em 28/07/2026, 87 dos 180 produtos da liga corrente estavam sem doc: a página
 * saía com ~1.900 caracteres contra ~4.800 das que têm texto, e a
 * `metaDescription` caía no template genérico. Como o catálogo foi ampliado por
 * SEO, página magra anula o motivo de tê-lo ampliado.
 *
 * Como funciona:
 *   1. lê os produtos da liga no Supabase e descobre quais não têm doc no Sanity
 *   2. puxa da PoE Wiki, pelo `metadata_id` já gravado, o que o item FAZ
 *      (`description`), como se USA (`help_text`) e de onde VEM (`drop_text`)
 *   3. manda esses fatos ao engine (`POST {ENGINE_API_URL}/product-copy`), que
 *      redige em EN e PT-BR ancorado neles
 *   4. grava como `drafts.` no Sanity
 *
 * Rascunho de propósito: a regra do projeto é que conteúdo gerado passa por
 * revisão humana antes de publicar. Nada disto vai ao ar sozinho.
 *
 * Uso:
 *   node scripts/generate-product-copy.mjs --league Allflame --limit 3   (dry-run)
 *   node scripts/generate-product-copy.mjs --league Allflame --apply
 */
import { createClient as createSupabase } from "@supabase/supabase-js";
import { createClient as createSanity } from "@sanity/client";
import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const WIKI_API = "https://www.poewiki.net/w/api.php";
const UA = { "User-Agent": "PathOfTrade/1.0 (contact: icaroberger00@gmail.com)" };
const LOCALES = [
  { code: "en", sanityKey: "en" },
  { code: "pt-br", sanityKey: "pt_br" },
];

const args = process.argv.slice(2);
const getArg = (flag, fallback = null) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : fallback;
};
const league = getArg("--league");
const limit = Number(getArg("--limit", "0")) || 0;
const apply = args.includes("--apply");

if (!league) {
  console.error("uso: node scripts/generate-product-copy.mjs --league <Liga> [--limit N] [--apply]");
  process.exit(1);
}

const engineBase = (process.env.ENGINE_API_URL || "").trim().replace(/\/$/, "");
if (!engineBase) {
  console.error("ENGINE_API_URL ausente no .env.local — este script gera pelo engine.");
  process.exit(1);
}

const sanity = createSanity({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-05-21",
  token: process.env.SANITY_API_KEY,
  useCdn: false,
});

const decodeEntities = (t) =>
  t
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

/** A wiki usa <br> e links [[wiki]] no meio do texto; nada disso serve de fato. */
const cleanFact = (t) =>
  t
    ? decodeEntities(t)
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1")
        .replace(/\[\[([^\]]*)\]\]/g, "$1")
        .replace(/\s+/g, " ")
        .trim()
    : undefined;

async function getJson(url, init) {
  const res = await fetch(url, { headers: UA, ...init });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

/** metadata_id -> { description, helpText, dropText }, em lotes. */
async function wikiFacts(metadataIds) {
  const out = new Map();
  for (let i = 0; i < metadataIds.length; i += 40) {
    const chunk = metadataIds.slice(i, i + 40);
    const where = chunk.map((id) => `items.metadata_id="${id}"`).join(" OR ");
    const params = new URLSearchParams({
      action: "cargoquery",
      format: "json",
      tables: "items",
      fields: "items.metadata_id,items.description,items.help_text,items.drop_text",
      where,
      limit: "100",
    });
    try {
      const rows = (await getJson(`${WIKI_API}?${params}`)).cargoquery || [];
      for (const { title } of rows) {
        const id = title["metadata id"];
        if (!id) continue;
        out.set(id, {
          description: cleanFact(title.description),
          helpText: cleanFact(title["help text"]),
          dropText: cleanFact(title["drop text"]),
        });
      }
    } catch (e) {
      console.warn(`  wiki falhou num lote: ${e.message}`);
    }
  }
  return out;
}

/**
 * Portable Text de parágrafos simples, montado à mão.
 *
 * `@sanity/block-tools` exigiria jsdom e um schema compilado só para converter
 * texto puro em blocos — o formato de um parágrafo é estável e trivial.
 */
function toPortableText(paragraphs, seed) {
  return paragraphs.map((text, i) => {
    const key = crypto.createHash("sha1").update(`${seed}-${i}`).digest("hex").slice(0, 12);
    return {
      _type: "block",
      _key: key,
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: `${key}s`, text, marks: [] }],
    };
  });
}

async function generateCopy(name, locale, facts) {
  const res = await fetch(`${engineBase}/product-copy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, locale, facts, league }),
  });
  if (!res.ok) throw new Error(`engine HTTP ${res.status}`);
  return res.json();
}

async function main() {
  console.log(`Gerando texto de produto para "${league}" via ${engineBase}\n`);

  const supabase = createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const { data: products, error } = await supabase
    .from("products")
    .select("name, slug, category, gameVersion, difficulty, metadata_id, is_listed")
    .eq("league", league);
  if (error) throw error;

  const existing = await sanity.fetch(`*[_type=="product"]{"s":slug.current}`);
  const haveDoc = new Set(existing.map((r) => r.s).filter(Boolean));

  let pending = products.filter((p) => p.slug && !haveDoc.has(p.slug));
  // Publicado primeiro: é o que já está gerando (ou desperdiçando) tráfego.
  pending.sort((a, b) => Number(b.is_listed) - Number(a.is_listed));
  if (limit) pending = pending.slice(0, limit);

  console.log(`produtos na liga: ${products.length} | sem doc no Sanity: ${pending.length}`);
  if (pending.length === 0) return;

  const facts = await wikiFacts(pending.map((p) => p.metadata_id).filter(Boolean));
  const comFato = pending.filter((p) => facts.get(p.metadata_id)?.description).length;
  console.log(`fatos da wiki resolvidos: ${comFato}/${pending.length}\n`);

  let ok = 0;
  const falhas = [];

  for (const product of pending) {
    const itemFacts = facts.get(product.metadata_id) || {};
    try {
      const copies = {};
      for (const { code, sanityKey } of LOCALES) {
        copies[sanityKey] = await generateCopy(product.name, code, itemFacts);
      }

      const docId = `drafts.product-${product.slug}`;
      const doc = {
        _id: docId,
        _type: "product",
        name: product.name,
        slug: { _type: "slug", current: product.slug },
        category: product.category,
        gameVersion: product.gameVersion,
        league,
        difficulty: product.difficulty,
        seoTitle: { en: copies.en.seoTitle, pt_br: copies.pt_br.seoTitle },
        metaDescription: {
          en: copies.en.metaDescription,
          pt_br: copies.pt_br.metaDescription,
        },
        body: {
          en: toPortableText(copies.en.paragraphs, `${product.slug}-en`),
          pt_br: toPortableText(copies.pt_br.paragraphs, `${product.slug}-pt`),
        },
        updatedAt: new Date().toISOString(),
      };

      if (apply) {
        await sanity.createOrReplace(doc);
      }
      ok++;
      const marca = itemFacts.description ? " " : "~"; // ~ = sem fato da wiki
      console.log(`  ${marca} ${product.name.padEnd(34)} ${copies.en.seoTitle.slice(0, 52)}`);
    } catch (e) {
      falhas.push(`${product.name}: ${e.message}`);
      console.log(`  ! ${product.name.padEnd(34)} ${e.message}`);
    }
  }

  console.log(`\n${ok} gerados, ${falhas.length} falhas`);
  console.log(apply ? "Gravados como RASCUNHO — revise no Studio antes de publicar." : "(dry-run — nada gravado. Use --apply.)");
  if (falhas.length) console.log("\nfalhas:\n  " + falhas.join("\n  "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
