"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Sword,
  Shield,
  Shirt,
  HardHat,
  Footprints,
  Hand,
  Gem,
  CircleDashed,
  FlaskConical,
  Diamond,
  ClipboardCopy,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  PobBuildData,
  PobItem,
  PobKeystone,
  PobSocketedJewel,
  PobTreeSpec,
} from "@/lib/pob-types";
import { PassiveTreeViewer } from "@/components/tree/PassiveTreeViewer";
import { PassivePortalTooltip } from "@/components/tree/PassivePortalTooltip";
import { useTreeData } from "@/components/tree/useTreeData";
import type { PositionedNode } from "@/components/tree/tree-types";

interface GemRawEntry {
  rawText: string;
  primaryAttribute?: "Strength" | "Dexterity" | "Intelligence" | null;
  isAwakened?: boolean;
  isVaal?: boolean;
}

function makeGemKey(name: string, level: number, quality: number): string {
  return `${name}@${level}/${quality}`;
}

interface Props {
  locale: string;
  engineBase: string | null;
  treeDataUrl: string | null;
  dataJsonUrl: string;
  assetBaseUrl: string;
  patch: string;
}

import {
  POE_COLORS,
  RARITY_BORDER_HSL,
  RARITY_NAME_COLOR_HSL,
  MOD_COLOR_HSL,
  SOCKET_COLOR_HSL,
  INFLUENCE_ICONS,
  HEADER_TEXTURES,
} from "@/lib/pob/poe-colors";
import {
  getKeystoneLocalPath,
  getMasteryLocalPath,
  getGemLocalPath,
  getJewelLocalPath,
  getEffectiveItemIconUrl,
  normalizeSlotName,
} from "@/lib/pob/icon-helpers";
import { OpenInPobButton } from "@/components/poe/OpenInPobButton";
import { GemTooltip } from "@/components/poe/PoeGemTooltip";


import { SmartTooltip, SocketDisplay, ItemTooltip } from "@/components/tools/pob-viewer/ItemTooltip";
import {
  EQUIPMENT_GRID,
  SLOT_LABEL,
  EQUIPMENT_SLOTS,
  FLASK_SLOTS,
  SLOT_PLACEHOLDER_ICON,
  slotPlaceholder,
  EmptySlot,
  ItemSlotCard,
} from "@/components/tools/pob-viewer/ItemSlotCard";
import {
  JewelTooltip,
  JewelSlotCard,
} from "@/components/tools/pob-viewer/JewelComponents";

