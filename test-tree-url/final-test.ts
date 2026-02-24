import { inflateSync } from "zlib";
import { JSDOM } from "jsdom";

/**
 * Path of Exile Passive Skill Tree URL Encoder
 *
 * Converte nodes do PoB para URL oficial do site da GGG.
 *
 * Formato PoE2 (versão 6):
 * - uint32BE: versão (6)
 * - uint8: classe
 * - uint8: ascendancy
 * - uint8: contagem de hashes
 * - uint16BE[n]: hashes dos nodes alocados
 *
 * IMPORTANTE: O nó inicial da classe NÃO é incluído na URL!
 */

// Class mapping
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
  0: 53387, // Scion
  1: 54446, // Marauder
  2: 54445, // Ranger
  3: 54447, // Witch
  4: 54444, // Duelist
  5: 54443, // Shadow
  6: 54442, // Templar
};

function bufferToBase64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function encodeTreeUrl(
  classId: number,
  ascendancyId: number,
  hashes: number[],
  version: number = 6,
): string {
  const size = 4 + 1 + 1 + 1 + hashes.length * 2;
  const buffer = Buffer.alloc(size);
  let offset = 0;

  buffer.writeUInt32BE(version, offset);
  offset += 4;
  buffer.writeUInt8(classId, offset++);
  buffer.writeUInt8(ascendancyId, offset++);
  buffer.writeUInt8(hashes.length, offset++);

  for (const hash of hashes) {
    buffer.writeUInt16BE(hash, offset);
    offset += 2;
  }

  const encoded = bufferToBase64Url(buffer);
  return `https://www.pathofexile.com/passive-skill-tree/${encoded}`;
}

function decodePob(code: string): string {
  code = code.trim().replace(/-/g, "+").replace(/_/g, "/");
  const missing = code.length % 4;
  if (missing) code += "=".repeat(4 - missing);
  return inflateSync(Buffer.from(code, "base64")).toString("utf-8");
}

function parsePobData(xml: string) {
  const dom = new JSDOM(xml, { contentType: "text/xml" });
  const doc = dom.window.document;

  const buildNode = doc.querySelector("Build");
  const className = buildNode?.getAttribute("className") || "";
  const ascendancyName = buildNode?.getAttribute("ascendClassName") || "";

  const spec = doc.querySelector("Tree Spec");
  const nodesStr = spec?.getAttribute("nodes") || "";
  const nodeIds = nodesStr
    .split(",")
    .filter(Boolean)
    .map((n: string) => parseInt(n, 10));

  return { className, ascendancyName, nodeIds };
}

function pobNodesToOfficialUrl(
  className: string,
  ascendancyName: string,
  nodeIds: number[],
): string {
  const classId = CLASS_IDS[className];
  if (classId === undefined)
    throw new Error(`Classe desconhecida: ${className}`);

  const startNode = CLASS_START_NODES[classId];

  // Remove o nó inicial da classe (não vai na URL) e ORDENA
  const hashes = nodeIds.filter((id) => id !== startNode).sort((a, b) => a - b);

  return encodeTreeUrl(classId, 0, hashes);
}

