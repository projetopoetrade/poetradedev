/**
 * Cadastra no catálogo as currencies negociadas no Currency Exchange que ainda
 * não existem como produto, acima de um valor mínimo em divine.
 *
 * O produto nasce com `price: 0` e `is_listed: false`. Quem preenche preço,
 * `price_divine` e `min_quantity` é `POST /api/admin/products/reprice` — este
 * script não decide preço, só descobre item, resolve `metadata_id` e baixa o
 * ícone. Rode o reprice logo depois.
 *
 * O ícone vem da PoE Wiki (campo `inventory_icon` da Cargo API), é baixado e
 * convertido para webp em `public/images/products/`, seguindo a convenção que o
 * site já usa. Não hotlinkamos a wiki.
 *
 * Uso:
 *   node scripts/add-currencies.mjs --league Allflame --min-divine 0.1
 *   node scripts/add-currencies.mjs --league Allflame --min-divine 0.1 --apply
 */
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import dotenv from "dotenv";
import path from "path";
import fs from "fs/promises";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const WIKI_API = "https://www.poewiki.net/w/api.php";
const CX_URL = "https://web.poecdn.com/api/currency-exchange";
const UA = { "User-Agent": "PathOfTrade/1.0 (contact: icaroberger00@gmail.com)" };
const IMG_DIR = path.resolve(process.cwd(), "public/images/products");

const CHAOS = "Metadata/Items/Currency/CurrencyRerollRare";
const DIVINE = "Metadata/Items/Currency/CurrencyModValues";

/**
 * Famílias que o operador não vende: consumível de crafting e itens que não são
 * moeda de troca. Filtrado por caminho de metadata porque o nome não distingue
 * (essence, scarab e tatuagem são todos `StackableCurrency` na wiki).
 */
const EXCLUDED = [
  "/Scarabs/",
  "/MapFragments/",
  "/DivinationCards/",
  "AncestralTattoo",
  "AncestralOmen",
  "Essence",
  "/Catalysts/",
  "HarvestSeed",
];

const args = process.argv.slice(2);
const getArg = (flag, fallback = null) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : fallback;
};
const league = getArg("--league");
const minDivine = Number(getArg("--min-divine", "0.1"));
const apply = args.includes("--apply");

if (!league) {
  console.error("uso: node scripts/add-currencies.mjs --league <Liga> [--min-divine 0.1] [--apply]");
  process.exit(1);
}

const slugify = (s) =>
  s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");

async function getJson(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Valor de cada moeda em divines, a partir do CX.
 *
 * Espelha `lib/pricing/cx-exchange.ts` — inclusive a mediana entre horas, que
 * existe porque `lowest_ratio` é o extremo da hora e um fill absurdo puxa a
 * média inteira. A lib é a fonte da verdade em runtime; aqui é só para aplicar
 * o corte de `--min-divine`, já que o preço final quem grava é o reprice.
 */
async function cxDivineValues(leagueName, hours = 6) {
  const now = Math.floor(Date.now() / 1000);
  const latest = now - (now % 3600) - 3600;
  const obs = new Map();

  for (let k = 0; k < hours; k++) {
    let payload;
    try {
      payload = await getJson(`${CX_URL}/${latest - 3600 * k}`);
    } catch {
      continue;
    }
    for (const m of payload.markets || []) {
      if (m.league !== leagueName) continue;
      const pair = m.market_pair;
      if (!pair || pair.length !== 2) continue;
      for (const [from, to] of [pair, [pair[1], pair[0]]]) {
        const rates = [];
        for (const side of [m.lowest_ratio || {}, m.highest_ratio || {}]) {
          const a = side[from];
          const b = side[to];
          if (typeof a === "number" && typeof b === "number" && a > 0) rates.push(b / a);
        }
        if (!rates.length) continue;
        const key = `${from}|${to}`;
        if (!obs.has(key)) obs.set(key, []);
        obs.get(key).push(rates.reduce((s, r) => s + r, 0) / rates.length);
      }
    }
  }

  const rate = new Map();
  obs.forEach((list, key) => rate.set(key, median(list)));

  const divinePerChaos = rate.get(`${CHAOS}|${DIVINE}`);
  const values = new Map([[DIVINE, 1]]);
  const ids = new Set();
  rate.forEach((_v, key) => ids.add(key.split("|")[0]));

  for (const id of Array.from(ids)) {
    if (id === DIVINE) continue;
    const direct = rate.get(`${id}|${DIVINE}`);
    if (direct > 0) {
      values.set(id, direct);
      continue;
    }
    const inChaos = rate.get(`${id}|${CHAOS}`);
    if (inChaos > 0 && divinePerChaos > 0) values.set(id, inChaos * divinePerChaos);
  }
  return values;
}

/** metadata_id -> { name, icon } da PoE Wiki, paginado. */
async function wikiItems() {
  const out = new Map();
  let offset = 0;
  for (;;) {
    const params = new URLSearchParams({
      action: "cargoquery",
      format: "json",
      tables: "items",
      fields: "items.name,items.metadata_id,items.inventory_icon",
      where: 'items.metadata_id IS NOT NULL AND items.metadata_id!=""',
      limit: "500",
      offset: String(offset),
    });
    const rows = (await getJson(`${WIKI_API}?${params}`)).cargoquery || [];
    if (!rows.length) break;
    for (const { title } of rows) {
      const id = title["metadata id"];
      const name = title.name && decodeEntities(title.name);
      // O ícone também vem escapado ("File:Rotmother&#039;s Ducat inventory
      // icon.png") — sem decodificar, o título não resolve na API de imagens e o
      // item fica sem arte.
      const icon = title["inventory icon"] ? decodeEntities(title["inventory icon"]) : null;
      if (id && name && !out.has(id)) out.set(id, { name, icon });
    }
    offset += rows.length;
    if (rows.length < 500) break;
  }
  return out;
}

function decodeEntities(t) {
  return t
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Resolve páginas File: da wiki para URL real, em lotes de 50 (limite da API). */
async function resolveIconUrls(files) {
  const urls = new Map();
  for (let i = 0; i < files.length; i += 50) {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "imageinfo",
      iiprop: "url",
      titles: files.slice(i, i + 50).join("|"),
    });
    const pages = (await getJson(`${WIKI_API}?${params}`)).query?.pages || {};
    for (const page of Object.values(pages)) {
      const url = page.imageinfo?.[0]?.url;
      if (page.title && url) urls.set(page.title, url);
    }
  }
  return urls;
}

