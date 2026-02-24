"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Sword, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PobBuildData, PobItem } from "@/lib/pob-parser";

interface Props {
  locale: string;
}

// ─── PoE.ninja CSS Variables (HSL) ────────────────────────────────────────────

const POE_COLORS = {
  rarity: {
    Unique: "26, 65%, 42%",
    Rare: "60, 100%, 73%",
    Magic: "240, 100%, 77%",
    Normal: "0, 0%, 78%",
  },
  socket: {
    R: "0, 100%, 50%", // Strength - Red
    G: "120, 100%, 40%", // Dexterity - Green
    B: "220, 100%, 60%", // Intelligence - Blue
    W: "0, 0%, 95%", // White
    A: "280, 70%, 60%", // Abyssal
  },
  mod: {
    normal: "240, 100%, 77%",
    crafted: "240, 100%, 85%",
    fractured: "44, 26%, 51%",
    enchant: "240, 100%, 85%",
    scourge: "20, 100%, 57%",
  },
  link: "0, 0%, 60%",
};

// ─── Rarity helpers ───────────────────────────────────────────────────────────

const RARITY_BORDER_HSL: Record<string, string> = {
  Unique: POE_COLORS.rarity.Unique,
  Rare: POE_COLORS.rarity.Rare,
  Magic: POE_COLORS.rarity.Magic,
  Normal: POE_COLORS.rarity.Normal,
};
const RARITY_NAME_COLOR_HSL: Record<string, string> = {
  Unique: POE_COLORS.rarity.Unique,
  Rare: POE_COLORS.rarity.Rare,
  Magic: POE_COLORS.rarity.Magic,
  Normal: POE_COLORS.rarity.Normal,
};
const MOD_COLOR_HSL: Record<string, string> = {
  normal: POE_COLORS.mod.normal,
  crafted: POE_COLORS.mod.crafted,
  fractured: POE_COLORS.mod.fractured,
  enchant: POE_COLORS.mod.enchant,
  scourge: POE_COLORS.mod.scourge,
};

// ─── Socket display (PoE.ninja diamond style) ─────────────────────────────────

const SOCKET_COLOR_HSL: Record<string, string> = {
  R: POE_COLORS.socket.R,
  G: POE_COLORS.socket.G,
  B: POE_COLORS.socket.B,
  W: POE_COLORS.socket.W,
  A: POE_COLORS.socket.A,
};

const INFLUENCE_ICONS: Record<string, string> = {
  shaper: "/pob-influence/shaper.webp",
  elder: "/pob-influence/elder.webp",
  crusader: "/pob-influence/crusader.webp",
  redeemer: "/pob-influence/redeemer.webp",
  hunter: "/pob-influence/hunter.webp",
  warlord: "/pob-influence/warlord.webp",
  fractured: "/pob-influence/fractured.webp",
};

const HEADER_TEXTURES: Record<
  string,
  | {
      left: string;
      middle: string;
      right: string;
      textColor: string;
    }
  | undefined
> = {
  Unique: {
    left: "/pob-headers/ItemsHeaderUniqueLeft.webp",
    middle: "/pob-headers/ItemsHeaderUniqueMiddle.webp",
    right: "/pob-headers/ItemsHeaderUniqueRight.webp",
    textColor: "#ffaf60",
  },
  Rare: {
    left: "/pob-headers/ItemsHeaderRareLeft.webp",
    middle: "/pob-headers/ItemsHeaderRareMiddle.webp",
    right: "/pob-headers/ItemsHeaderRareRight.webp",
    textColor: "#ffdd77",
  },
  Magic: {
    left: "/pob-headers/ItemsHeaderMagicLeft.webp",
    middle: "/pob-headers/ItemsHeaderMagicMiddle.webp",
    right: "/pob-headers/ItemsHeaderMagicRight.webp",
    textColor: "#b4b4ff",
  },
};

// Normaliza alguns nomes de slot vindos do PoB para bater com o grid
function normalizeSlotName(slot: string): string {
  if (slot === "Helmet") return "Helm";
  return slot;
}

