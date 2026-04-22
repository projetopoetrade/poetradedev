import crypto from "crypto";

/**
 * Shareable-link hash for a raw PoB export. Derived from SHA256 then
 * truncated into a base62-10 string so it fits comfortably in a URL
 * without drifting between `share` and `pobbin` callsites.
 *
 * Must match the indexing of the `pob_builds.pob_hash` column — any
 * change here implies a data backfill.
 */

const BASE62_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function toBase62(buffer: Buffer): string {
  let num = BigInt("0x" + buffer.toString("hex"));
  let result = "";
  const zero = BigInt(0);
  const sixtyTwo = BigInt(62);
  while (num > zero) {
    result = BASE62_CHARS[Number(num % sixtyTwo)] + result;
    num = num / sixtyTwo;
  }
  return result;
}

export function generatePobShortHash(pobCode: string): string {
  const hash = crypto.createHash("sha256").update(pobCode).digest();
  return toBase62(hash).slice(0, 10);
}