// Test with the user's PoB
const pobCode = `eNrFXGtz27YS_Vz_Coxm7kw79UOkqIc9djuyLT86dqIrOUnvpwxMQRIaiFBJ0LbayX-_u-BDlCxQpKhpk0wimXsWuwfA7uLBnP_6NhPkhfkBl95FzTqu1wjzXDni3uSi9unp5qhT-_WXg_M-VdOP48uQC3zyy8EP5_ozmVNPTZn0Hrkn_Vs5uqh9kB6rEXdKfeoq5j-wFya6oZKPcsQuasoP4ekz9UZcpbKCBsEHOoPHX7hypzXywtlrJH__2P84eKqRGeXeULrfmLr1ZTgHS2tEoOqLWrtGaOAyb3S11BMpVtSfMPU5ca7xFZxLDaZ_ZA0Gj3447wu6YP5QUUUC-Oui1gVi6IRd0xn8DWZREYLy-nG73m62HdvqtJu1k1zoZegHahf8cM7YKIVYx0bBvs964zFzFX9hVz5XV1PqucvG2mbkBun6caOdK_8YCsXngjO_iG137xowij5JRcV1f5hRW29ZDfhjdyx7C0yqpQcmSRha00sBpJZvBKH3E48rthu2L3kgvd2dyyKN_l2FQsDULCQ7YAHzX6jiq1aZdcvZM_d2oe6RevRKBgX6ByX7zIeJrEoBhsyVMPfLtlES-cDHrLhkKT9iQFlrdvOjNywqV1rxbgYNIDIWkxzKUBSUVJno5JgnwZ9ZwVbLJHjN3oqpWxG0LZPkvbf0oWnn6MsK5ui7Zi8Sp_J2YnRA6d31U0nbah43681Wp33qtJ1TY46ZLgLuUvFI3_gsnEFYf6Lf2LLBRidnqE6myoPAZMLa9YYJe8N9tgPsSorRLrAplYEJ17HMMYV7d1DPdF03hJJnkUKc3Omb6djTnBrAPUPhe88tFhQ-eb4O7dnSwawfEQOYq1iqPAtWFLJsJJ7yS2C9nt_WhHlxg4tiDj0w5k5vgeIBVUsD7eNObsZZGmR1cslF4ULkouAmcs36VxElmELgZqYax1YeaDNXkKeNXPU85k8WwylnIuNTu1NEPrHuis6LQDXdWXwh2lcbLDV6stDNzJhLReqPimWusja90CAbqJ1tfEXyxUYog-IWACO2XtObVw7yD1w3iHKwrj-T4TJvOk0n14dIvJALSZqJ1ksDNgrdlbxmbChdAF0KWCMWdSRFgZ1ClIJ2laLut2s5mhSmTTdSCrFq3zCczyGa4HgoqgDzJ5T6PFMzHTmd7dIfYTRnp3U9L9MWb2ApXbiBtHoo3soapLgvmP7Xm2kVES_cRNqhjxAvZpAO9CL_UWaCzfFp29g_sMArtFrTggVXjX35CsZPcaMkKCcNldIyMRlN8Zn316Kw_hXxQg30vBFUXTAbCrexjtjUzBOfQTQNgmuqKBnF5fVn6nPqKUvvPQWM-u70AXr_hgrxDMHgopb9KX5bA9oIRP3nJ3rvDD_1qa8WIBgo7unlOIQWIWpkOJWv3dELmvkkpQguamMqApjydD5n3ij5qrV9kIoFaDZqTr6cX0lvzCeERvtC-suQKTRBe5j-hPBR8kNNlsumME2ZTzy9kTZ0JXg0xGgH3Hrh7Jn5iR8bAcxjs4Xe9FuKdxyzPHjqfiutP5njyc5aArRtJwc7TxPeNXRRFEMTZFKtG9vE3a_15hrbQPEuXiLfrm8DZEN2gmoWAZVjIvIIftLHNU7qjhmA82EDa1ZzSxtpxZMi6pbT2AJKKowE07JOO6fbnMmG78L9k90CTekuOviKcre0b72TOqetAn1UejwgaIfx8C7ZFmnQjQIJVHrKp-KJTyBByNBTxflcrfqKWhzwCRcfxzojQfjQob9o-IjrSynEgHrZJttFZlrhKZNuleMeMPPZSIc5zc6QifH7WXR-koZlnSaib_jxyWcsjuVIdRrG8QtR8DBzyGG3MRHhDhz1F93lycg9BHqPi_i8Bb81wAQJyQfXsY5dP7ROm-3DZttuOYftxulho2Gftg6tTqfVOmw6jtPGY5hAwUonKmQCTHJ0tYF6nEk-DR70hx-mSs2Ds5OT19fX4zlVUzlmbxCAj105O5kDCDw6Cr5xIY7QjZMu_LqcPHYv-cK9bP0-DroPf0yml78Fk25XKz5JNJ9Hx0FBzD8WYT4HZ2ImkRlNIlKHH4bYSJCQiF_ifEgC6atbNgsuF1AyJUdUAWZgof4bUsHVAh-nOXhF_gbXl2s75CM2ptD5IPMQHVF50p-lu2eRbiznIz1Pizl2QffhIYuMG04YPU8sjvN1VEdEPuHH-xlqI-wN_9FVxUqNcK_AXhIGLNqa_cLoXHrafz0iIlJQKOUETYR66ZpDV0NV5qKJmhltDYpmK4cBlDhqcUYG3UHv4AN7JShwcAlFFelDTSRIF2YDUwc9PT_0wyufjhUbnRHUetD32Zi_nRE8jMv5MgzHRb5o2gfszzPSbh8ANYK7XAVnxDr4G0JFcAbrKEgwLjucUY9-_9vHKHBWP25-_9HpHDVbP_2HcM_1GQ3YiODOCtHrfObrEo3gJoIec1C56wBCtAKs3pu1TP9AB6Gnq4TZeYRd-QvIsIJcMqEOvgBv0h_9o2ydbmILBqUeAIdMb6l8DfSeSpa2n39s1Y869Z-IkhAi9Cgn0f4LiTZgdqarkUfXkLo-H4O1QNkt9Z8PosLhjDhNJ_58CX0Y771B1EGf4ookEoq_bJDKWn9GTu2D7H7Se_kBGzFY0v0DYzsODGfErh_EIfCM3B6lv7PdaW_qzgmbff_Zwq7SkkSOCSxhyGcKLOqAQjC47dxjTl6P3WKC9MgVuDCh7OAOUuG_zVmGL2sjX1D54lqdikNf10VYLa4O_s6RhTEDGEUie4k8GaTyu9PZzKWTzbjHCWTfV-AvDOjo32XTOPbs9cAr-DiKvodUb6V9vwVOVEAaHYLb_mQOjvSw4iJ3XBUFW04UrVfBRZjPkbA39g1mYmM6zS6ph0JCzgZE_xkqF6yYouowwhBItfjwfpSpk02QKIcuAdY2wB0Tsyygvg0QG2WXgFzK0YIkC7YE1diGuhXyBSv2Es1IlZF3tskPYBmTJbdeCGCXBTTKk2uR7vMiCDDY6rlDmmVpWFfQ2oMRZTyPOq-KFVjfrOOdXbwYvtJ5JUOWo3ddjbXDvNloj70fe8oMkxtYjn0r2fCGgeXsi4LWvvq2UZqEfczQfUwwq7TlO7Ffga8oW1Sxe7OGRsnAsBS3d2uwVTmWNSs73dxD5zn7CRx7ij9O1WhSndTKAa1RMUdZVQ2wKg_NfUSFfcSzveWGnfP-HpyoHh6diiNqH3Gi8rSoXvyV0oBL01KI3PHT2JeifXRFc1_GWBXHlb2visvaT_ZolB4g1r48sCtSWb7m3BNnrV0HU-XpvDfumxW5b5Xmfh-zuHqWbuyLwPf5JdqISo4I9cGOvu9BhRtE21PePFTJKSnu536NzhnfnY-uSM544H59DsdjfO-qRgLl6zfAejc3vaun-8-9GDJk-koeCcLnIPp4UfvM2aveOL5minIR1IgrhaDzgKUXVfSWWHyEJQCXo01L3S3vWmzWtRQwa-q9MV-BF1-o7_qcGe1Kn28xKmoQr3ri_SCTNnwZyawoujh4RQMVXUU1MKWvjZi14LUFozv4MAd7P5tTYWw5frqFCYVHlnPm4uELnhLmdzkecEZSObykt-eN_R3f0zDr0G93mRRED83g6B0tEzp-msOqfj3MyGr01Ay_Zi41-h49NIPT283SA5pMWlKpHE0fpKcHOUyaLhd4imHs2Z5gqYhZ4Ue8-BDfFjBpeoTIk4jkThyfP4fKPI0zEjlc6VcvDAzhMzM0erHA4AM-y4lEK_fsDYRmZcyqorvpxkCWB42Oo4z8xbd-crog3uU30B89zSEhuQpm8D9-nDNJdPztvkg-im5sGabLmlhewIAkW12NvtRdXc36Le_qGnVFZOzv-KkZ_klxPOfboCW6IlNICU6qahpwblXT8MQ9V4U-21nBYL0SWWIH-TVIei15Izh5mhc54tvKO2uI7lTvDNcX7HZG6_h_Hd8fyUsAqUyOIxKqOSg4qMqZHAV1DVXoXYf-PlRpFzcHpSVTpXRFaXUja6U1RsEifpcxL55EIlsUQV1wl1N5FtOUvgVxx6jAl-OlqKbw3TubVZThy1zhnHqjRN3HTfX-sh8KsidVADr1vf9rvEtWlUN9jfW9IrNd5yfJClFfJsU1G_lLytn_8HXPdvu4Vbcbpy3HaiVvMQyVj2tUlPkdr_AfO42W3WqcNlp5twO1fHzr0dLnN-cn6_93yP8BHZDMeg==`;

