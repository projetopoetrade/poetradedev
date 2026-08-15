/**
 * Migra seoTitle/metaDescription dos produtos no Sanity de intenção
 * transacional ("Buy X | PoE Currency") para intenção de preço.
 *
 * Motivo (GSC, 18/jul–14/ago/2026): as páginas de produto rankeiam em posição
 * 8–12 para buscas informacionais — "tainted fusing poe", "foulborn exalted
 * orb", "portal scroll" — e convertem a ~0,4%. tailoring-orb: 431 impressões,
 * posição 12,0, zero cliques. O snippet diz "Buy" para quem está perguntando
 * "quanto vale".
 *
 * O título PT usa o nome em inglês de propósito: no GSC, 100% das queries de
 * produto vindas do Brasil usam o nome em inglês. O nome traduzido
 * ("Orbe de Costura") não casa com busca nenhuma.
 *
 * Uso:
 *   node scripts/migrate-product-seo-titles.mjs          # dry-run (padrão)
 *   node scripts/migrate-product-seo-titles.mjs --apply  # grava no Sanity
 *   node scripts/migrate-product-seo-titles.mjs --revert <backup.json>
 *
 * O backup dos valores atuais é sempre escrito antes de qualquer gravação.
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@sanity/client";

// ─── env ──────────────────────────────────────────────────────────────────────
// .env.local tem valores que quebram parsers estritos; lemos só o que precisamos.
const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  env[m[1]] = v;
}

const token = env.SANITY_API_KEY;
const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2023-05-03",
  useCdn: false,
  token,
});

// ─── padrão de título ─────────────────────────────────────────────────────────

const gameLabel = (gameVersion) =>
  gameVersion === "path-of-exile-2" ? "PoE 2" : "PoE 1";

const gameFull = (gameVersion) =>
  gameVersion === "path-of-exile-2" ? "Path of Exile 2" : "Path of Exile";

const buildSeo = (name, gameVersion) => ({
  seoTitle: {
    en: `${name} ${gameLabel(gameVersion)} — Price & Where to Buy | Path of Trade`,
    pt_br: `${name} ${gameLabel(gameVersion)} — Preço e Onde Comprar | Path of Trade`,
  },
  metaDescription: {
    en: `Current ${name} price in ${gameFull(gameVersion)}: live market value, price history, and where to buy with fast, secure in-game delivery.`,
    pt_br: `Preço atual do ${name} em ${gameFull(gameVersion)}: valor de mercado ao vivo, histórico de preço e onde comprar com entrega rápida e segura.`,
  },
});

// ─── revert ───────────────────────────────────────────────────────────────────

async function revert(backupPath) {
  const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  let tx = client.transaction();
  for (const doc of backup.documents) {
    tx = tx.patch(doc._id, (p) =>
      p.set({ seoTitle: doc.seoTitle, metaDescription: doc.metaDescription })
    );
  }
  await tx.commit();
  console.log(`Revertidos ${backup.documents.length} documentos a partir de ${backupPath}`);
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  const revertIdx = args.indexOf("--revert");
  if (revertIdx !== -1) {
    const p = args[revertIdx + 1];
    if (!p) throw new Error("--revert exige o caminho do arquivo de backup");
    if (!token) throw new Error("SANITY_API_KEY ausente no .env.local");
    return revert(p);
  }

  const apply = args.includes("--apply");

  const docs = await client.fetch(
    `*[_type == "product" && defined(seoTitle.en)]{
      _id, name, gameVersion, seoTitle, metaDescription
    } | order(name asc)`
  );

  console.log(`${docs.length} produtos com seoTitle no Sanity.\n`);

  const changes = docs
    .map((doc) => ({ doc, next: buildSeo(doc.name, doc.gameVersion) }))
    .filter(({ doc, next }) => doc.seoTitle?.en !== next.seoTitle.en);

  console.log(`${changes.length} precisam mudar.\n`);
  for (const { doc, next } of changes.slice(0, 5)) {
    console.log(`  ${doc.name}`);
    console.log(`    antes:  ${doc.seoTitle?.en}`);
    console.log(`    depois: ${next.seoTitle.en}\n`);
  }
  if (changes.length > 5) console.log(`  … e mais ${changes.length - 5}.\n`);

  if (!apply) {
    console.log("Dry-run. Rode com --apply para gravar.");
    return;
  }
  if (!token) throw new Error("SANITY_API_KEY ausente no .env.local");

  // Backup antes de qualquer escrita — sempre, e com os valores íntegros.
  const stamp = new Date().toISOString().slice(0, 10);
  const backupPath = path.join("scripts", `seo-title-backup-${stamp}.json`);
  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      {
        migratedAt: new Date().toISOString(),
        note: "Valores anteriores de seoTitle/metaDescription. Reverter com --revert <este arquivo>.",
        documents: changes.map(({ doc }) => ({
          _id: doc._id,
          name: doc.name,
          seoTitle: doc.seoTitle,
          metaDescription: doc.metaDescription,
        })),
      },
      null,
      2
    ),
    "utf8"
  );
  console.log(`Backup: ${backupPath}`);

  // Lotes de 50 — o endpoint de mutations rejeita transações muito grandes.
  const BATCH = 50;
  let done = 0;
  for (let i = 0; i < changes.length; i += BATCH) {
    let tx = client.transaction();
    for (const { doc, next } of changes.slice(i, i + BATCH)) {
      tx = tx.patch(doc._id, (p) =>
        p.set({ seoTitle: next.seoTitle, metaDescription: next.metaDescription })
      );
    }
    await tx.commit();
    done += Math.min(BATCH, changes.length - i);
    console.log(`  ${done}/${changes.length}`);
  }

  console.log(`\nPronto. ${done} produtos migrados.`);
  console.log(`Reverter: node scripts/migrate-product-seo-titles.mjs --revert ${backupPath}`);
}

main().catch((e) => {
  console.error("Falhou:", e.message);
  process.exit(1);
});
