import Image from "next/image";
import type { PobItem, PobSocketedJewel } from "@/lib/pob-parser";
import {
  POE_COLORS,
  RARITY_NAME_COLOR_HSL,
  MOD_COLOR_HSL,
  SOCKET_COLOR_HSL,
  INFLUENCE_ICONS,
  HEADER_TEXTURES,
  PASSIVE_RARITIES,
} from "@/components/poe/poe-colors";
import { getEffectiveItemIconUrl } from "@/components/poe/poe-icon-utils";


// ─── SocketDisplay ─────────────────────────────────────────────────────────────

export function SocketDisplay({ sockets }: { sockets: string }) {
  const groups = sockets.split(" ").filter(Boolean);
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center justify-center">
          {group.split("-").map((sock, si, arr) => (
            <div key={si} className="flex items-center">
              <div
                className="w-4 h-4 relative shadow-lg bg-[#1e2530]"
                style={{
                  border: `3px solid hsla(${SOCKET_COLOR_HSL[sock] ?? "0, 0%, 50%"}, 0.5)`,
                  borderRadius:
                    si === 0 || si === arr.length - 1 ? "4px" : "9999px",
                  transform: "rotate(45deg)",
                }}
                title={sock}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(circle, hsla(${SOCKET_COLOR_HSL[sock] ?? "0, 0%, 50%"}, 0.3) 0%, transparent 70%)`,
                  }}
                />
              </div>
              {si < arr.length - 1 && (
                <div
                  className="w-3 h-1 -mx-0.5"
                  style={{
                    backgroundColor: `hsla(${POE_COLORS.link}, 0.6)`,
                    border: `1px solid hsla(${POE_COLORS.link}, 0.8)`,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── ItemTooltip ───────────────────────────────────────────────────────────────

export function ItemTooltip({
  item,
  compact = false,
}: {
  item: PobItem;
  compact?: boolean;
}) {
  const nameColorHsl =
    RARITY_NAME_COLOR_HSL[item.rarity] ?? RARITY_NAME_COLOR_HSL.Normal;
  const headerTextures = HEADER_TEXTURES[item.rarity];
  // Passive-tree nodes (notable/keystone/mastery/etc.) render with a dark
  // slate gradient header — matches the gem tooltip and the in-game passive
  // tooltip. Name colour stays rarity-driven so Notables read warm-gold and
  // Ascendancy nodes read muted-purple against the dark backdrop.
  const isPassive = PASSIVE_RARITIES.has(item.rarity);
  // Currencies use plain off-white descriptive text rather than the
  // implicit/explicit blue used for rare-mod stat lines.
  const isCurrency = item.rarity === "Currency";
  const currencyTextColor = "#c8c8c8";

  const influences = item.influences ?? [];
  const isFracturedItem = Boolean(item.fractured);

  const leftInfluenceKey = isFracturedItem ? "fractured" : influences[0];
  const rightInfluenceKey = isFracturedItem
    ? "fractured"
    : (influences[1] ?? influences[0]);

  const leftInfluenceIcon =
    leftInfluenceKey && INFLUENCE_ICONS[leftInfluenceKey];
  const rightInfluenceIcon =
    rightInfluenceKey && INFLUENCE_ICONS[rightInfluenceKey];

  // Enchant em bloco separado; crafted continua na lista de explicits.
  const enchantMods = [...item.implicits, ...item.explicits].filter(
    (m) => m.type === "enchant",
  );
  const implicitMods = item.implicits.filter((m) => m.type !== "enchant");
  const explicitMods = item.explicits;

  const hasEnchant = enchantMods.length > 0;
  const hasImplicit = implicitMods.length > 0;
  const hasExplicit = explicitMods.length > 0;
  const effectiveIconUrl = getEffectiveItemIconUrl(item);

  const w        = compact ? "w-[min(320px,88vw)]" : "w-[min(440px,92vw)]";
  const baseText = compact ? "text-[12px]"         : "text-[15px]";
  const hdrPad   = compact ? "px-3 py-0.5"   : "px-6 py-1.5";
  const bodyPad  = compact ? "px-3 py-1"     : "px-6 py-2";
  const nameSz   = compact
    ? (item.rarity === "Magic" ? "text-[11px]" : "text-[13px]")
    : (item.rarity === "Magic" ? "text-[15px]" : "text-[18px]");
  const baseSz   = compact ? "text-[10px]" : "text-[13px]";
  const bodyGap  = compact ? "space-y-1" : "space-y-2";
  const implicitPadTop = "pt-0";
  const implicitLineClass = compact
    ? "leading-tight first-letter:text-[12px]"
    : "leading-tight first-letter:text-[15px]";

  return (
    <div className={`not-prose ${w} ${baseText} leading-snug overflow-hidden rounded shadow-xl bg-black/80 font-fontin`}>
      <div
        className={`${hdrPad} text-center relative ${isPassive ? "border-b border-slate-700/60" : ""}`}
        style={
          headerTextures
            ? {
                background:
                  `url("${headerTextures.left}") top left / contain no-repeat, ` +
                  `url("${headerTextures.right}") top right / contain no-repeat, ` +
                  `url("${headerTextures.middle}") top left / contain repeat-x`,
              }
            : isPassive
              ? {
                  // Dark slate gradient — matches the gem tooltip so passive
                  // citations sit visually alongside gem citations in prose.
                  background:
                    "linear-gradient(to bottom, rgba(28,30,38,0.95), rgba(10,12,18,0.95))",
                }
              : {
                  backgroundImage: `linear-gradient(to bottom, hsl(${nameColorHsl}), #3a2a1b)`,
                }
        }
      >
        <p
          className={`font-semibold leading-tight tracking-wide ${nameSz}`}
          style={{
            color: headerTextures
              ? headerTextures.textColor
              : `hsl(${nameColorHsl})`,
          }}
        >
          {item.name}
        </p>
        {item.baseName && item.baseName !== item.name && (
          <p className={`text-slate-200 ${baseSz} leading-tight`}>{item.baseName}</p>
        )}

        {leftInfluenceIcon && (
          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6">
            <Image
              src={leftInfluenceIcon}
              alt={leftInfluenceKey ?? "influence"}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        )}
        {rightInfluenceIcon && (
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6">
            <Image
              src={rightInfluenceIcon}
              alt={rightInfluenceKey ?? "influence"}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        )}
      </div>

      <div className={`${bodyPad} ${bodyGap} bg-black/80 text-center`}>
        {(item.quality ||
          item.itemLevel ||
          item.sockets ||
          item.armour ||
          item.evasion ||
          item.energyShield ||
          item.physDamage ||
          item.eleDamage) && (
          <div className="space-y-1.5 border-b border-slate-600/60 pb-2">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-0.5 text-slate-300 text-[12px]">
              {item.quality !== undefined && (
                <span>
                  Quality:{" "}
                  <span className="text-sky-300 font-semibold">
                    +{item.quality}%
                  </span>
                </span>
              )}
              {item.itemLevel !== undefined && (
                <span>
                  Item Level:{" "}
                  <span className="text-slate-100 font-semibold">
                    {item.itemLevel}
                  </span>
                </span>
              )}
            </div>

            {(item.physDamage || item.eleDamage || item.chaosDamage) &&
              item.aps !== undefined &&
              (() => {
                const aps = item.aps!;
                const pDPS = item.physDamage
                  ? ((item.physDamage[0] + item.physDamage[1]) / 2) * aps
                  : 0;
                const eDPS = item.eleDamage
                  ? ((item.eleDamage[0] + item.eleDamage[1]) / 2) * aps
                  : 0;
                const cDPS = item.chaosDamage
                  ? ((item.chaosDamage[0] + item.chaosDamage[1]) / 2) * aps
                  : 0;
                const totalDPS = pDPS + eDPS + cDPS;
                return (
                  <div className="mt-1 flex flex-col items-center gap-1 text-slate-300 text-[12px]">
                    {item.physDamage && (
                      <span>
                        Physical Damage:{" "}
                        <span className="text-slate-100 font-semibold">
                          {item.physDamage[0]}-{item.physDamage[1]}
                        </span>{" "}
                        ·{" "}
                        <span className="text-sky-300 font-semibold">
                          {pDPS.toFixed(1)} pDPS
                        </span>
                      </span>
                    )}
                    {item.eleDamage && (
                      <span>
                        Elemental Damage:{" "}
                        <span className="text-slate-100 font-semibold">
                          {item.eleDamage[0]}-{item.eleDamage[1]}
                        </span>{" "}
                        ·{" "}
                        <span className="text-orange-300 font-semibold">
                          {eDPS.toFixed(1)} eDPS
                        </span>
                      </span>
                    )}
                    {item.chaosDamage && (
                      <span>
                        Chaos Damage:{" "}
                        <span className="text-slate-100 font-semibold">
                          {item.chaosDamage[0]}-{item.chaosDamage[1]}
                        </span>{" "}
                        ·{" "}
                        <span className="text-purple-400 font-semibold">
                          {cDPS.toFixed(1)} cDPS
                        </span>
                      </span>
                    )}
                    <span>
                      Attacks per Second:{" "}
                      <span className="text-slate-100 font-semibold">
                        {aps.toFixed(2)}
                      </span>
                    </span>
                    {item.critChance !== undefined && (
                      <span>
                        Crit Chance:{" "}
                        <span className="text-slate-100 font-semibold">
                          {item.critChance.toFixed(2)}%
                        </span>
                      </span>
                    )}
                    <span className="border-t border-slate-600/50 pt-1 mt-0.5 w-full text-center">
                      <span className="text-yellow-300 font-bold">
                        {item.isEstimatedDps ? "~" : ""}{totalDPS.toFixed(1)} Total DPS
                      </span>
                      {pDPS > 0 && eDPS + cDPS > 0 && (
                        <span className="text-slate-500 ml-2">
                          ({pDPS.toFixed(0)} phys + {(eDPS + cDPS).toFixed(0)} ele/chaos)
                        </span>
                      )}
                    </span>
                    {item.isEstimatedDps && (
                      <span className="text-slate-500 text-[10px] italic w-full text-center">
                        estimated from base type
                      </span>
                    )}
                  </div>
                );
              })()}

            {(item.armour || item.evasion || item.energyShield) && (
              <div className="mt-1 flex flex-col items-center gap-1 text-slate-300 text-[12px]">
                {item.armour !== undefined && (
                  <span>
                    Armour:{" "}
                    <span className="text-sky-300 font-semibold">
                      {item.armour}
                    </span>
                  </span>
                )}
                {item.evasion !== undefined && (
                  <span>
                    Evasion Rating:{" "}
                    <span className="text-sky-300 font-semibold">
                      {item.evasion}
                    </span>
                  </span>
                )}
                {item.energyShield !== undefined && (
                  <span>
                    Energy Shield:{" "}
                    <span className="text-sky-300 font-semibold">
                      {item.energyShield}
                    </span>
                  </span>
                )}
              </div>
            )}

            {item.sockets && <SocketDisplay sockets={item.sockets} />}
          </div>
        )}

        {(item.requiredLevel || item.requiredStr || item.requiredDex || item.requiredInt) && (
          <div className="text-slate-400 text-[12px] leading-tight">
            Requires{" "}
            {[
              item.requiredLevel && <span key="lvl"><span className="text-slate-200 font-semibold">{item.requiredLevel}</span> Level</span>,
              item.requiredStr && <span key="str"><span className="text-slate-200 font-semibold">{item.requiredStr}</span> Str</span>,
              item.requiredDex && <span key="dex"><span className="text-slate-200 font-semibold">{item.requiredDex}</span> Dex</span>,
              item.requiredInt && <span key="int"><span className="text-slate-200 font-semibold">{item.requiredInt}</span> Int</span>,
            ]
              .filter(Boolean)
              .map((el, i, arr) => (
                <span key={`req-${i}`}>
                  {el}
                  {i < arr.length - 1 && <span className="text-slate-500">, </span>}
                </span>
              ))}
          </div>
        )}

        {hasEnchant && (
          <div className="pt-0.5">
            {enchantMods.map((mod, i) => (
              <p
                key={`enchant-${i}`}
                className="leading-tight first-letter:text-[13px]"
                style={{ color: `hsl(${MOD_COLOR_HSL[mod.type]})` }}
              >
                {mod.text}
              </p>
            ))}
          </div>
        )}

        {hasEnchant && hasImplicit && (
          <div className="mt-1 border-t border-slate-600/60 pt-1" />
        )}

        {hasImplicit && (
          <div className={`${hasEnchant ? "" : implicitPadTop}`}>
            {implicitMods.map((mod, i) => (
              <p
                key={`implicit-${i}`}
                className={implicitLineClass}
                style={{
                  color: isCurrency
                    ? currencyTextColor
                    : `hsl(${MOD_COLOR_HSL[mod.type]})`,
                }}
              >
                {mod.text}
              </p>
            ))}
          </div>
        )}

        {hasImplicit && hasExplicit && (
          <div className="flex items-center">
            <div className="flex-1 h-px bg-slate-600/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <div className="flex-1 h-px bg-slate-600/50" />
          </div>
        )}

        {hasExplicit && (
          <div>
            {explicitMods.map((mod, i) => (
              <p
                key={i}
                className={
                  compact
                    ? "leading-tight first-letter:text-[13px]"
                    : "leading-tight first-letter:text-[16px]"
                }
                style={{
                  color: isCurrency
                    ? currencyTextColor
                    : mod.type === "crafted"
                      ? "#ffffff"
                      : `hsl(${MOD_COLOR_HSL[mod.type]})`,
                }}
              >
                {mod.text}
              </p>
            ))}
          </div>
        )}

        {(item.corrupted || item.mirrored || item.split) && (
          <div className="border-t border-slate-600/70 pt-1.5 flex flex-col items-center gap-0.5">
            {item.mirrored && (
              <p className="text-[hsl(220,75%,70%)] font-semibold tracking-wide">
                Mirrored
              </p>
            )}
            {item.split && (
              <p className="text-[hsl(220,75%,70%)] font-semibold tracking-wide">
                Split
              </p>
            )}
            {item.corrupted && (
              <p className="text-red-500 font-semibold tracking-wide">
                Corrupted
              </p>
            )}
          </div>
        )}

        {effectiveIconUrl && false /* slot already shows icon */}
      </div>
    </div>
  );
}

// ─── JewelTooltip ──────────────────────────────────────────────────────────────

export function JewelTooltip({
  jewel,
  compact = false,
}: {
  jewel: PobSocketedJewel;
  compact?: boolean;
}) {
  const displayName =
    jewel.name === "New Item" ? (jewel.baseName ?? jewel.name) : jewel.name;

  const rarity = jewel.rarity || "Normal";
  const nameColorHsl =
    RARITY_NAME_COLOR_HSL[rarity] ?? RARITY_NAME_COLOR_HSL.Normal;
  const headerTextures = HEADER_TEXTURES[rarity];

  const implicits = jewel.implicits ?? [];
  const explicits = jewel.explicits ?? [];
  const hasImplicits = implicits.length > 0;
  const hasExplicits = explicits.length > 0;

  const w        = compact ? "w-[min(300px,88vw)]" : "w-[420px]";
  const baseText = compact ? "text-[12px]"          : "text-[14px]";
  const hdrPad   = compact ? "px-4 py-1"            : "px-6 py-1.5";
  const bodyPad  = compact ? "px-4 py-1.5"          : "px-6 py-2";
  const nameSz   = compact
    ? (rarity === "Magic" ? "text-[13px]" : "text-[16px]")
    : (rarity === "Magic" ? "text-[15px]" : "text-[20px]");
  const baseSz   = compact ? "text-[11px]" : "text-[13px]";

  return (
    <div className={`not-prose ${w} ${baseText} leading-snug overflow-hidden rounded shadow-xl bg-black/80 font-fontin`}>
      <div
        className={`${hdrPad} text-center relative`}
        style={
          headerTextures
            ? {
                background:
                  `url("${headerTextures.left}") top left / contain no-repeat, ` +
                  `url("${headerTextures.right}") top right / contain no-repeat, ` +
                  `url("${headerTextures.middle}") top left / contain repeat-x`,
              }
            : {
                backgroundImage: `linear-gradient(to bottom, hsl(${nameColorHsl}), #3a2a1b)`,
              }
        }
      >
        <p
          className={`font-semibold leading-tight tracking-wide ${nameSz}`}
          style={{
            color: headerTextures
              ? headerTextures.textColor
              : `hsl(${nameColorHsl})`,
          }}
        >
          {displayName}
        </p>
        {jewel.baseName &&
          jewel.baseName !== jewel.name &&
          jewel.name !== "New Item" && (
            <p className={`text-slate-200 ${baseSz} mt-0.5`}>
              {jewel.baseName}
            </p>
          )}
      </div>

      <div className={`${bodyPad} space-y-2 bg-black/80 text-center`}>
        {hasImplicits && (
          <div className="space-y-0.5">
            {implicits.map((mod, i) => (
              <p
                key={`implicit-${i}`}
                className="uppercase first-letter:text-[13px]"
                style={{ color: `hsl(${MOD_COLOR_HSL.crafted})` }}
              >
                {mod}
              </p>
            ))}
          </div>
        )}

        {hasImplicits && hasExplicits && (
          <div className="flex items-center">
            <div className="flex-1 h-px bg-slate-600/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <div className="flex-1 h-px bg-slate-600/50" />
          </div>
        )}

        {hasExplicits && (
          <div className="space-y-0.5">
            {explicits.map((mod, i) => (
              <p
                key={`explicit-${i}`}
                className="uppercase first-letter:text-[14px]"
                style={{ color: `hsl(${MOD_COLOR_HSL.normal})` }}
              >
                {mod}
              </p>
            ))}
          </div>
        )}

        {!hasImplicits && !hasExplicits && (
          <p className="text-slate-500 text-xs italic">No modifiers</p>
        )}
      </div>
    </div>
  );
}
