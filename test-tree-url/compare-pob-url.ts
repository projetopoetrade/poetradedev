import { inflateSync } from "zlib";
import { JSDOM } from "jsdom";

const pobCode = `eNrFXGtz27YS_Vz_Coxm7kw79UOkqIc9djuyLT86dqIrOUnvpwxMQRIaiFBJ0LbayX-_u-BDlCxQpKhpk0wimXsWuwfA7uLBnP_6NhPkhfkBl95FzTqu1wjzXDni3uSi9unp5qhT-_WXg_M-VdOP48uQC3zyy8EP5_ozmVNPTZn0Hrkn_Vs5uqh9kB6rEXdKfeoq5j-wFya6oZKPcsQuasoP4ekz9UZcpbKCBsEHOoPHX7hypzXywtlrJH__2P84eKqRGeXeULrfmLr1ZTgHS2tEoOqLWrtGaOAyb3S11BMpVtSfMPU5ca7xFZxLDaZ_ZA0Gj3447wu6YP5QUUUC-Oui1gVi6IRd0xn8DWZREYLy-nG73m62HdvqtJu1k1zoZegHahf8cM7YKIVYx0bBvs964zFzFX9hVz5XV1PqucvG2mbkBun6caOdK_8YCsXngjO_iG137xowij5JRcV1f5hRW29ZDfhjdyx7C0yqpQcmSRha00sBpJZvBKH3E48rthu2L3kgvd2dyyKN_l2FQsDULCQ7YAHzX6jiq1aZdcvZM_d2oe6RevRKBgX6ByX7zIeJrEoBhsyVMPfLtlES-cDHrLhkKT9iQFlrdvOjNywqV1rxbgYNIDIWkxzKUBSUVJno5JgnwZ9ZwVbLJHjN3oqpWxG0LZPkvbf0oWnn6MsK5ui7Zi8Sp_J2YnRA6d31U0nbah43681Wp33qtJ1TY46ZLgLuUvFI3_gsnEFYf6Lf2LLBRidnqE6myoPAZMLa9YYJe8N9tgPsSorRLrAplYEJ17HMMYV7d1DPdF03hJJnkUKc3Omb6djTnBrAPUPhe88tFhQ-eb4O7dnSwawfEQOYq1iqPAtWFLJsJJ7yS2C9nt_WhHlxg4tiDj0w5k5vgeIBVUsD7eNObsZZGmR1cslF4ULkouAmcs36VxElmELgZqYax1YeaDNXkKeNXPU85k8WwylnIuNTu1NEPrHuis6LQDXdWXwh2lcbLDV6stDNzJhLReqPimWusja90CAbqJ1tfEXyxUYog-IWACO2XtObVw7yD1w3iHKwrj-T4TJvOk0n14dIvJALSZqJ1ksDNgrdlbxmbChdAF0KWCMWdSRFgZ1ClIJ2laLut2s5mhSmTTdSCrFq3zCczyGa4HgoqgDzJ5T6PFMzHTmd7dIfYTRnp3U9L9MWb2ApXbiBtHoo3soapLgvmP7Xm2kVES_cRNqhjxAvZpAO9CL_UWaCzfFp29g_sMArtFrTggVXjX35CsZPcaMkKCcNldIyMRlN8Zn316Kw_hXxQg30vBFUXTAbCrexjtjUzBOfQTQNgmuqKBnF5fVn6nPqKUvvPQWM-u70AXr_hgrxDMHgopb9KX5bA9oIRP3nJ3rvDD_1qa8WIBgo7unlOIQWIWpkOJWv3dELmvkkpQguamMqApjydD5n3ij5qrV9kIoFaDZqTr6cX0lvzCeERvtC-suQKTRBe5j-hPBR8kNNlsumME2ZTzy9kTZ0JXg0xGgH3Hrh7Jn5iR8bAcxjs4Xe9FuKdxyzPHjqfiutP5njyc5aArRtJwc7TxPeNXRRFEMTZFKtG9vE3a_15hrbQPEuXiLfrm8DZEN2gmoWAZVjIvIIftLHNU7qjhmA82EDa1ZzSxtpxZMi6pbT2AJKKowE07JOO6fbnMmG78L9k90CTekuOviKcre0b72TOqetAn1UejwgaIfx8C7ZFmnQjQIJVHrKp-KJTyBByNBTxflcrfqKWhzwCRcfxzojQfjQob9o-IjrSynEgHrZJttFZlrhKZNuleMeMPPZSIc5zc6QifH7WXR-koZlnSaib_jxyWcsjuVIdRrG8QtR8DBzyGG3MRHhDhz1F93lycg9BHqPi_i8Bb81wAQJyQfXsY5dP7ROm-3DZttuOYftxulho2Gftg6tTqfVOmw6jtPGY5hAwUonKmQCTHJ0tYF6nEk-DR70hx-mSs2Ds5OT19fX4zlVUzlmbxCAj105O5kDCDw6Cr5xIY7QjZMu_LqcPHYv-cK9bP0-DroPf0yml78Fk25XKz5JNJ9Hx0FBzD8WYT4HZ2ImkRlNIlKHH4bYSJCQiF_ifEgC6atbNgsuF1AyJUdUAWZgof4bUsHVAh-nOXhF_gbXl2s75CM2ptD5IPMQHVF50p-lu2eRbiznIz1Pizl2QffhIYuMG04YPU8sjvN1VEdEPuHH-xlqI-wN_9FVxUqNcK_AXhIGLNqa_cLoXHrafz0iIlJQKOUETYR66ZpDV0NV5qKJmhltDYpmK4cBlDhqcUYG3UHv4AN7JShwcAlFFelDTSRIF2YDUwc9PT_0wyufjhUbnRHUetD32Zi_nRE8jMv5MgzHRb5o2gfszzPSbh8ANYK7XAVnxDr4G0JFcAbrKEgwLjucUY9-_9vHKHBWP25-_9HpHDVbP_2HcM_1GQ3YiODOCtHrfObrEo3gJoIec1C56wBCtAKs3pu1TP9AB6Gnq4TZeYRd-QvIsIJcMqEOvgBv0h_9o2ydbmILBqUeAIdMb6l8DfSeSpa2n39s1Y869Z-IkhAi9Cgn0f4LiTZgdqarkUfXkLo-H4O1QNkt9Z8PosLhjDhNJ_58CX0Y771B1EGf4ookEoq_bJDKWn9GTu2D7H7Se_kBGzFY0v0DYzsODGfErh_EIfCM3B6lv7PdaW_qzgmbff_Zwq7SkkSOCSxhyGcKLOqAQjC47dxjTl6P3WKC9MgVuDCh7OAOUuG_zVmGL2sjX1D54lqdikNf10VYLa4O_s6RhTEDGEUie4k8GaTyu9PZzKWTzbjHCWTfV-AvDOjo32XTOPbs9cAr-DiKvodUb6V9vwVOVEAaHYLb_mQOjvSw4iJ3XBUFW04UrVfBRZjPkbA39g1mYmM6zS6ph0JCzgZE_xkqF6yYouowwhBItfjwfpSpk02QKIcuAdY2wB0Tsyygvg0QG2WXgFzK0YIkC7YE1diGuhXyBSv2Es1IlZF3tskPYBmTJbdeCGCXBTTKk2uR7vMiCDDY6rlDmmVpWFfQ2oMRZTyPOq-KFVjfrOOdXbwYvtJ5JUOWo3ddjbXDvNloj70fe8oMkxtYjn0r2fCGgeXsi4LWvvq2UZqEfczQfUwwq7TlO7Ffga8oW1Sxe7OGRsnAsBS3d2uwVTmWNSs73dxD5zn7CRx7ij9O1WhSndTKAa1RMUdZVQ2wKg_NfUSFfcSzveWGnfP-HpyoHh6diiNqH3Gi8rSoXvyV0oBL01KI3PHT2JeifXRFc1_GWBXHlb2visvaT_ZolB4g1r48sCtSWb7m3BNnrV0HU-XpvDfumxW5b5Xmfh-zuHqWbuyLwPf5JdqISo4I9cGOvu9BhRtE21PePFTJKSnu536NzhnfnY-uSM544H59DsdjfO-qRgLl6zfAejc3vaun-8-9GDJk-koeCcLnIPp4UfvM2aveOL5minIR1IgrhaDzgKUXVfSWWHyEJQCXo01L3S3vWmzWtRQwa-q9MV-BF1-o7_qcGe1Kn28xKmoQr3ri_SCTNnwZyawoujh4RQMVXUU1MKWvjZi14LUFozv4MAd7P5tTYWw5frqFCYVHlnPm4uELnhLmdzkecEZSObykt-eN_R3f0zDr0G93mRRED83g6B0tEzp-msOqfj3MyGr01Ay_Zi41-h49NIPT283SA5pMWlKpHE0fpKcHOUyaLhd4imHs2Z5gqYhZ4Ue8-BDfFjBpeoTIk4jkThyfP4fKPI0zEjlc6VcvDAzhMzM0erHA4AM-y4lEK_fsDYRmZcyqorvpxkCWB42Oo4z8xbd-crog3uU30B89zSEhuQpm8D9-nDNJdPztvkg-im5sGabLmlhewIAkW12NvtRdXc36Le_qGnVFZOzv-KkZ_klxPOfboCW6IlNICU6qahpwblXT8MQ9V4U-21nBYL0SWWIH-TVIei15Izh5mhc54tvKO2uI7lTvDNcX7HZG6_h_Hd8fyUsAqUyOIxKqOSg4qMqZHAV1DVXoXYf-PlRpFzcHpSVTpXRFaXUja6U1RsEifpcxL55EIlsUQV1wl1N5FtOUvgVxx6jAl-OlqKbw3TubVZThy1zhnHqjRN3HTfX-sh8KsidVADr1vf9rvEtWlUN9jfW9IrNd5yfJClFfJsU1G_lLytn_8HXPdvu4Vbcbpy3HaiVvMQyVj2tUlPkdr_AfO42W3WqcNlp5twO1fHzr0dLnN-cn6_93yP8BHZDMeg==`;

