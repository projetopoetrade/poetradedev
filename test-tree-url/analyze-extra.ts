// Analisar dados extras na URL oficial

function base64UrlToBuffer(base64Url: string): Buffer {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

const generated = "AAAABgMABgLjB6UsnEmyghDfsA";
const official = "AAAABgMABgLjB6UsnEmyghDfsAUX8hgjGC0YVoNTAA";

console.log("=== Generated URL buffer ===");
const genBuf = base64UrlToBuffer(generated);
console.log("Size:", genBuf.length);
console.log("Hex:", genBuf.toString("hex"));
console.log(
  "Bytes:",
  Array.from(genBuf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" "),
);

console.log("\n=== Official URL buffer ===");
const offBuf = base64UrlToBuffer(official);
console.log("Size:", offBuf.length);
console.log("Hex:", offBuf.toString("hex"));
console.log(
  "Bytes:",
  Array.from(offBuf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" "),
);

console.log("\n=== Extra bytes (after position 19) ===");
const extraBytes = offBuf.slice(19);
console.log("Extra size:", extraBytes.length);
console.log("Extra hex:", extraBytes.toString("hex"));
console.log(
  "Extra bytes:",
  Array.from(extraBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" "),
);

// Parse extra bytes
let offset = 19;
console.log("\n=== Parsing extra bytes ===");
console.log(
  "Byte 19:",
  offBuf[offset],
  "(0x" + offBuf[offset].toString(16) + ")",
);
offset++;

// Maybe it's a count followed by something
const nextByte = offBuf[offset];
console.log("Byte 20:", nextByte, "(0x" + nextByte.toString(16) + ")");

// Try reading as uint16
if (offset + 1 < offBuf.length) {
  const val = offBuf.readUInt16BE(offset);
  console.log("Bytes 20-21 as uint16BE:", val);
  offset += 2;
}

// Remaining
console.log("Remaining:", offBuf.slice(offset).toString("hex"));
console.log("Remaining as uint16s:");
while (offset + 1 < offBuf.length) {
  console.log("  ", offBuf.readUInt16BE(offset));
  offset += 2;
}