export default function PobViewerClient({
  locale,
  engineBase,
  treeDataUrl,
  dataJsonUrl,
  assetBaseUrl,
  patch,
}: Props) {
  const isPt = locale === "pt-br";
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get referrer info from URL params
  const referrerFrom = searchParams.get("from");
  const referrerBuildSlug = searchParams.get("buildSlug");
  const hasReferrer = referrerFrom === "build" && referrerBuildSlug;

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PobBuildData | null>(null);
  const [activeItemSetIndex, setActiveItemSetIndex] = useState(0);
  const [activeTreeSpecIndex, setActiveTreeSpecIndex] = useState(0);
  const [treeHover, setTreeHover] = useState<{
    node: PositionedNode | null;
    screenX: number;
    screenY: number;
  }>({ node: null, screenX: 0, screenY: 0 });

  const engineUrl = useMemo(() => {
    if (!engineBase || !treeDataUrl) return undefined;
    return treeDataUrl.startsWith("http")
      ? treeDataUrl
      : `${engineBase}${treeDataUrl}`;
  }, [engineBase, treeDataUrl]);
  const treeState = useTreeData({
    engine: engineUrl,
    github: dataJsonUrl,
    patch,
  });
  const [gemInfoMap, setGemInfoMap] = useState<
    Record<
      string,
      {
        primary_attribute: string | null;
        gem_description: string | null;
      }
    >
  >({});
  const [gemRawMap, setGemRawMap] = useState<Record<string, GemRawEntry>>({});

  const hasUrlParam = Boolean(
    searchParams.get("id") || searchParams.get("code"),
  );
  const [isInitialLoad, setIsInitialLoad] = useState(hasUrlParam);
  const [isMobile, setIsMobile] = useState(false);
  const [sharedBuildId, setSharedBuildId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pobbinKey, setPobbinKey] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function formatMovementSpeed(value: string): string {
    const match = value.match(/^([\d.]+)x$/);
    if (match) {
      const multiplier = parseFloat(match[1]);
      const percent = (multiplier - 1) * 100;
      return `${percent.toFixed(0)}%`;
    }
    return value;
  }

  function handleLoadoutChange(newIndex: number) {
    setActiveItemSetIndex(newIndex);
    const newItemSetTitle = itemSets[newIndex]?.title;
    if (newItemSetTitle && treeDetails?.Specs) {
      const matchingSpecIndex = treeDetails.Specs.findIndex(
        (spec) => spec.title === newItemSetTitle,
      );
      if (matchingSpecIndex !== -1) {
        setActiveTreeSpecIndex(matchingSpecIndex);
      }
    }
  }

  async function handleAnalyze(
    from?: string,
    options?: { updateUrl?: boolean },
  ) {
    const source = (from ?? input).trim();
    if (!source) return;
    setLoading(true);
    setError(null);
    setData(null);
    setSharedBuildId(null);
    setPobbinKey(null);
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
          setSharedBuildId(shareJson.id as string);
          setPobbinKey((shareJson.pobbinKey as string | null) ?? null);
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
        const buildData = json as PobBuildData;
        setData(buildData);
        const specIdx = buildData.TreeDetails?.ActiveSpecIndex ?? 0;
        setActiveTreeSpecIndex(specIdx);
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
  const hasStats = Object.keys(stats).length > 0;
  const buildInfo = data?.BuildInfo;
  const treeDetails = data?.TreeDetails;
  const itemSets = data?.ItemSets ?? [];
  const skillSets = data?.SkillSets ?? [];

  const safeItemSetIndex =
    itemSets.length === 0
      ? 0
      : Math.min(activeItemSetIndex, itemSets.length - 1);
  const itemSetItems =
    itemSets.length > 0 ? (itemSets[safeItemSetIndex]?.items ?? []) : [];
  const slotMap: Record<string, PobItem> = {};
  for (const item of itemSetItems) {
    const key = normalizeSlotName(item.slot);
    slotMap[key] = item;
  }

  const hasMultipleLoadouts = itemSets.length > 1;
  const hasMultipleSpecs = (treeDetails?.Specs?.length ?? 0) > 1;
  const activeViewSpec: PobTreeSpec | undefined =
    treeDetails?.Specs[activeTreeSpecIndex];

  const allocatedIds = useMemo(
    () => new Set(activeViewSpec?.nodes ?? []),
    [activeViewSpec],
  );

  const selectedMasteries = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of activeViewSpec?.masteries ?? []) {
      if (m.stats.length > 0) {
        map.set(m.masteryName, m.stats);
      }
    }
    return map;
  }, [activeViewSpec]);

  // Ao trocar o loadout (ItemSet), mostramos o SkillSet correspondente (por índice) quando disponível.
  const skillSetIndex = Math.min(
    safeItemSetIndex,
    Math.max(0, skillSets.length - 1),
  );
  const activeSkillGroups =
    skillSets.length > 0
      ? (skillSets[skillSetIndex]?.skills ?? [])
      : (data?.Skills ?? []);

  // Dev logging para ajudar a depurar ícones de flasks / items.
  if (
    process.env.NODE_ENV !== "production" &&
    data &&
    itemSetItems.length > 0
  ) {
    // Loga visão geral dos item sets carregados.
    // eslint-disable-next-line no-console
    console.log("[PoB Viewer] ItemSets:", {
      totalSets: itemSets.length,
      activeSetIndex: safeItemSetIndex,
      activeSetTitle: itemSets[safeItemSetIndex]?.title,
      itemsInActiveSet: itemSetItems.length,
    });

    // Foca principalmente nos slots de Flask para debug de imagens.
    const flaskSlotsDebug = FLASK_SLOTS.map((slotName) => {
      const it = slotMap[slotName];
      return it
        ? {
            slot: slotName,
            name: it.name,
            baseName: it.baseName,
            rarity: it.rarity,
            iconUrl: it.iconUrl,
          }
        : { slot: slotName, empty: true };
    });

    // eslint-disable-next-line no-console
    console.log("[PoB Viewer] Flask slots debug:", flaskSlotsDebug);

    // ── Weapon DPS debug (client) ──────────────────────────────────────────
    const weaponSlots = ["Weapon 1", "Weapon 2"] as const;
    for (const slot of weaponSlots) {
      const w = slotMap[slot];
      if (!w) {
        // eslint-disable-next-line no-console
        console.log(`[PoB Viewer] ${slot}: vazio`);
        continue;
      }
      const aps = w.aps;
      const pDPS =
        w.physDamage && aps
          ? (((w.physDamage[0] + w.physDamage[1]) / 2) * aps).toFixed(1)
          : null;
      const eDPS =
        w.eleDamage && aps
          ? (((w.eleDamage[0] + w.eleDamage[1]) / 2) * aps).toFixed(1)
          : null;
      const cDPS =
        w.chaosDamage && aps
          ? (((w.chaosDamage[0] + w.chaosDamage[1]) / 2) * aps).toFixed(1)
          : null;
      // eslint-disable-next-line no-console
      console.log(`[PoB Viewer] ${slot}: "${w.name}" (${w.rarity})`, {
        physDamage: w.physDamage ?? "—",
        eleDamage: w.eleDamage ?? "—",
        chaosDamage: w.chaosDamage ?? "—",
        critChance: w.critChance != null ? `${w.critChance}%` : "—",
        aps: aps ?? "—",
        pDPS: pDPS ?? "—",
        eDPS: eDPS ?? "—",
        cDPS: cDPS ?? "—",
        totalDPS: aps
          ? (
              (w.physDamage
                ? ((w.physDamage[0] + w.physDamage[1]) / 2) * aps
                : 0) +
              (w.eleDamage
                ? ((w.eleDamage[0] + w.eleDamage[1]) / 2) * aps
                : 0) +
              (w.chaosDamage
                ? ((w.chaosDamage[0] + w.chaosDamage[1]) / 2) * aps
                : 0)
            ).toFixed(1)
          : "—",
      });
    }
    // ──────────────────────────────────────────────────────────────────────
  }

  // Buscar primary_attribute e descrição das gems após build carregado
  useEffect(() => {
    if (!data) return;
    const allGems = (data.SkillSets ?? []).flatMap((ss) =>
      (ss.skills ?? []).flatMap((sg) => sg.gems ?? []),
    );
    const uniqueNames = Array.from(new Set(allGems.map((g) => g.name)));
    if (uniqueNames.length === 0) return;

    console.log(
      `[PoB] Buscando info de ${uniqueNames.length} gems:`,
      uniqueNames,
    );

    const encoded = uniqueNames.map(encodeURIComponent).join(",");
    const url = `/api/tools/poe-gems/info?names=${encoded}`;
    console.log(`[PoB] GET ${url}`);

    fetch(url)
      .then(async (r) => {
        const json = await r.json();
        const matched = Object.keys(json);
        const missing = uniqueNames.filter((n) => !json[n]);
        console.log(
          `[PoB] Gems com match (${matched.length}/${uniqueNames.length}):`,
          matched,
        );
        if (missing.length > 0)
          console.warn(
            `[PoB] Gems sem match no DB (${missing.length}):`,
            missing,
          );
        console.log("[PoB] gemInfoMap completo:", json);
        setGemInfoMap(json);
      })
      .catch((err) => console.error("[PoB] Erro ao buscar gem info:", err));
  }, [data]);

  // Engine rawText (in-game tooltip) per (name, level, quality). Resolves
  // the same { rawText, gemInfo } the blog/preview already uses, so the
  // tooltip layout matches across the site. Falls back to the lighter
  // gem_description tooltip when the engine has no record.
  useEffect(() => {
    setGemRawMap({});
    if (!data) return;
    const allGems = (data.SkillSets ?? []).flatMap((ss) =>
      (ss.skills ?? []).flatMap((sg) => sg.gems ?? []),
    );
    const dedup = new Map<
      string,
      { name: string; level: number; quality: number }
    >();
    for (const g of allGems) {
      if (!g.name) continue;
      const key = makeGemKey(g.name, g.level, g.quality);
      if (!dedup.has(key)) {
        dedup.set(key, { name: g.name, level: g.level, quality: g.quality });
      }
    }
    if (dedup.size === 0) return;
    fetch("/api/tools/poe-gems/raw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gems: Array.from(dedup.values()) }),
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((map: Record<string, GemRawEntry>) => setGemRawMap(map))
      .catch(() => {});
  }, [data]);

  // Auto-carregar PoB se houver ?id= (shared build), ?code= (legacy inline
  // PoB code), ou ?pob= (pobb.in / pastebin URL). The `pob` param is the
  // canonical entry point from external deep links (e.g. the showcase page
  // footer): the engine's decoder accepts the URL directly and follows the
  // redirect chain itself.
  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    const codeFromUrl = searchParams.get("code"); // suporte legado
    const pobUrlFromUrl = searchParams.get("pob");
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
            setIsInitialLoad(false);
            return;
          }
          const pobCode = String(json.pobCode);
          setInput(pobCode);
          await handleAnalyze(pobCode, { updateUrl: false });
        } else if (pobUrlFromUrl) {
          // External URL — let the engine handle the fetch + decode.
          setInput(pobUrlFromUrl);
          await handleAnalyze(pobUrlFromUrl, { updateUrl: false });
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
      } finally {
        setIsInitialLoad(false);
      }
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loading, data]);

  if (isInitialLoad) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground text-lg">
          {isPt ? "Carregando build..." : "Loading build..."}
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className={`max-w-7xl mx-auto ${data ? "space-y-5" : "space-y-8"}`}>
        {/* Back to Build link (when coming from a build page) */}
        {hasReferrer && (
          <Link
            href={`/${locale}/builds/${referrerBuildSlug}`}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            {isPt ? "Voltar para a Build" : "Back to Build Guide"}
          </Link>
        )}

        {/* Page header */}
        <header className={data ? "space-y-0.5" : "space-y-1"}>
          <div className="flex items-center gap-2">
            <Sword
              className={data ? "h-5 w-5 text-primary" : "h-6 w-6 text-primary"}
            />
            <h1
              className={data ? "text-xl font-semibold" : "text-2xl font-bold"}
            >
              {isPt ? "Visualizador de Build" : "PoB Viewer"}
            </h1>
          </div>
          {!data && (
            <p className="text-muted-foreground text-sm">
              {isPt
                ? "Cole seu código Path of Building ou link pobb.in/pastebin para visualizar sua build."
                : "Paste your Path of Building code or pobb.in/pastebin link to visualize your build."}
            </p>
          )}
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
            {/* Build header + key stats em uma faixa compacta */}
            {(buildInfo || hasStats) && (
              <section className="rounded-lg border border-border/50 bg-background px-3 py-2 flex flex-wrap items-center gap-3">
                {buildInfo && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="text-xs sm:text-sm px-2.5 py-0.5 bg-primary/20 text-primary border border-primary/30">
                      {buildInfo.Ascendancy || buildInfo.Class}
                    </Badge>
                    {buildInfo.Ascendancy &&
                      buildInfo.Ascendancy !== buildInfo.Class && (
                        <Badge
                          variant="outline"
                          className="text-xs sm:text-sm px-2.5 py-0.5"
                        >
                          {buildInfo.Class}
                        </Badge>
                      )}
                    <Badge
                      variant="secondary"
                      className="text-xs sm:text-sm px-2.5 py-0.5"
                    >
                      Lv {buildInfo.Level}
                    </Badge>
                  </div>
                )}

                {hasStats && (
                  <div className="flex-1 min-w-[220px] flex flex-wrap items-center gap-2 justify-start md:justify-center text-[11px] sm:text-xs">
                    {stats["Total DPS"] && (
                      <span className="inline-flex items-baseline gap-1.5 font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        <span className="uppercase tracking-wide">
                          {isPt ? "DPS Total" : "Total DPS"}
                        </span>
                        <span className="tabular-nums text-sm">
                          {stats["Total DPS"]}
                        </span>
                      </span>
                    )}
                    {stats["Effective Hit Pool"] && (
                      <span className="inline-flex items-baseline gap-1.5 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md">
                        <span className="uppercase tracking-wide opacity-80">
                          EHP
                        </span>
                        <span className="tabular-nums font-semibold">
                          {stats["Effective Hit Pool"]}
                        </span>
                      </span>
                    )}
                    {stats["Life"] && (
                      <span className="inline-flex items-baseline gap-1.5 bg-red-500/10 text-red-400 px-2 py-0.5 rounded-md">
                        <span className="uppercase tracking-wide opacity-80">
                          Life
                        </span>
                        <span className="tabular-nums font-semibold">
                          {stats["Life"]}
                        </span>
                      </span>
                    )}
                    {stats["Energy Shield"] && (
                      <span className="inline-flex items-baseline gap-1.5 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md">
                        <span className="uppercase tracking-wide opacity-80">
                          ES
                        </span>
                        <span className="tabular-nums font-semibold">
                          {stats["Energy Shield"]}
                        </span>
                      </span>
                    )}
                    {stats["Movement Speed"] && (
                      <span className="inline-flex items-baseline gap-1.5 bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-md">
                        <span className="uppercase tracking-wide opacity-80">
                          {isPt ? "Vel. Mov." : "Move SPD"}
                        </span>
                        <span className="tabular-nums font-semibold">
                          {formatMovementSpeed(stats["Movement Speed"])}
                        </span>
                      </span>
                    )}
                  </div>
                )}

                {/* Open in PoB + Copy Code buttons */}
                {input.trim() && (
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="hidden md:flex">
                      <OpenInPobButton
                        pobCode={input.trim()}
                        cachedKey={pobbinKey}
                        onKeyResolved={setPobbinKey}
                        label={isPt ? "Abrir no PoB" : "Open in PoB"}
                      />
                    </div>
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => {
                              void navigator.clipboard
                                .writeText(input.trim())
                                .then(() => {
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                });
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md border border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            {copied ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <ClipboardCopy className="w-3 h-3" />
                            )}
                            {copied
                              ? isPt
                                ? "Copiado!"
                                : "Copied!"
                              : isPt
                                ? "Copiar código"
                                : "Copy code"}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          {isPt
                            ? "Copia o código PoB para a área de transferência"
                            : "Copy PoB code to clipboard"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </section>
            )}

            {/* Build Notes (from PoB Notes tab) */}
            {data?.Notes?.trim() && (
              <section className="rounded-lg border border-border/50 bg-background px-3 py-3">
                <h2 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase mb-2">
                  {isPt ? "Notas da build" : "Build notes"}
                </h2>
                <div className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                  {data.Notes}
                </div>
              </section>
            )}

            {/* Equipment */}
            {itemSets.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
                    {isPt ? "Equipamentos" : "Equipment"}
                  </h2>
                  {hasMultipleLoadouts && (
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs">
                      <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide font-medium shrink-0">
                        Loadout
                      </span>
                      <Select
                        value={String(activeItemSetIndex)}
                        onValueChange={(v) => handleLoadoutChange(Number(v))}
                      >
                        <SelectTrigger className="w-40 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {itemSets.map((set, idx) => (
                            <SelectItem key={idx} value={String(idx)}>
                              {set.title ||
                                `${isPt ? "Conjunto" : "Set"} ${idx + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Itens do conjunto ativo */}
                {itemSetItems.length > 0 && (
                  <div className="bg-background p-3 sm:p-4 rounded-xl border border-border/40 flex flex-col md:flex-row items-start gap-4 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
                    <div className="flex flex-col items-center w-full md:w-auto">
                      {/*
                        Mobile: escala o grid para caber na tela.
                        Grid natural = 10 cols × 60px = 600px.
                        scale(0.58) → ~348px visual, cabe em qualquer iPhone 6+.
                        transform não afeta layout → wrapper com altura fixa para
                        compensar o espaço que o elemento ainda ocupa no DOM.
                        (6 rows × 60px + flasks 132px) × 0.58 ≈ 287px
                      */}
                      <div
                        className="w-full flex justify-center overflow-hidden"
                        style={isMobile ? { height: "293px" } : undefined}
                      >
                        <div
                          style={
                            isMobile
                              ? {
                                  transform: "scale(0.58)",
                                  transformOrigin: "top center",
                                }
                              : undefined
                          }
                        >
                          <div
                            className="grid gap-0.5 justify-center"
                            style={{
                              gridTemplateColumns:
                                "60px 60px 60px 60px 60px 60px 60px 60px 60px 60px",
                              gridAutoRows: "60px",
                            }}
                          >
                            {EQUIPMENT_GRID.map(({ slot, col, row }) => (
                              <div
                                key={slot}
                                style={{ gridColumn: col, gridRow: row }}
                              >
                                <ItemSlotCard
                                  item={slotMap[slot]}
                                  slotName={slot}
                                  isMobile={isMobile}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Flasks */}
                          <div className="flex justify-center gap-1 pt-3">
                            {FLASK_SLOTS.map((slotName) => (
                              <div
                                key={slotName}
                                className="w-[60px] h-[120px]"
                              >
                                <ItemSlotCard
                                  item={slotMap[slotName]}
                                  slotName={slotName}
                                  isMobile={isMobile}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Jewels socketed na tree - abaixo das flasks */}
                      {(activeViewSpec?.socketedJewels?.length ?? 0) > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/40 w-full">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 text-center">
                            {isPt ? "Jewels na Árvore" : "Jewels in Tree"}
                          </p>
                          <div className="flex flex-wrap justify-center gap-1.5">
                            {activeViewSpec!.socketedJewels.map((j, i) => (
                              <div
                                key={j.nodeId ?? i}
                                className="w-[60px] h-[60px] shrink-0 rounded-sm overflow-hidden"
                              >
                                <JewelSlotCard jewel={j} isMobile={isMobile} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Skills / Gems na lateral direita */}
                    {activeSkillGroups.length > 0 && (
                      <div className="flex flex-col gap-2 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Skills &amp; Gems
                        </p>
                        {(() => {
                          const leftGroups = activeSkillGroups.filter(
                            (_, idx) => idx % 2 === 0,
                          );
                          const rightGroups = activeSkillGroups.filter(
                            (_, idx) => idx % 2 === 1,
                          );
                          const renderGroupCard = (
                            group: (typeof activeSkillGroups)[number],
                            key: number,
                          ) => (
                            <div
                              key={key}
                              className="rounded-lg border border-border/50 bg-slate-950/30 p-2"
                            >
                              <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">
                                {group.slot}
                              </p>
                              <div className="flex flex-col gap-1">
                                <TooltipProvider delayDuration={300}>
                                  {group.gems.map((gem, j) => {
                                    const info = gemInfoMap[gem.name];
                                    const attr =
                                      info?.primary_attribute ??
                                      (gem.is_support ? "support" : "strength");
                                    const badgeClass =
                                      attr === "intelligence"
                                        ? "border-blue-500/50 text-blue-300 bg-blue-950/20"
                                        : attr === "dexterity"
                                          ? "border-green-500/50 text-green-300 bg-green-950/20"
                                          : attr === "none"
                                            ? "border-slate-500/50 text-slate-300 bg-slate-950/20"
                                            : "border-red-500/40 text-red-300 bg-red-950/20";

                                    const badge = (
                                      <Badge
                                        key={j}
                                        variant="outline"
                                        className={
                                          badgeClass +
                                          " text-[12px] flex items-center justify-between gap-1.5 px-1.5 py-1 cursor-default w-full"
                                        }
                                      >
                                        <img
                                          src={getGemLocalPath(
                                            gem.name,
                                            gem.is_support,
                                          )}
                                          alt=""
                                          width={16}
                                          height={16}
                                          className="shrink-0 rounded-sm"
                                          onError={(e) => {
                                            e.currentTarget.style.display =
                                              "none";
                                          }}
                                        />
                                        <span className="flex-1 truncate text-[11px]">
                                          {gem.name}
                                        </span>
                                        <span className="ml-1 text-muted-foreground text-[10px]">
                                          {gem.level}/{gem.quality}Q
                                        </span>
                                      </Badge>
                                    );

                                    const gemKey = makeGemKey(
                                      gem.name,
                                      gem.level,
                                      gem.quality,
                                    );
                                    const gemRaw = gemRawMap[gemKey];

                                    let tooltipContent: React.ReactNode = null;
                                    if (gemRaw?.rawText) {
                                      tooltipContent = (
                                        <GemTooltip
                                          name={gem.name}
                                          rawText={gemRaw.rawText}
                                          iconUrl={getGemLocalPath(
                                            gem.name,
                                            gem.is_support,
                                          )}
                                          primaryAttribute={
                                            gemRaw.primaryAttribute ?? null
                                          }
                                          isAwakened={gemRaw.isAwakened}
                                          isVaal={gemRaw.isVaal}
                                        />
                                      );
                                    } else if (info?.gem_description) {
                                      tooltipContent = (
                                        <div className="max-w-[240px] space-y-1 text-left p-2.5 bg-popover text-popover-foreground rounded-md border border-border shadow-md">
                                          <p className="font-semibold text-[12px]">
                                            {gem.name}
                                          </p>
                                          <p className="text-muted-foreground text-[10px] leading-snug">
                                            {info.gem_description}
                                          </p>
                                          <div className="flex gap-2 text-[10px] pt-0.5 border-t border-border/40">
                                            <span>
                                              Lv{" "}
                                              <span className="text-foreground font-medium">
                                                {gem.level}
                                              </span>
                                            </span>
                                            <span>
                                              Q{" "}
                                              <span className="text-sky-400 font-medium">
                                                +{gem.quality}%
                                              </span>
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    }

                                    if (!tooltipContent) return badge;

                                    return (
                                      <SmartTooltip
                                        key={j}
                                        content={tooltipContent}
                                        side="left"
                                        align="start"
                                        isMobile={isMobile}
                                      >
                                        {badge}
                                      </SmartTooltip>
                                    );
                                  })}
                                </TooltipProvider>
                              </div>
                            </div>
                          );

                          return (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <div className="flex-1 flex flex-col gap-2">
                                {leftGroups.map((group, i) =>
                                  renderGroupCard(group, i),
                                )}
                              </div>
                              <div className="flex-1 flex flex-col gap-2">
                                {rightGroups.map((group, i) =>
                                  renderGroupCard(group, i + leftGroups.length),
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Passive Tree */}
            {treeDetails && treeDetails.NodesCount > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {isPt ? "Árvore Passiva" : "Passive Tree"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {hasMultipleSpecs && (
                    <div className="flex items-center gap-3 justify-end">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium shrink-0">
                        {isPt ? "Árvore" : "Tree"}
                      </span>
                      <Select
                        value={String(activeTreeSpecIndex)}
                        onValueChange={(v) => {
                          setActiveTreeSpecIndex(Number(v));
                        }}
                      >
                        <SelectTrigger className="w-56 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {treeDetails.Specs.map((spec, idx) => (
                            <SelectItem key={idx} value={String(idx)}>
                              {spec.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Grid: tree 75% | sidebar 25% no desktop; stack no mobile */}
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-[3fr_1fr]">
                    {treeState.status === "loading" && (
                      <div
                        className="flex w-full items-center justify-center rounded-lg border border-zinc-700 bg-neutral-950 text-sm text-neutral-400"
                        style={{ height: isMobile ? 320 : 600 }}
                      >
                        {isPt ? "Carregando árvore…" : "Loading tree…"}
                      </div>
                    )}
                    {treeState.status === "error" && (
                      <div
                        className="flex w-full items-center justify-center rounded-lg border border-red-900 bg-red-950/30 px-4 text-center text-sm text-red-300"
                        style={{ height: isMobile ? 320 : 600 }}
                      >
                        {isPt ? "Falha ao carregar árvore: " : "Failed to load tree: "}
                        {treeState.error}
                      </div>
                    )}
                    {treeState.status === "ready" && (
                      <PassiveTreeViewer
                        doc={treeState.doc}
                        allocatedIds={allocatedIds}
                        assetBaseUrl={assetBaseUrl}
                        height={isMobile ? 320 : 600}
                        onNodeHover={(node, screenX, screenY) =>
                          setTreeHover({ node, screenX, screenY })
                        }
                      />
                    )}

                    {/* Sidebar: Keystones + Masteries */}
                    <div
                      className="overflow-y-auto space-y-5 pr-1"
                      style={{ maxHeight: isMobile ? "none" : "600px" }}
                    >
                      {(activeViewSpec?.keystones?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                            Keystones
                          </p>
                          <div className="flex flex-col gap-2">
                            {activeViewSpec!.keystones.map((k, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <img
                                  src={getKeystoneLocalPath(k.name)}
                                  alt={k.name}
                                  width={28}
                                  height={28}
                                  className="shrink-0 rounded-sm"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                                <span className="text-xs font-semibold text-yellow-300 leading-tight">
                                  {k.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(() => {
                        const resolvedMasteries = (
                          activeViewSpec?.masteries ?? []
                        ).filter((m) => m.stats.length > 0);
                        return resolvedMasteries.length > 0 ? (
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                              Masteries
                            </p>
                            <div className="space-y-3">
                              {resolvedMasteries.map((m, i) => (
                                <div key={i} className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={getMasteryLocalPath(m.masteryName)}
                                      alt={m.masteryName}
                                      width={24}
                                      height={24}
                                      className="shrink-0 rounded-sm"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                    <span className="text-[11px] font-semibold text-amber-400/80 uppercase tracking-wide leading-tight">
                                      {m.masteryName}
                                    </span>
                                  </div>
                                  {m.stats.map((s, j) => (
                                    <span
                                      key={j}
                                      className="text-xs text-blue-300 leading-snug pl-8"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {(activeViewSpec?.keystones?.length ?? 0) === 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          {isPt ? "Sem keystones" : "No keystones"}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
      <PassivePortalTooltip
        node={treeHover.node}
        screenX={treeHover.screenX}
        screenY={treeHover.screenY}
        selectedMasteries={selectedMasteries}
      />
    </TooltipProvider>
  );
}
