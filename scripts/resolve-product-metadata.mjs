/**
 * Popula `products.metadata_id` — a chave que liga cada produto ao Currency
 * Exchange oficial da GGG.
 *
 * Roda offline, uma vez (e de novo quando entrarem produtos novos), porque o
 * mapeamento precisa de ~3 MB de dados de referência que não têm por que morar
 * no runtime do site.
 *
 * Por que não basta uma fonte só:
 *
 *  - O CX identifica moeda por caminho de metadata FUNCIONAL: Exalted Orb é
 *    `CurrencyAddModToRare`, Chaos Orb é `CurrencyRerollRare`. Buscar "Exalted"
 *    nos caminhos do CX devolve zero resultados.
 *  - A GGG mantém DOIS caminhos para o mesmo item, e as fontes discordam sobre
 *    qual usar. Para Foulborn Exalted Orb o RePoE diz `Chayula/FoulbornExalted`,
 *    enquanto o CX negocia em `Currency/CurrencyMutatedAddModToRare`.
 *  - `/api/trade/data/static` da GGG não traz caminho de metadata nenhum, só ids
 *    curtos (`alt`, `fusing`) — mas o blob base64 do campo `image` embute o
 *    caminho do asset, e dá para extrair dali.
 *
 * A PoE Wiki é a fonte PRIMÁRIA porque é a única que expõe `metadata_id` na
 * variante que o CX usa: ela resolve 1041 dos 1042 mercados da Allflame (99%),
 * contra 854 do RePoE (87%). Os 8 itens que o RePoE errava — os três Foulborn,
 * Volatile Vaal Orb, Flesh of Xesht, Orb of Remembrance, Orb of Unravelling e
 * Dead Man's Sulphur — apareciam como "não negociados no CX", o que era falso.
 *
 * Uso:
 *   node scripts/resolve-product-metadata.mjs --league Allflame            (dry-run)
 *   node scripts/resolve-product-metadata.mjs --league Allflame --apply
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const WIKI_API = "https://www.poewiki.net/w/api.php";
const REPOE_URL = "https://lvlvllvlvllvlvl.github.io/RePoE/base_items.min.json";
const NINJA_URL = "https://poe.ninja/poe1/api/economy/exchange/current/overview";
const STATIC_URL = "https://www.pathofexile.com/api/trade/data/static";
const CX_URL = "https://web.poecdn.com/api/currency-exchange";
const UA = { "User-Agent": "PathOfTrade/1.0 (pathoftrade.net)" };

/**
 * Sobrescritas manuais, para quando nem a wiki resolve. Mantido vazio de
 * propósito: com a wiki como fonte primária nenhum caso do catálogo atual
 * precisa de alias. Se um item novo escapar, o lugar dele é aqui.
 */
const CX_ALIAS = {};

const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const league = getArg("--league");
const apply = args.includes("--apply");

if (!league) {
  console.error("uso: node scripts/resolve-product-metadata.mjs --league <Liga> [--apply]");
  process.exit(1);
}

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

async function getJson(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

/** Extrai o caminho do asset embutido no blob base64 do campo `image`. */
function pathFromImage(image) {
  if (!image || !image.includes("/gen/image/")) return null;
  const blob = image.split("/gen/image/")[1].split("/")[0];
  try {
    const meta = JSON.parse(Buffer.from(blob, "base64").toString("utf8"));
    const entry = (Array.isArray(meta) ? meta : []).find((x) => x && x.f);
    return entry ? `Metadata/Items/${entry.f.replace(/^2DItems\//, "")}` : null;
  } catch {
    return null;
  }
}

/**
 * Mapa nome -> caminhos, da PoE Wiki (Cargo API).
 *
 * Um mesmo nome pode ter mais de um `metadata_id` na wiki; devolvemos todos e o
 * chamador escolhe o que tem mercado no CX. Paginado de 500 em 500.
 */
async function fetchWikiNameMap() {
  const byName = new Map();
  let offset = 0;
  for (;;) {
    const params = new URLSearchParams({
      action: "cargoquery",
      format: "json",
      tables: "items",
      fields: "items.name,items.metadata_id",
      where: 'items.metadata_id IS NOT NULL AND items.metadata_id!=""',
      limit: "500",
      offset: String(offset),
    });
    const data = await getJson(`${WIKI_API}?${params}`);
    const rows = data.cargoquery || [];
    if (rows.length === 0) break;
    for (const row of rows) {
      const title = row.title || {};
      const id = title["metadata id"];
      // A wiki devolve HTML escapado ("Dead Man&#039;s Sulphur").
      const name = title.name && decodeEntities(title.name);
      if (!id || !name) continue;
      const key = norm(name);
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key).push(id);
    }
    offset += rows.length;
    if (rows.length < 500) break;
  }
  return byName;
}

