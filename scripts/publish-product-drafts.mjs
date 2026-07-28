/**
 * Publica os rascunhos de produto criados por `generate-product-copy.mjs`.
 *
 * Publicar no Sanity é mover o documento de `drafts.<id>` para `<id>`: o
 * conteúdo é o mesmo, o que muda é o id. O rascunho é apagado no fim, na mesma
 * transação, para não deixar as duas versões divergindo.
 *
 * Escopo restrito a `drafts.product-*` de propósito — o dataset pode ter
 * rascunhos de post ou de build em edição, e publicar aquilo não é decisão
 * deste script.
 *
 * Uso:
 *   node scripts/publish-product-drafts.mjs           (lista)
 *   node scripts/publish-product-drafts.mjs --apply
 */
import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const apply = process.argv.includes("--apply");

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-05-21",
  token: process.env.SANITY_API_KEY,
  useCdn: false,
  // Sem isto a consulta não enxerga rascunho nenhum: a API os esconde por
  // padrão, e o script parece não ter gravado nada.
  perspective: "raw",
});

const drafts = await sanity.fetch(
  `*[_type=="product" && _id match "drafts.product-*"]|order(name asc)`,
);

console.log(`rascunhos de produto encontrados: ${drafts.length}`);
if (drafts.length === 0) process.exit(0);

for (const d of drafts) {
  const liveId = d._id.replace(/^drafts\./, "");
  console.log(`  ${(d.name || "?").padEnd(32)} ${d._id} -> ${liveId}`);
}

if (!apply) {
  console.log("\n(dry-run — nada publicado. Use --apply.)");
  process.exit(0);
}

let ok = 0;
for (const d of drafts) {
  const liveId = d._id.replace(/^drafts\./, "");
  const { _id, _rev, _createdAt, _updatedAt, ...doc } = d;
  await sanity
    .transaction()
    .createOrReplace({ ...doc, _id: liveId })
    .delete(_id)
    .commit();
  ok++;
}

console.log(`\n${ok} publicados.`);
