import fs from 'fs';
import path from 'path';

/**
 * Fetches and caches the official Path of Exile static data for items.
 * Prioritizes local images downloaded via the maintenance script.
 */

let staticDataMap: Map<string, string> | null = null;
let staticDataExpiry = 0;

export async function getPoeStaticItemImages(): Promise<Map<string, string>> {
  const now = Date.now();
  if (staticDataMap && now < staticDataExpiry) {
    return staticDataMap;
  }

  const map = new Map<string, string>();

  // 1. Try to load from local mapping.json (mirror of PoE CDN)
  try {
    const mappingPath = path.join(process.cwd(), 'public/images/items/mapping.json');
    if (fs.existsSync(mappingPath)) {
      const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
      for (const [key, fileName] of Object.entries(mapping)) {
        // Return the local relative path for the frontend
        map.set(key.toLowerCase().trim(), `/images/items/${fileName}`);
        
        // Also map normalized key (lowercase, no spaces/apostrophes)
        const normalizedKey = key.toLowerCase().replace(/['\s]/g, "");
        if (!map.has(normalizedKey)) {
          map.set(normalizedKey, `/images/items/${fileName}`);
        }
      }
      console.log(`[getPoeStaticItemImages] Loaded ${Object.keys(mapping).length} local image mappings.`);
    }
  } catch (err) {
    console.error("[getPoeStaticItemImages] Error loading local mapping:", err);
  }

  // 2. If map is empty or we want to supplement it, fetch from official API
  // This ensures we have a fallback if the local mirror is incomplete
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch("https://www.pathofexile.com/api/trade/data/static", {
      headers: {
        "User-Agent": "PathOfTrade/1.0 (pathoftrade.net)",
      },
      signal: controller.signal,
    });

    if (res.ok) {
      const data = await res.json();
      for (const group of data.result || []) {
        for (const entry of group.entries || []) {
          if (entry.text && entry.image) {
            const nameLower = entry.text.toLowerCase().trim();
            const normalizedName = nameLower.replace(/['\s]/g, "");
            
            // Only add to map if not already present from local mapping
            if (!map.has(nameLower)) {
              map.set(nameLower, entry.image);
            }
            if (!map.has(normalizedName)) {
              map.set(normalizedName, entry.image);
            }
          }
        }
      }
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.error("[getPoeStaticItemImages] Fallback API fetch failed:", err);
    }
  } finally {
    clearTimeout(timeoutId);
  }

  if (map.size > 0) {
    staticDataMap = map;
    // Cache for 24 hours (less if we are frequently updating the mirror)
    staticDataExpiry = now + 24 * 60 * 60 * 1000;
  }

  return map;
}