function decodeEntities(text) {
  return text
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Caminhos que realmente tiveram mercado na liga, numa janela de horas. */
async function cxPaths(leagueName, hours = 24) {
  const now = Math.floor(Date.now() / 1000);
  const latest = now - (now % 3600) - 3600;
  const paths = new Set();
  for (let k = 0; k < hours; k++) {
    try {
      const payload = await getJson(`${CX_URL}/${latest - 3600 * k}`);
      for (const m of payload.markets || []) {
        if (m.league !== leagueName) continue;
        for (const c of m.market_pair || []) paths.add(c);
      }
    } catch {
      // hora sem digest publicado; segue
    }
  }
  return paths;
}

async function main() {
  console.log(`Resolvendo metadata_id para a liga "${league}"...\n`);

  const [wiki, repoe, ninja, ggg, inCx] = await Promise.all([
    fetchWikiNameMap(),
    getJson(REPOE_URL).catch(() => ({})),
    getJson(`${NINJA_URL}?league=${encodeURIComponent(league)}&type=Currency`).catch(() => ({})),
    getJson(STATIC_URL).catch(() => ({})),
    cxPaths(league),
  ]);
  console.log(`  mercados distintos no CX (24h): ${inCx.size}`);
  console.log(`  mapa da wiki: ${wiki.size} nomes`);

  // nome normalizado -> lista de caminhos candidatos, em ordem de confiança.
  // A wiki vem primeiro por ser a única que usa a variante do CX.
  const byName = new Map();
  const add = (name, p) => {
    if (!name || !p) return;
    const key = norm(name);
    if (!byName.has(key)) byName.set(key, []);
    const list = byName.get(key);
    if (!list.includes(p)) list.push(p);
  };
  for (const [name, p] of Object.entries(CX_ALIAS)) add(name, p);
  for (const [key, paths] of wiki) {
    if (!byName.has(key)) byName.set(key, []);
    for (const p of paths) if (!byName.get(key).includes(p)) byName.get(key).push(p);
  }
  for (const [p, v] of Object.entries(repoe)) if (v && v.name) add(v.name, p);
  for (const item of ninja.items || []) add(item.name, pathFromImage(item.image));
  for (const group of ggg.result || []) {
    for (const e of group.entries || []) add(e.text, pathFromImage(e.image));
  }
  console.log(`  mapa nome->metadata combinado: ${byName.size} entradas\n`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, metadata_id")
    .eq("league", league);
  if (error) throw error;

  const resolved = [];
  const orphans = [];
  for (const product of products) {
    const candidates = byName.get(norm(product.name)) || [];
    // Entre os caminhos possíveis do item, vale o que tem mercado no CX — é
    // exatamente aqui que a variante da wiki ganha da variante do RePoE.
    const traded = candidates.find((c) => inCx.has(c));
    if (traded) resolved.push({ product, candidate: traded });
    else orphans.push({ product, candidate: candidates[0] });
  }

  console.log(`produtos: ${products.length}`);
  console.log(`  resolvidos e com mercado no CX : ${resolved.length}`);
  console.log(`  sem mercado no CX (vao pro poe.ninja ou pro manual): ${orphans.length}\n`);
  for (const { product, candidate } of orphans) {
    console.log(`   ${product.name.padEnd(32)} ${candidate ? candidate.replace("Metadata/Items/", "") : "(sem metadata)"}`);
  }

  if (!apply) {
    console.log(`\n(dry-run — nada foi gravado. Rode com --apply para persistir.)`);
    return;
  }

  let written = 0;
  for (const { product, candidate } of resolved) {
    if (product.metadata_id === candidate) continue;
    const { error: upErr } = await supabase
      .from("products")
      .update({ metadata_id: candidate })
      .eq("id", product.id);
    if (upErr) throw upErr;
    written++;
  }
  console.log(`\nmetadata_id gravado em ${written} produtos.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