async function downloadIcon(url, slug) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf).webp({ quality: 90 }).toFile(path.join(IMG_DIR, `${slug}.webp`));
  return true;
}

async function main() {
  console.log(`Buscando currencies de "${league}" acima de ${minDivine} divine...\n`);

  const [values, wiki] = await Promise.all([cxDivineValues(league), wikiItems()]);
  console.log(`  mercados com valor: ${values.size}  |  itens na wiki: ${wiki.size}`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const { data: existing, error } = await supabase
    .from("products")
    .select("name, metadata_id")
    .eq("league", league);
  if (error) throw error;

  const haveIds = new Set(existing.filter((p) => p.metadata_id).map((p) => p.metadata_id));
  const haveNames = new Set(existing.map((p) => p.name));

  const candidates = [];
  values.forEach((divine, id) => {
    if (!divine || divine <= minDivine) return;
    if (haveIds.has(id)) return;
    if (EXCLUDED.some((e) => id.includes(e))) return;
    const item = wiki.get(id);
    if (!item || haveNames.has(item.name)) return;
    candidates.push({ ...item, metadata_id: id, divine });
  });
  candidates.sort((a, b) => b.divine - a.divine);

  console.log(`  candidatos: ${candidates.length}\n`);
  for (const c of candidates) {
    console.log(`   ${c.name.padEnd(34)} ${c.divine.toFixed(4)} div   ${c.icon ? "" : "(SEM ICONE)"}`);
  }

  if (!apply) {
    console.log(`\n(dry-run — nada gravado. Use --apply.)`);
    return;
  }

  await fs.mkdir(IMG_DIR, { recursive: true });
  const iconUrls = await resolveIconUrls([...new Set(candidates.map((c) => c.icon).filter(Boolean))]);

  const rows = [];
  let icons = 0;
  for (const c of candidates) {
    const slug = slugify(c.name);
    const url = c.icon && iconUrls.get(c.icon);
    if (url && (await downloadIcon(url, slug).catch(() => false))) icons++;
    rows.push({
      name: c.name,
      // Slug curto e independente de liga: é a chave compartilhada com o Sanity,
      // e o catálogo existente usa esta forma (110 dos 115 produtos).
      slug,
      url_slug: slug,
      category: "Currency",
      gameVersion: "path-of-exile-1",
      league,
      difficulty: "softcore",
      imgUrl: `/images/products/${slug}.webp`,
      alt: c.name,
      metadata_id: c.metadata_id,
      price: 0,
      is_listed: false,
      in_stock: false,
    });
  }

  const { error: insErr } = await supabase.from("products").insert(rows);
  if (insErr) throw insErr;

  console.log(`\n${rows.length} produtos criados | ${icons} ícones baixados`);
  console.log(`Agora rode o reprice para preencher preço, price_divine e min_quantity.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
