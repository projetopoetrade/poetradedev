"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BUILD_TAGS, getClassesForGameVersion } from "@/lib/builds-data";

interface BuildFiltersProps {
  leagues: string[];
}

export default function BuildFilters({ leagues }: BuildFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const gameVersion = searchParams.get("gameVersion") ?? "";
  const league = searchParams.get("league") ?? "";
  const poeClass = searchParams.get("class") ?? "";
  const ascendancy = searchParams.get("ascendancy") ?? "";
  const search = searchParams.get("search") ?? "";
  const activeTags = searchParams.get("tags")?.split(",").filter(Boolean) ?? [];

  const classes = getClassesForGameVersion(gameVersion || "path-of-exile-1");
  const selectedClassData = classes.find((c) => c.name === poeClass);
  const ascendancies = selectedClassData?.ascendancies ?? [];

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset dependent params
    if (key === "gameVersion") {
      params.delete("class");
      params.delete("ascendancy");
    }
    if (key === "class") {
      params.delete("ascendancy");
    }
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function toggleTag(tag: string) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get("tags")?.split(",").filter(Boolean) ?? [];
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    if (next.length > 0) {
      params.set("tags", next.join(","));
    } else {
      params.delete("tags");
    }
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className={`space-y-3 transition-opacity ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
      {/* Search */}
      <Input
        placeholder="Search builds..."
        aria-label="Search builds by name"
        defaultValue={search}
        onChange={(e) => {
          const val = e.target.value;
          const params = new URLSearchParams(searchParams.toString());
          if (val) {
            params.set("search", val);
          } else {
            params.delete("search");
          }
          params.delete("page");
          startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
          });
        }}
        className="bg-black/40 border-gray-700/50 text-white placeholder:text-gray-500 h-9"
      />

      {/* Row 1: Game Version, League, Class, Ascendancy */}
      <div className="flex flex-wrap gap-2">
        <Select value={gameVersion} onValueChange={(v) => updateParam("gameVersion", v === "all" ? "" : v)}>
          <SelectTrigger aria-label="Filter builds by game version" className="w-auto min-w-[150px] h-9 bg-black/40 border-gray-700/50 text-sm text-gray-300">
            <SelectValue placeholder="Game Version" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Versions</SelectItem>
            <SelectItem value="path-of-exile-1">Path of Exile 1</SelectItem>
            <SelectItem value="path-of-exile-2">Path of Exile 2</SelectItem>
          </SelectContent>
        </Select>

        {leagues.length > 0 && (
          <Select value={league} onValueChange={(v) => updateParam("league", v === "all" ? "" : v)}>
            <SelectTrigger aria-label="Filter builds by league" className="w-auto min-w-[140px] h-9 bg-black/40 border-gray-700/50 text-sm text-gray-300">
              <SelectValue placeholder="League" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leagues</SelectItem>
              {leagues.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={poeClass} onValueChange={(v) => updateParam("class", v === "all" ? "" : v)}>
          <SelectTrigger aria-label="Filter builds by class" className="w-auto min-w-[130px] h-9 bg-black/40 border-gray-700/50 text-sm text-gray-300">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {ascendancies.length > 0 && (
          <Select value={ascendancy} onValueChange={(v) => updateParam("ascendancy", v === "all" ? "" : v)}>
            <SelectTrigger aria-label="Filter builds by ascendancy" className="w-auto min-w-[140px] h-9 bg-black/40 border-gray-700/50 text-sm text-gray-300">
              <SelectValue placeholder="Ascendancy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ascendancies</SelectItem>
              {ascendancies.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {BUILD_TAGS.map((tag) => {
          const active = activeTags.includes(tag.value);
          return (
            <button
              key={tag.value}
              onClick={() => toggleTag(tag.value)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                active
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                  : "bg-transparent text-gray-500 border-gray-700/50 hover:border-gray-600 hover:text-gray-400"
              }`}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
