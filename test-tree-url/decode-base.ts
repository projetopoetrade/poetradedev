const base64 = "AAAABgMAAAAA".replace(/-/g, "+").replace(/_/g, "/");
const buf = Buffer.from(base64 + "==", "base64");
console.log("Size:", buf.length);
console.log("Hex:", buf.toString("hex"));
console.log(
  "Bytes:",
  Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" "),
);

let offset = 0;
const version = buf.readUInt32BE(offset);
offset += 4;
const classId = buf.readUInt8(offset++);
const ascId = buf.readUInt8(offset++);
const hashCount = buf.readUInt8(offset++);

console.log("\nVersion:", version);
console.log("Class ID:", classId);
console.log("Ascendancy ID:", ascId);
console.log("Hash count:", hashCount);
console.log("Remaining bytes:", buf.slice(offset).toString("hex"));

// Agora compara com a URL com nodes
const withNodes = "AAAABgMABgLjB6UsnEmyghDfsAUX8hgjGC0YVoNTAA";
const buf2 = Buffer.from(withNodes + "==", "base64");
console.log("\n=== URL com nodes ===");
console.log("Size:", buf2.length);
console.log("Hex:", buf2.toString("hex"));