const officialUrl = `https://www.pathofexile.com/passive-skill-tree/3.27.0g/AAAABgMABgLjB6UsnEmyghDfsAUX8hgjGC0YVoNTAA==`;

console.log("=== Gerando URL do PoB ===\n");

const xml = decodePob(pobCode);
const pobData = parsePobData(xml);

console.log("Classe:", pobData.className);
console.log("Ascendancy:", pobData.ascendancyName);
console.log("Nodes do PoB:", pobData.nodeIds);
console.log("Total:", pobData.nodeIds.length);

const generatedUrl = pobNodesToOfficialUrl(
  pobData.className,
  pobData.ascendancyName,
  pobData.nodeIds,
);

console.log("\n=== Comparação ===\n");
console.log("URL do PoB:", generatedUrl);
console.log("URL oficial:", officialUrl);
console.log("Match:", generatedUrl === officialUrl);

// Decode both to compare
function base64UrlToBuffer(base64Url: string): Buffer {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

function decodeUrl(url: string) {
  const match = url.match(
    /passive-skill-tree\/(?:[\d.]+[a-z]?\/)?([A-Za-z0-9_-]+)/,
  );
  if (!match) return null;
  const buffer = base64UrlToBuffer(match[1]);
  let offset = 4;
  const classId = buffer.readUInt8(offset++);
  const ascId = buffer.readUInt8(offset++);
  const count = buffer.readUInt8(offset++);
  const hashes: number[] = [];
  for (let i = 0; i < count; i++) {
    hashes.push(buffer.readUInt16BE(offset));
    offset += 2;
  }
  return { classId, ascId, hashes };
}

console.log("\n=== Hashes comparados ===");
const genDecoded = decodeUrl(generatedUrl);
const offDecoded = decodeUrl(officialUrl);
console.log("Gerados:", genDecoded?.hashes);
console.log("Oficiais:", offDecoded?.hashes);
console.log(
  "Iguais:",
  JSON.stringify(genDecoded?.hashes) === JSON.stringify(offDecoded?.hashes),
);
