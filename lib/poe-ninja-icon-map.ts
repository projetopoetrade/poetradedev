/**
 * Item icon cache — fetches the poe.ninja Standard-league overview for
 * uniques + base types and exposes a name → icon URL lookup. 24h in-memory
 * TTL per server instance (no Redis dependency on purpose; cold start
 * just refetches).
 *
 * Used by `/api/poe/item-icon` for `{{item:Name}}` placeholder rendering
 * and the PoB viewer's slot fallback path.
 */

let itemIconMap: Map<string, string> | null = null;
let iconCacheExpiry = 0;

const ICON_FETCH_TYPES = [
  "UniqueWeapon",
  "UniqueArmour",
  "UniqueAccessory",
  "UniqueFlask",
  "UniqueJewel",
  "BaseType",
];

export async function getItemIconMap(): Promise<Map<string, string>> {
  const now = Date.now();
  if (itemIconMap && now < iconCacheExpiry) return itemIconMap;

  const map = new Map<string, string>();
  await Promise.all(
    ICON_FETCH_TYPES.map(async (type) => {
      try {
        const res = await fetch(
          `https://poe.ninja/api/data/itemoverview?league=Standard&type=${type}`,
          { headers: { "User-Agent": "PathOfTrade/1.0 (pathoftrade.net)" } },
        );
        if (!res.ok) return;
        const data = await res.json();
        for (const item of data.lines || []) {
          if (item.name && item.icon) {
            map.set((item.name as string).toLowerCase(), item.icon as string);
          }
        }
      } catch {
        /* ignore icon fetch errors */
      }
    }),
  );

  itemIconMap = map;
  iconCacheExpiry = now + 24 * 60 * 60 * 1000;
  return map;
}
