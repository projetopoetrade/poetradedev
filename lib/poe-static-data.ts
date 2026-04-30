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

  try {
    const res = await fetch("https://www.pathofexile.com/api/trade/data/static", {
      headers: {
        "User-Agent": "PathOfTrade/1.0 (pathoftrade.net)",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch static data: ${res.status}`);
    }

    const data = await res.json();
    
    // The data is structured as { result: [ { id, label, entries: [ { id, text, image } ] } ] }
    for (const group of data.result || []) {
      for (const entry of group.entries || []) {
        if (entry.text && entry.image) {
          // Normalize the name to lowercase for easier matching
          // We map from the item's official display name to its image URL
          const normalizedName = entry.text.toLowerCase().trim();
          map.set(normalizedName, entry.image);
          
          // Fallback: also map by ID if different, to cover edge cases
          if (entry.id) {
            const normalizedId = entry.id.toLowerCase().trim();
            if (!map.has(normalizedId)) {
              map.set(normalizedId, entry.image);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("[getPoeStaticItemImages] Error fetching PoE static data:", err);
  }

  if (map.size > 0) {
    staticDataMap = map;
    // Cache for 24 hours
    staticDataExpiry = now + 24 * 60 * 60 * 1000;
  }

  return map;
}
