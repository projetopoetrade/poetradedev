const withNodes = "AAAABgMABgLjB6UsnEmyghDfsAUX8hgjGC0YVoNTAA";
const buf = Buffer.from(withNodes + "==", "base64");

console.log("Full hex:", buf.toString("hex"));
console.log("Size:", buf.length, "bytes\n");

let offset = 0;
const version = buf.readUInt32BE(offset);
offset += 4;
const classId = buf.readUInt8(offset++);
const ascId = buf.readUInt8(offset++);
const hashCount = buf.readUInt8(offset++);

console.log("Version:", version);
console.log("Class:", classId);
console.log("Ascendancy:", ascId);
console.log("Hash count:", hashCount);
console.log("Offset after header:", offset);

const hashes: number[] = [];
for (let i = 0; i < hashCount; i++) {
  hashes.push(buf.readUInt16BE(offset));
  offset += 2;
}
console.log("Hashes:", hashes);
console.log("Offset after hashes:", offset);

// Dados extras
console.log("\n=== Dados extras ===");
console.log("Remaining size:", buf.length - offset);
console.log("Remaining hex:", buf.slice(offset).toString("hex"));

// Primeiro byte extra
const extraByte1 = buf.readUInt8(offset++);
console.log("\nExtra byte 1:", extraByte1, "(count of something?)");

// Próximos como uint16
const extraCount = extraByte1;
const extraHashes: number[] = [];
for (let i = 0; i < extraCount && offset + 1 < buf.length; i++) {
  extraHashes.push(buf.readUInt16BE(offset));
  offset += 2;
}
console.log("Extra hashes:", extraHashes);

// Resto
console.log("Final offset:", offset);
console.log("Final remaining:", buf.slice(offset).toString("hex"));