function SocketDisplay({ sockets }: { sockets: string }) {
  const groups = sockets.split(" ").filter(Boolean);
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center">
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

// ─── Item tooltip (PoE style) ─────────────────────────────────────────────────

function ItemTooltip({ item }: { item: PobItem }) {
  const nameColorHsl =
    RARITY_NAME_COLOR_HSL[item.rarity] ?? RARITY_NAME_COLOR_HSL.Normal;
  const headerTextures = HEADER_TEXTURES[item.rarity];

  const influences = item.influences ?? [];
  const isFracturedItem = Boolean(item.fractured);

  const leftInfluenceKey = isFracturedItem
    ? "fractured"
    : influences[0];
  const rightInfluenceKey = isFracturedItem
    ? "fractured"
    : influences[1] ?? influences[0];

  const leftInfluenceIcon =
    leftInfluenceKey && INFLUENCE_ICONS[leftInfluenceKey];
  const rightInfluenceIcon =
    rightInfluenceKey && INFLUENCE_ICONS[rightInfluenceKey];

  // Enchant em bloco separado; crafted continua na lista de explicits,
  // apenas com cor diferenciada.
  const enchantMods = [...item.implicits, ...item.explicits].filter(
    (m) => m.type === "enchant",
  );
  const implicitMods = item.implicits.filter((m) => m.type !== "enchant");
  const explicitMods = item.explicits; // mantém crafted na ordem original

  const hasEnchant = enchantMods.length > 0;
  const hasImplicit = implicitMods.length > 0;
  const hasExplicit = explicitMods.length > 0;

  return (
    <div className="w-[420px] text-[12px] leading-snug overflow-hidden rounded shadow-xl bg-black/80 font-fontin">
      {/* Header: name + base type */}
      <div
        className="px-6 py-1.5 text-center relative"
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
          className="font-semibold text-[14px] leading-tight tracking-wide"
          style={{
            color: headerTextures ? headerTextures.textColor : `hsl(${nameColorHsl})`,
          }}
        >
          {item.name}
        </p>
        {item.baseName && item.baseName !== item.name && (
          <p className="text-slate-200 text-[10px] mt-0.5">{item.baseName}</p>
        )}
        {/* Slot label (ex: Helm, Ring, Boots) */}
        <p className="text-slate-300/80 text-[10px] mt-0.5">
          {item.slot}
        </p>

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

      <div className="px-4 py-3 space-y-2 bg-black/80">
        {/* Properties */}
        {(item.quality || item.itemLevel || item.sockets) && (
          <div className="space-y-1.5 border-b border-slate-600/60 pb-2">
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-slate-300 text-[11px]">
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
            {item.sockets && <SocketDisplay sockets={item.sockets} />}
          </div>
        )}

        {/* Enchant */}
        {hasEnchant && (
          <div className="pt-2 space-y-0.25">
            {enchantMods.map((mod, i) => (
              <p
                key={`enchant-${i}`}
                className="uppercase"
                style={{ color: `hsl(${MOD_COLOR_HSL[mod.type]})` }}
              >
                {mod.text}
              </p>
            ))}
          </div>
        )}

        {/* Implicits (não-enchant) */}
        {hasImplicit && (
          <div className={`${hasEnchant ? "border-t border-slate-600/60 pt-2 mt-1" : "pt-2"} space-y-0.25`}>
            {implicitMods.map((mod, i) => (
              <p
                key={`implicit-${i}`}
                className="uppercase"
                style={{ color: `hsl(${MOD_COLOR_HSL[mod.type]})` }}
              >
                {mod.text}
              </p>
            ))}
          </div>
        )}

        {/* Divider entre implicits e explicits */}
        {hasImplicit && hasExplicit && (
          <div className="flex items-center gap-1.5 py-0.5">
            <div className="flex-1 h-px bg-slate-600/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <div className="flex-1 h-px bg-slate-600/50" />
          </div>
        )}

        {/* Explicits (inclui crafted; crafted fica branco) */}
        {hasExplicit && (
          <div className="space-y-0.25 pt-2">
            {explicitMods.map((mod, i) => (
              <p
                key={i}
                className="uppercase"
                style={{
                  color:
                    mod.type === "crafted"
                      ? "#ffffff"
                      : `hsl(${MOD_COLOR_HSL[mod.type]})`,
                }}
              >
                {mod.text}
              </p>
            ))}
          </div>
        )}

        {/* Corrupted */}
        {item.corrupted && (
          <div className="border-t border-slate-600/70 pt-2">
            <p className="text-red-500 font-semibold tracking-wide">
              Corrupted
            </p>
          </div>
        )}

        {/* Icon inside tooltip, at the bottom */}
        {item.iconUrl && (
          <div className="pt-3 flex justify-center">
            <div className="relative w-16 h-20">
              <Image
                src={item.iconUrl}
                alt={item.name}
                fill
                className="object-contain drop-shadow-[0_0_12px_rgba(0,0,0,0.9)]"
                unoptimized
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Equipment slot layout ────────────────────────────────────────────────────
//
//  poe.ninja-style grid (4 cols × 5 rows):
//
//    Col:   1       2       3       4
//    Row1:  .       Helm    Helm    Amulet
//    Row2:  Wep1    Body    Body    Wep2
//    Row3:  Wep1    Body    Body    Wep2
//    Row4:  Ring1   Body    Body    Ring2
//    Row5:  Gloves  Belt    Boots   .
//
//  Belt is in col 2 row 5 → right of Gloves (col 1) and left of Boots (col 3) ✓

const EQUIPMENT_GRID = [
  { slot: "Weapon 1", col: "2 / span 2", row: "1 / span 4" },
  { slot: "Weapon 2", col: "8 / span 2", row: "1 / span 4" },
  { slot: "Helm", col: "5 / span 2", row: "1 / span 2" },
  { slot: "Amulet", col: "7 / span 1", row: "3 / span 1" },
  { slot: "Body Armour", col: "5 / span 2", row: "3 / span 3" },
  { slot: "Ring 1", col: "4 / span 1", row: "4 / span 1" },
  { slot: "Ring 2", col: "7 / span 1", row: "4 / span 1" },
  { slot: "Gloves", col: "3 / span 2", row: "5 / span 2" },
  { slot: "Belt", col: "5 / span 2", row: "6 / span 1" },
  { slot: "Boots", col: "7 / span 2", row: "5 / span 2" },
];
const SLOT_LABEL: Record<string, string> = {
  "Weapon 1": "Main Hand",
  "Weapon 2": "Off Hand",
  Helm: "Helm",
  "Body Armour": "Body",
  "Ring 1": "Ring 1",
  "Ring 2": "Ring 2",
  Gloves: "Gloves",
  Belt: "Belt",
  Boots: "Boots",
  Amulet: "Amulet",
  "Flask 1": "Flask 1",
  "Flask 2": "Flask 2",
  "Flask 3": "Flask 3",
  "Flask 4": "Flask 4",
  "Flask 5": "Flask 5",
};

const EQUIPMENT_SLOTS = [
  "Weapon 1",
  "Helm",
  "Weapon 2",
  "Amulet",
  "Body Armour",
  "Ring 1",
  "Ring 2",
  "Gloves",
  "Belt",
  "Boots",
] as const;

const FLASK_SLOTS = [
  "Flask 1",
  "Flask 2",
  "Flask 3",
  "Flask 4",
  "Flask 5",
] as const;

// ─── Slot card ────────────────────────────────────────────────────────────────

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="w-full h-full bg-[#161a20] border border-[#2b313d] rounded flex flex-col items-center justify-center opacity-70 group cursor-not-allowed">
      <span className="text-[10px] text-slate-600 font-medium opacity-50 text-center max-w-full px-1">
        {label}
      </span>
    </div>
  );
}

function ItemSlotCard({
  item,
  slotName,
}: {
  item?: PobItem;
  slotName: string;
}) {
  if (!item) return <EmptySlot label={SLOT_LABEL[slotName] ?? slotName} />;

  const borderColorHsl =
    RARITY_BORDER_HSL[item.rarity] ?? RARITY_BORDER_HSL.Normal;
  const isCorruptedUnique = item.corrupted && item.rarity === "Unique";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="group relative rounded-sm border w-full h-full flex flex-col items-center justify-center bg-[#1a1c23]/80 hover:bg-[#252834] transition-colors cursor-pointer overflow-hidden outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
          style={{
            borderColor: `hsla(${borderColorHsl}, 0.25)`,
            boxShadow: isCorruptedUnique
              ? `inset 0 0 11px -4px hsla(0, 100%, 41%, 0.5)`
              : "inset 0 0 15px rgba(0,0,0,0.5)",
          }}
        >
          {item.iconUrl ? (
            <div className="relative w-full h-full flex items-center justify-center p-1">
              <Image
                src={item.iconUrl}
                alt={item.name}
                fill
                className="object-contain drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] filter transition-transform duration-200 group-hover:scale-105"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <div
                className="w-4 h-4 rounded-sm"
                style={{
                  backgroundColor: `hsla(${borderColorHsl}, 0.4)`,
                  transform: "rotate(45deg)",
                }}
              />
            </div>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        align="start"
        sideOffset={8}
        className="p-0 border-none bg-transparent shadow-none w-auto min-w-0"
      >
        <ItemTooltip item={item} />
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PobViewerClient({ locale }: Props) {
  const isPt = locale === "pt-br";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PobBuildData | null>(null);
  const [activeItemSetIndex, setActiveItemSetIndex] = useState(0);
  async function handleAnalyze(from?: string, options?: { updateUrl?: boolean }) {
    const source = (from ?? input).trim();
    if (!source) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      // 1) Criar/obter hash compartilhável no Supabase
      let sharedId: string | null = null;
      try {
        const shareRes = await fetch("/api/tools/pob-viewer/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pobCode: source }),
        });
        const shareJson = await shareRes.json();
        if (shareRes.ok && shareJson.id) {
          sharedId = shareJson.id as string;
        }
      } catch {
        // Se der erro no share, seguimos apenas com o parse normal
      }

      // 2) Processar o PoB normalmente
      const res = await fetch("/api/tools/pob-viewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pobCode: source }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(
          json.error ??
            (isPt ? "Erro ao processar PoB." : "Error processing PoB."),
        );
      } else {
        setData(json as PobBuildData);
        // Atualiza a URL com ?id=<hash> quando disponível
        if ((options?.updateUrl ?? true) && sharedId) {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("code"); // legado
          params.set("id", sharedId);
          router.replace(`?${params.toString()}`, { scroll: true });
        }
      }
    } catch {
      setError(
        isPt
          ? "Erro de rede. Tente novamente."
          : "Network error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const stats = data?.Stats ?? {};
  const buildInfo = data?.BuildInfo;
  const treeDetails = data?.TreeDetails;
  const itemSets = data?.ItemSets ?? [];

  const safeItemSetIndex =
    itemSets.length === 0 ? 0 : Math.min(activeItemSetIndex, itemSets.length - 1);
  const itemSetItems =
    itemSets.length > 0 ? itemSets[safeItemSetIndex]?.items ?? [] : [];
  const slotMap: Record<string, PobItem> = {};
  for (const item of itemSetItems) {
    const key = normalizeSlotName(item.slot);
    slotMap[key] = item;
  }

  // Auto-carregar PoB se houver ?code= na URL
  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    const codeFromUrl = searchParams.get("code"); // suporte legado
    if (loading || data) return;

    const run = async () => {
      try {
        if (idFromUrl) {
          const res = await fetch(
            `/api/tools/pob-viewer/share?id=${encodeURIComponent(idFromUrl)}`,
          );
          const json = await res.json();
          if (!res.ok || json.error || !json.pobCode) {
            setError(
              json.error ??
                (isPt
                  ? "Não foi possível carregar o PoB deste link."
                  : "Could not load PoB for this link."),
            );
            return;
          }
          const pobCode = String(json.pobCode);
          setInput(pobCode);
          await handleAnalyze(pobCode, { updateUrl: false });
        } else if (codeFromUrl) {
          setInput(codeFromUrl);
          await handleAnalyze(codeFromUrl, { updateUrl: false });
        }
      } catch {
        setError(
          isPt
            ? "Erro ao carregar PoB a partir do link."
            : "Failed to load PoB from link.",
        );
      }
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loading, data]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page header */}
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Sword className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">
            {isPt ? "Visualizador de Build" : "PoB Viewer"}
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          {isPt
            ? "Cole seu código Path of Building ou link pobb.in/pastebin para visualizar sua build."
            : "Paste your Path of Building code or pobb.in/pastebin link to visualize your build."}
        </p>
      </header>

      {/* Input (inline, some à medida que o PoB é carregado) */}
      {!data && (
        <section className="pt-4 space-y-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isPt
                ? "Cole o código PoB ou link (pobb.in / pastebin.com)..."
                : "Paste the PoB code or link (pobb.in / pastebin.com)..."
            }
            className="w-full h-28 rounded-md border border-input/80 bg-background/90 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            onClick={() => void handleAnalyze()}
            disabled={loading || !input.trim()}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isPt ? "Analisando..." : "Analyzing..."}
              </>
            ) : isPt ? (
              "Analisar Build"
            ) : (
              "Analyze Build"
            )}
          </Button>
        </section>
      )}

      {data && (
        <>
          {/* Build header badges */}
          {buildInfo && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="text-sm px-3 py-1 bg-primary/20 text-primary border border-primary/30">
                {buildInfo.Ascendancy || buildInfo.Class}
              </Badge>
              {buildInfo.Ascendancy &&
                buildInfo.Ascendancy !== buildInfo.Class && (
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {buildInfo.Class}
                  </Badge>
                )}
              <Badge variant="secondary" className="text-sm px-3 py-1">
                Lv {buildInfo.Level}
              </Badge>
            </div>
          )}

          {/* Equipment – visualizador mais “solto” na página + Loadouts */}
          {itemSets.length > 0 && (
            <section className="mt-6 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
                  {isPt ? "Equipamentos" : "Equipment"}
                </h2>

                {itemSets.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {itemSets.map((set, idx) => {
                      const isActive = idx === activeItemSetIndex;
                      const label = set.title || `${isPt ? "Conjunto" : "Set"} ${idx + 1}`;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveItemSetIndex(idx)}
                          className={`px-2.5 py-1 rounded-full border text-[11px] transition-colors ${
                            isActive
                              ? "border-primary/60 bg-primary/15 text-primary"
                              : "border-border/40 bg-background/40 text-muted-foreground hover:border-border/70"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Itens do conjunto ativo */}
              {itemSetItems.length > 0 && (
              <div className="bg-[#12141b]/95 p-4 sm:p-5 rounded-xl border border-border/40 flex flex-col items-center shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
                <div
                  className="grid gap-1 justify-center mx-auto"
                  style={{
                    gridTemplateColumns:
                      "48px 48px 48px 48px 48px 48px 48px 48px 48px 48px",
                    gridAutoRows: "48px",
                  }}
                >
                  {EQUIPMENT_GRID.map(({ slot, col, row }) => (
                    <div key={slot} style={{ gridColumn: col, gridRow: row }}>
                      <ItemSlotCard item={slotMap[slot]} slotName={slot} />
                    </div>
                  ))}
                </div>

                {/* Flasks */}
                <div className="flex justify-center gap-1.5 pt-4">
                  {FLASK_SLOTS.map((slotName) => (
                    <div key={slotName} className="w-[48px] h-[96px]">
                      <ItemSlotCard
                        item={slotMap[slotName]}
                        slotName={slotName}
                      />
                    </div>
                  ))}
                </div>
              </div>
              )}
            </section>
          )}

          {/* Compact key stats under visualizer */}
          {Object.keys(stats).length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground bg-muted/10 border border-border/40 rounded-md px-3 py-2">
              {stats["Total DPS"] && (
                <span className="inline-flex items-baseline gap-1 font-semibold text-primary">
                  <span className="uppercase tracking-wide">
                    {isPt ? "DPS Total" : "Total DPS"}:
                  </span>
                  <span className="tabular-nums text-sm">{stats["Total DPS"]}</span>
                </span>
              )}
              {[
                { key: "Effective Hit Pool", label: "EHP" },
                { key: "Life", label: "Life" },
                { key: "Energy Shield", label: "ES" },
                {
                  key: "Movement Speed",
                  label: isPt ? "Vel. Movimento" : "Move Speed",
                },
              ]
                .filter(({ key }) => stats[key])
                .map(({ key, label }) => (
                  <span key={key} className="inline-flex items-baseline gap-1">
                    <span className="uppercase tracking-wide opacity-80">
                      {label}:
                    </span>
                    <span className="tabular-nums">{stats[key]}</span>
                  </span>
                ))}
            </div>
          )}

          {/* Skills / Gems */}
          {data.Skills.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Skills &amp; Gems</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.Skills.map((group, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border/50 bg-slate-950/30 p-3"
                  >
                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                      {group.slot}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.gems.map((gem, j) => (
                        <Badge
                          key={j}
                          variant="outline"
                          className={
                            gem.is_support
                              ? "border-blue-500/50 text-blue-300 bg-blue-950/20"
                              : "border-red-500/40 text-red-300 bg-red-950/20"
                          }
                        >
                          {gem.name}
                          <span className="ml-1 text-muted-foreground text-[10px]">
                            {gem.level}/{gem.quality}Q
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Passive Tree */}
          {treeDetails &&
            (treeDetails.NodesCount > 0 ||
              treeDetails.Keystones.length > 0) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {isPt ? "Árvore Passiva" : "Passive Tree"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {treeDetails.NodesCount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {treeDetails.NodesCount}{" "}
                      {isPt ? "nós alocados" : "nodes allocated"}
                    </p>
                  )}
                  {treeDetails.Keystones.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                        Keystones
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {treeDetails.Keystones.map((k, i) => (
                          <Badge
                            key={i}
                            className="bg-yellow-500/15 text-yellow-300 border-yellow-500/30 border"
                          >
                            {k}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {treeDetails.Masteries.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                        Masteries
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {treeDetails.Masteries.map((m, i) => (
                          <Badge key={i} variant="secondary">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
        </>
      )}
      </div>
    </TooltipProvider>
  );
}
