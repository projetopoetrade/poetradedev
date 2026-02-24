/**
 * Path of Exile Passive Skill Tree URL Encoder/Decoder
 *
 * Formato da URL oficial:
 * https://www.pathofexile.com/passive-skill-tree/<base64_encoded_data>
 *
 * Estrutura binária (versão 5):
 * - uint32: versão do link (5)
 * - uint8: classe (0-6)
 * - uint8: ascendancy
 * - uint8: fullscreen flag
 * - uint8: contagem de hashes (n)
 * - uint16[n]: hashes dos nodes
 * - uint8: contagem de extended hashes (m)
 * - uint16[m]: extended hashes (cluster jewels, etc)
 */

// Mapeamento de classes
const CLASS_IDS: Record<string, number> = {
  Scion: 0,
  Marauder: 1,
  Ranger: 2,
  Witch: 3,
  Duelist: 4,
  Shadow: 5,
  Templar: 6,
};

const ID_TO_CLASS = Object.fromEntries(
  Object.entries(CLASS_IDS).map(([k, v]) => [v, k]),
);

// Mapeamento de ascendancies (simplificado)
const ASCENDANCY_IDS: Record<string, number> = {
  None: 0,
  Juggernaut: 1,
  Berserker: 2,
  Chieftain: 3,
  Deadeye: 4,
  Raider: 5,
  Pathfinder: 6,
  Necromancer: 7,
  Elementalist: 8,
  Occultist: 9,
  Slayer: 10,
  Gladiator: 11,
  Champion: 12,
  Assassin: 13,
  Saboteur: 14,
  Trickster: 15,
  Inquisitor: 16,
  Hierophant: 17,
  Guardian: 18,
  Ascendant: 19,
};

