/**
 * Placeholder grammar:
 *   {{kind:value}}                  — no modifier
 *   {{kind:value|modifier}}         — with modifier
 *
 * Values are greedy up to `|` or `}}` so multi-word names work:
 *   {{price:Kaom's Heart|divine}}   — value = "Kaom's Heart", modifier = "divine"
 *
 * Kind is lowercase ASCII. Unknown kinds are ignored (fall back to plain text).
 */

export interface Placeholder {
  kind: string;
  value: string;
  modifier?: string;
  raw: string;
  index: number;
  length: number;
}

const PLACEHOLDER_REGEX = /\{\{([a-z]+):([^|}\n]+?)(?:\|([^}\n]+))?\}\}/gi;

export function parsePlaceholders(text: string): Placeholder[] {
  if (!text || typeof text !== 'string') return [];
  const out: Placeholder[] = [];
  PLACEHOLDER_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PLACEHOLDER_REGEX.exec(text)) !== null) {
    out.push({
      kind: match[1].toLowerCase(),
      value: match[2].trim(),
      modifier: match[3]?.trim(),
      raw: match[0],
      index: match.index,
      length: match[0].length,
    });
  }
  return out;
}

/** Slugify a display name to a URL slug. Mirrors the site's product slug convention. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
