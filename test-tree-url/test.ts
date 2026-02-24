import { inflateSync } from "zlib";
import { JSDOM } from "jsdom";

const CLASS_IDS: Record<string, number> = {
  Scion: 0,
  Marauder: 1,
  Ranger: 2,
  Witch: 3,
  Duelist: 4,
  Shadow: 5,
  Templar: 6,
};

const CLASS_START_NODES: Record<number, number> = {
  0: 53387,
  1: 54446,
  2: 54445,
  3: 54447,
  4: 54444,
  5: 54443,
  6: 54442,
};

function bufferToBase64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function encodeTreeUrl(classId: number, hashes: number[]): string {
  const size = 4 + 1 + 1 + 1 + hashes.length * 2 + 2;
  const buffer = Buffer.alloc(size);
  let offset = 0;

  buffer.writeUInt32BE(6, offset);
  offset += 4;
  buffer.writeUInt8(classId, offset++);
  buffer.writeUInt8(0, offset++);
  buffer.writeUInt8(hashes.length, offset++);

  for (const hash of hashes.sort((a, b) => a - b)) {
    buffer.writeUInt16BE(hash, offset);
    offset += 2;
  }
  buffer.writeUInt16BE(0, offset);

  return `https://www.pathofexile.com/passive-skill-tree/${bufferToBase64Url(buffer)}`;
}

function decodePob(code: string): { className: string; nodeIds: number[] } {
  code = code.trim().replace(/-/g, "+").replace(/_/g, "/");
  const missing = code.length % 4;
  if (missing) code += "=".repeat(4 - missing);

  const xml = inflateSync(Buffer.from(code, "base64")).toString("utf-8");
  const doc = new JSDOM(xml, { contentType: "text/xml" }).window.document;

  const buildNode = doc.querySelector("Build");
  const className = buildNode?.getAttribute("className") || "";
  const nodesStr = doc.querySelector("Tree Spec")?.getAttribute("nodes") || "";
  const nodeIds = nodesStr
    .split(",")
    .filter(Boolean)
    .map((n: string) => parseInt(n, 10));

  return { className, nodeIds };
}

async function fetchPobFromUrl(url: string): Promise<string> {
  url = url.trim();
  if (url.includes("pobb.in")) {
    if (!url.includes("/pob/")) url = url.replace("pobb.in/", "pobb.in/pob/");
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    return await res.text();
  }
  if (url.includes("pastebin.com")) {
    if (!url.includes("/raw/"))
      url = url.replace("pastebin.com/", "pastebin.com/raw/");
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    return await res.text();
  }
  return url;
}

async function pobToUrl(pobCode: string): Promise<string> {
  // Se for URL, busca o conteúdo
  if (pobCode.startsWith("http")) {
    pobCode = await fetchPobFromUrl(pobCode);
  }

  const { className, nodeIds } = decodePob(pobCode);
  const classId = CLASS_IDS[className];
  if (classId === undefined)
    throw new Error(`Classe desconhecida: ${className}`);

  const startNode = CLASS_START_NODES[classId];
  const hashes = nodeIds.filter((id) => id !== startNode);

  return encodeTreeUrl(classId, hashes);
}

// CLI
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Uso: npx tsx test-tree-url/test.ts <pob-code>");
  console.log("     npx tsx test-tree-url/test.ts <url-pobb.in>");
  console.log("     npx tsx test-tree-url/test.ts <arquivo.pob>");
  console.log("");
  console.log("Exemplo:");
  console.log("  npx tsx test-tree-url/test.ts eNrFXGtz27YS...");
  console.log("  npx tsx test-tree-url/test.ts https://pobb.in/abc123");
  process.exit(1);
}

let pobCode = args[0];

// Se for um arquivo, lê o conteúdo
if (!pobCode.startsWith("eN") && !pobCode.startsWith("http")) {
  const fs = require("fs");
  if (fs.existsSync(pobCode)) {
    pobCode = fs.readFileSync(pobCode, "utf-8").trim();
  }
}

pobToUrl(pobCode).then(console.log).catch(console.error);