function base64UrlToBuffer(base64Url: string): Buffer {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

function bufferToBase64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

interface DecodedTree {
  version: number;
  classId: number;
  className: string;
  ascendancyId: number;
  fullscreen: number;
  hashes: number[];
  extendedHashes: number[];
}

function decodeTreeUrl(url: string): DecodedTree {
  // Suporta URLs com versão: /passive-skill-tree/3.27.0g/AAA... ou sem: /passive-skill-tree/AAA...
  const match = url.match(
    /passive-skill-tree\/(?:[\d.]+[a-z]?\/)?([A-Za-z0-9_-]+)/,
  );
  if (!match) throw new Error("URL inválida");

  const buffer = base64UrlToBuffer(match[1]);
  let offset = 0;

  console.log("Buffer size:", buffer.length);
  console.log("Buffer hex:", buffer.toString("hex"));

  const version = buffer.readUInt32BE(offset);
  offset += 4;

  const classId = buffer.readUInt8(offset++);
  const ascendancyId = buffer.readUInt8(offset++);

  let hashes: number[] = [];
  let extendedHashes: number[] = [];

  if (version >= 6) {
    // PoE2 format: version + class + asc + hash_count + hashes
    const hashCount = buffer.readUInt8(offset++);
    console.log(
      "V6 - Class:",
      classId,
      "Asc:",
      ascendancyId,
      "HashCount:",
      hashCount,
    );

    for (let i = 0; i < hashCount && offset + 1 < buffer.length; i++) {
      hashes.push(buffer.readUInt16BE(offset));
      offset += 2;
    }

    // Resto parece ser dados extras
    console.log("Remaining bytes:", buffer.length - offset);
  } else if (version >= 5) {
    const fullscreen = buffer.readUInt8(offset++);
    const hashCount = buffer.readUInt8(offset++);
    console.log(
      "V5 - Class:",
      classId,
      "Asc:",
      ascendancyId,
      "FS:",
      fullscreen,
      "HashCount:",
      hashCount,
    );

    for (let i = 0; i < hashCount && offset + 1 < buffer.length; i++) {
      hashes.push(buffer.readUInt16BE(offset));
      offset += 2;
    }

    if (offset < buffer.length) {
      const extendedCount = buffer.readUInt8(offset++);
      for (let i = 0; i < extendedCount && offset + 1 < buffer.length; i++) {
        extendedHashes.push(buffer.readUInt16BE(offset));
        offset += 2;
      }
    }
  } else {
    // Versão antiga
    while (offset + 1 < buffer.length) {
      hashes.push(buffer.readUInt16BE(offset));
      offset += 2;
    }
  }

  return {
    version,
    classId,
    className: ID_TO_CLASS[classId] || "Unknown",
    ascendancyId,
    fullscreen: 0,
    hashes,
    extendedHashes,
  };
}

function encodeTreeUrl(
  classId: number,
  ascendancyId: number,
  hashes: number[],
  extendedHashes: number[] = [],
  fullscreen: number = 0,
): string {
  const version = 5;

  // Calcular tamanho do buffer
  const size =
    4 + 1 + 1 + 1 + 1 + hashes.length * 2 + 1 + extendedHashes.length * 2;
  const buffer = Buffer.alloc(size);

  let offset = 0;

  // Versão em big endian
  buffer.writeUInt32BE(version, offset);
  offset += 4;

  buffer.writeUInt8(classId, offset++);
  buffer.writeUInt8(ascendancyId, offset++);
  buffer.writeUInt8(fullscreen, offset++);
  buffer.writeUInt8(hashes.length, offset++);

  for (const hash of hashes) {
    buffer.writeUInt16BE(hash, offset);
    offset += 2;
  }

  buffer.writeUInt8(extendedHashes.length, offset++);

  for (const hash of extendedHashes) {
    buffer.writeUInt16BE(hash, offset);
    offset += 2;
  }

  const encoded = bufferToBase64Url(buffer);
  return `https://www.pathofexile.com/passive-skill-tree/${encoded}`;
}

// Testes
console.log("=== Teste 1: Encode simples ===\n");

// Criar uma URL simples com alguns nodes (Witch = 3, Sem ascendancy = 0)
const simpleNodes = [33619, 6189, 6230, 6130, 6179];
const simpleUrl = encodeTreeUrl(3, 0, simpleNodes);
console.log("Nodes:", simpleNodes);
console.log("URL gerada:", simpleUrl);

console.log("\n=== Teste 2: Decode da URL gerada ===\n");

try {
  const decoded = decodeTreeUrl(simpleUrl);
  console.log("Versão:", decoded.version);
  console.log("Classe:", decoded.className, `(ID: ${decoded.classId})`);
  console.log("Ascendancy ID:", decoded.ascendancyId);
  console.log("Nodes:", decoded.hashes);
  console.log(
    "Nodes são iguais?",
    JSON.stringify(simpleNodes) === JSON.stringify(decoded.hashes),
  );
} catch (e) {
  console.error("Erro:", e);
}

console.log("\n=== Teste 3: URL real do site oficial (PoE2) ===\n");

// URL de uma build real do PoE2
const testUrl =
  "https://www.pathofexile.com/passive-skill-tree/3.27.0g/AAAABgMACQLjB6UQWCycSbJ2EYIQr5vfsAAA";

try {
  const decoded = decodeTreeUrl(testUrl);
  console.log("Versão:", decoded.version);
  console.log("Classe:", decoded.className, `(ID: ${decoded.classId})`);
  console.log("Ascendancy ID:", decoded.ascendancyId);
  console.log("Nodes alocados:", decoded.hashes.length);
  console.log("Hashes:", decoded.hashes);

  console.log("\n=== Re-encode da URL ===\n");
  const reencoded = encodeTreeUrl(
    decoded.classId,
    decoded.ascendancyId,
    decoded.hashes,
  );
  console.log("URL re-encodada:", reencoded);
} catch (e) {
  console.error("Erro:", e);
}

console.log("\n=== Teste 4: Buscar URL atualizada ===");
console.log("Precisamos de uma URL atualizada do site oficial para testar.");
console.log("Acesse: https://www.pathofexile.com/passive-skill-tree");
console.log("Selecione alguns nodes e copie a URL.");
