/**
 * Converte markdown cru embutido em blocos de Portable Text para a estrutura
 * nativa do Sanity (styles, listItem, marks strong/em, annotations link).
 *
 * Motivo: 7 dos 34 posts publicados foram importados com o markdown dentro do
 * texto do bloco — "* **Persistence:** ..." num único span. O leitor vê os
 * asteriscos. Pior: quando um item de PoE é resolvido inline no meio da frase,
 * o renderer parte a string ali e o par de `**` fica órfão, produzindo
 * "…using an **" seguido de "** on the Atlas screen…". Isso não tem conserto
 * no renderer — o markdown cruza a fronteira de um elemento. A estrutura
 * precisa estar nos dados.
 *
 * Uso:
 *   node scripts/migrate-markdown-to-portabletext.mjs          # dry-run
 *   node scripts/migrate-markdown-to-portabletext.mjs --apply
 *   node scripts/migrate-markdown-to-portabletext.mjs --revert <backup.json>
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@sanity/client";

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

// ─── chaves ───────────────────────────────────────────────────────────────────
// Determinísticas a partir do _key do bloco de origem: rodar o script duas
// vezes produz o mesmo documento, e o diff no Studio fica legível.
let keyCounter = 0;
const nextKey = (base) => `${base}${(keyCounter++).toString(36)}`;

// ─── inline ───────────────────────────────────────────────────────────────────

const INLINE = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|(?<![*\w])\*([^*\n]+)\*(?![*\w])/g;

/**
 * Quebra o texto em spans com marks. Devolve também os markDefs dos links.
 */
function parseInline(text, base) {
  const children = [];
  const markDefs = [];
  const push = (t, marks) => {
    if (t) children.push({ _type: "span", _key: nextKey(base), text: t, marks });
  };

  let last = 0;
  let m;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(text)) !== null) {
    push(text.slice(last, m.index), []);
    if (m[1] !== undefined) {
      const defKey = nextKey(`${base}L`);
      markDefs.push({ _key: defKey, _type: "link", href: m[2], blank: true });
      push(m[1], [defKey]);
    } else if (m[3] !== undefined) {
      push(m[3], ["strong"]);
    } else if (m[4] !== undefined) {
      push(m[4], ["strong"]);
    } else if (m[5] !== undefined) {
      push(m[5], ["em"]);
    }
    last = INLINE.lastIndex;
  }
  push(text.slice(last), []);

  if (children.length === 0) push(text, []);
  return { children, markDefs };
}

/**
 * Um bloco de origem pode virar vários: o markdown importado empilha heading,
 * parágrafos e itens de lista num único bloco separados por \n.
 */
function convertBlock(block) {
  const raw = (block.children || []).map((c) => c.text || "").join("");
  const lines = raw.split("\n");

  // Nada de markdown estrutural nem inline → devolve como está.
  const hasMarkdown =
    /\*\*|__|(?<![*\w])\*[^*\n]+\*(?![*\w])|^\s*#{1,6}\s|^\s*[*-]\s|^\s*>\s|\[[^\]]+\]\([^)\s]+\)/m.test(raw);
  if (!hasMarkdown) return [block];

  const out = [];
  const base = (block._key || "b").slice(0, 6);

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;

    let style = "normal";
    let listItem;
    let content = t;

    const heading = t.match(/^(#{1,6})\s+(.*)$/);
    const bullet = t.match(/^[*-]\s+(.*)$/);
    const numbered = t.match(/^\d+\.\s+(.*)$/);
    const quote = t.match(/^>\s+(.*)$/);

    if (heading) {
      style = `h${Math.min(heading[1].length, 4)}`;
      content = heading[2];
    } else if (bullet) {
      listItem = "bullet";
      content = bullet[1];
    } else if (numbered) {
      // O schema só tem lista "bullet"; a numerada vira bullet preservando texto.
      listItem = "bullet";
      content = numbered[1];
    } else if (quote) {
      style = "blockquote";
      content = quote[1];
    }

    // Separador horizontal do markdown não tem equivalente no schema — descartar
    // é melhor que deixar "---" visível.
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(content)) continue;

    const { children, markDefs } = parseInline(content, base);
    out.push({
      _type: "block",
      _key: nextKey(base),
      style,
      ...(listItem ? { listItem, level: 1 } : {}),
      markDefs,
      children,
    });
  }

  return out.length > 0 ? out : [block];
}

