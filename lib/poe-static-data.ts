/**
 * Fetches and caches the official Path of Exile static data for items.
 * This resolves the issue where poe.ninja does not provide images for
 * certain items or where the image names are tracked variably in the CDN.
 */

let staticDataMap: Map<string, string> | null = null;
let staticDataExpiry = 0;

export async function getPoeStaticItemImages(): Promise<Map<string, string>> {
  const now = Date.now();
  if (staticDataMap && now < staticDataExpiry) {
    return staticDataMap;
  }

  const map = new Map<string, string>();

  // Add timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch("https://www.pathofexile.com/api/trade/data/static", {
      headers: {
        "User-Agent": "PathOfTrade/1.0 (pathoftrade.net)",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch static data: ${res.status}`);
    }

    const data = await res.json();
    
    // The data is structured as { result: [ { id, label, entries: [ { id, text, image } ] } ] }
    for (const group of data.result || []) {
      for (const entry of group.entries || []) {
        if (entry.text && entry.image) {
          // 1. Strict match key (original text)
          const nameLower = entry.text.toLowerCase().trim();
          map.set(nameLower, entry.image);
          
          // 2. Normalized match key (remove spaces/apostrophes)
          // This bridges the gap with poe.ninja names
          const normalizedName = nameLower.replace(/['\s]/g, "");
          if (!map.has(normalizedName)) {
            map.set(normalizedName, entry.image);
          }
          
          // 3. Fallback: also map by ID if different
          if (entry.id) {
            const normalizedId = entry.id.toLowerCase().trim();
            if (!map.has(normalizedId)) {
              map.set(normalizedId, entry.image);
            }
            const normalizedIdHard = normalizedId.replace(/['\s]/g, "");
            if (!map.has(normalizedIdHard)) {
              map.set(normalizedIdHard, entry.image);
            }
          }
        }
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error("[getPoeStaticItemImages] Fetch timed out after 8s");
    } else {
      console.error("[getPoeStaticItemImages] Error fetching PoE static data:", err);
    }
  } finally {
    clearTimeout(timeoutId);
  }

  if (map.size > 0) {
    staticDataMap = map;
    // Cache for 24 hours
    staticDataExpiry = now + 24 * 60 * 60 * 1000;
  }

  return map;
}