const officialUrl = `https://www.pathofexile.com/passive-skill-tree/3.27.0g/AAAABgMABgLjB6UsnEmyghDfsAUX8hgjGC0YVoNTAA==`;

// Decode PoB
function decodePob(code: string) {
  code = code.trim().replace(/-/g, "+").replace(/_/g, "/");
  const missing = code.length % 4;
  if (missing) code += "=".repeat(4 - missing);
  const xmlBuffer = inflateSync(Buffer.from(code, "base64"));
  return xmlBuffer.toString("utf-8");
}

// Parse nodes from PoB XML
function parseNodesFromPob(xml: string): string[] {
  const dom = new JSDOM(xml, { contentType: "text/xml" });
  const doc = dom.window.document;
  const spec = doc.querySelector("Tree Spec");
  if (!spec) return [];
  const nodesStr = spec.getAttribute("nodes") || "";
  return nodesStr.split(",").filter(Boolean);
}

// Decode official URL
function base64UrlToBuffer(base64Url: string): Buffer {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

function decodeOfficialUrl(url: string) {
  const match = url.match(
    /passive-skill-tree\/(?:[\d.]+[a-z]?\/)?([A-Za-z0-9_-]+)/,
  );
  if (!match) throw new Error("URL inválida");

  const buffer = base64UrlToBuffer(match[1]);
  console.log("\n=== Official URL Buffer ===");
  console.log("Size:", buffer.length, "bytes");
  console.log("Hex:", buffer.toString("hex"));

  let offset = 0;
  const version = buffer.readUInt32BE(offset);
  offset += 4;
  const classId = buffer.readUInt8(offset++);
  const ascendancyId = buffer.readUInt8(offset++);
  const hashCount = buffer.readUInt8(offset++);

  const hashes: number[] = [];
  for (let i = 0; i < hashCount; i++) {
    hashes.push(buffer.readUInt16BE(offset));
    offset += 2;
  }

  return { version, classId, ascendancyId, hashCount, hashes };
}

// Main
console.log("=== Decoding PoB ===");
const xml = decodePob(pobCode);
const pobNodes = parseNodesFromPob(xml);
console.log("Nodes from PoB:", pobNodes);
console.log("Count:", pobNodes.length);

const decoded = decodeOfficialUrl(officialUrl);
console.log("\n=== Decoded Official URL ===");
console.log("Version:", decoded.version);
console.log("Class ID:", decoded.classId);
console.log("Ascendancy ID:", decoded.ascendancyId);
console.log("Hash Count:", decoded.hashCount);
console.log("Hashes:", decoded.hashes);

console.log("\n=== Comparison ===");
console.log("PoB nodes:", pobNodes);
console.log("URL hashes:", decoded.hashes);

// Check if they match (same count?)
console.log("\nPoB count:", pobNodes.length);
console.log("URL count:", decoded.hashes.length);

// Try to find correlation
console.log("\n=== Trying to find correlation ===");
const pobAsNumbers = pobNodes.map((n) => parseInt(n, 10));
console.log("PoB as numbers:", pobAsNumbers);
console.log("URL hashes:", decoded.hashes);

// Check if URL hashes are in PoB nodes
const urlHashesInPob = decoded.hashes.every((h) => pobAsNumbers.includes(h));
console.log("All URL hashes in PoB nodes?", urlHashesInPob);

// Check overlap
const overlap = decoded.hashes.filter((h) => pobAsNumbers.includes(h));
console.log("Overlap:", overlap);