/** Blocos com formatação real já aplicada ficam intocados. */
const isPlain = (block) =>
  (block.children || []).every((c) => !c.marks || c.marks.length === 0);

function convertBody(body) {
  const out = [];
  for (const node of body || []) {
    if (node._type !== "block" || !isPlain(node)) {
      out.push(node);
      continue;
    }
    out.push(...convertBlock(node));
  }
  return out;
}

// ─── revert ───────────────────────────────────────────────────────────────────

async function revert(backupPath) {
  const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  let tx = client.transaction();
  for (const doc of backup.documents) {
    tx = tx.patch(doc._id, (p) => p.set({ body: doc.body }));
  }
  await tx.commit();
  console.log(`Revertidos ${backup.documents.length} posts a partir de ${backupPath}`);
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

  const posts = await client.fetch(
    `*[_type == "post" && defined(slug.current) && !(_id in path("drafts.**"))]{
      _id, title, language, "slug": slug.current, body
    } | order(slug asc)`
  );

  const changed = [];
  for (const post of posts) {
    const before = post.body || [];
    const after = convertBody(before);
    if (JSON.stringify(before) === JSON.stringify(after)) continue;

    // Guarda de segurança: o texto visível não pode encolher além da remoção
    // dos marcadores de markdown. Se encolher muito, algo se perdeu.
    const plain = (b) =>
      (b || [])
        .filter((n) => n._type === "block")
        .map((n) => (n.children || []).map((c) => c.text || "").join(""))
        .join(" ")
        .replace(/[*#>_\-\[\]()]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    const lenBefore = plain(before).length;
    const lenAfter = plain(after).length;
    const ratio = lenBefore === 0 ? 1 : lenAfter / lenBefore;

    changed.push({ post, after, lenBefore, lenAfter, ratio });
  }

  console.log(`${posts.length} posts publicados · ${changed.length} com markdown cru\n`);
  for (const c of changed) {
    const flag = c.ratio < 0.97 ? "  ⚠ PERDA" : "";
    console.log(
      `  ${c.post.slug} (${c.post.language})` +
        `  blocos ${(c.post.body || []).length} → ${c.after.length}` +
        `  texto ${c.lenBefore} → ${c.lenAfter} (${(c.ratio * 100).toFixed(1)}%)${flag}`
    );
  }

  const perdas = changed.filter((c) => c.ratio < 0.97);
  if (perdas.length > 0) {
    console.log(`\nABORTADO: ${perdas.length} post(s) perderiam texto. Nada foi gravado.`);
    process.exit(1);
  }

  if (!apply) {
    console.log("\nDry-run. Rode com --apply para gravar.");
    return;
  }
  if (!token) throw new Error("SANITY_API_KEY ausente no .env.local");

  const stamp = new Date().toISOString().slice(0, 10);
  const backupPath = path.join("scripts", `post-body-backup-${stamp}.json`);
  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      {
        migratedAt: new Date().toISOString(),
        note: "Corpo anterior dos posts. Reverter com --revert <este arquivo>.",
        documents: changed.map((c) => ({
          _id: c.post._id,
          slug: c.post.slug,
          body: c.post.body,
        })),
      },
      null,
      2
    ),
    "utf8"
  );
  console.log(`\nBackup: ${backupPath}`);

  let tx = client.transaction();
  for (const c of changed) tx = tx.patch(c.post._id, (p) => p.set({ body: c.after }));
  await tx.commit();

  console.log(`Pronto. ${changed.length} posts migrados.`);
  console.log(`Reverter: node scripts/migrate-markdown-to-portabletext.mjs --revert ${backupPath}`);
}

main().catch((e) => {
  console.error("Falhou:", e.message);
  process.exit(1);
});
