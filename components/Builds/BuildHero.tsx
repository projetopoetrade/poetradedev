import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AscendancyImage from "./AscendancyImage";
import type { Build } from "@/lib/interface";
import { BUILD_TAGS } from "@/lib/builds-data";
import Link from "next/link";

interface BuildHeroProps {
  build: Build;
}

const TAG_COLORS: Record<string, string> = {
  "league-starter": "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  endgame: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  "boss-killer": "bg-red-500/20 text-red-400 border-red-500/40",
  "speed-farm": "bg-blue-500/20 text-blue-400 border-blue-500/40",
  "ssf-viable": "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  hardcore: "bg-orange-500/20 text-orange-400 border-orange-500/40",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};
const BUDGET_LABEL: Record<string, string> = {
  cheap: "Cheap",
  medium: "Medium",
  expensive: "Expensive",
};

export default function BuildHero({ build }: BuildHeroProps) {
  const tagLabels = BUILD_TAGS.reduce(
    (acc, t) => ({ ...acc, [t.value]: t.label }),
    {} as Record<string, string>,
  );
  const pobUrl = build.pob_hash
    ? `/tools/pob-viewer?id=${build.pob_hash}&from=build&buildSlug=${encodeURIComponent(build.slug)}`
    : `/tools/pob-viewer?code=${encodeURIComponent(build.pob_code)}&from=build&buildSlug=${encodeURIComponent(build.slug)}`;

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-black/30">
      {/* Background image */}
      <div className="absolute inset-0">
        <AscendancyImage
          ascendancy={build.ascendancy}
          imageUrl={build.image_url}
          alt={build.title}
          gameVersion={build.game_version}
          fill
          className="object-cover opacity-15 dark:opacity-20"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/70 dark:from-black/85 dark:via-black/70 dark:to-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row gap-6 items-start">
        {/* Ascendancy image */}
        <div className="relative w-[100px] h-[100px] shrink-0 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700/50">
          <AscendancyImage
            ascendancy={build.ascendancy}
            imageUrl={build.image_url}
            alt={build.ascendancy}
            gameVersion={build.game_version}
            variant="icon"
            fill
            className="object-cover"
            sizes="100px"
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {build.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={`text-xs ${TAG_COLORS[tag] ?? "bg-gray-700/50 text-gray-300 border-gray-600/40"}`}
              >
                {tagLabels[tag] ?? tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {build.title}
          </h1>

          {/* Class / Ascendancy / Skill */}
          <div className="flex flex-wrap items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {build.class}
            </span>
            <span className="text-gray-400 dark:text-gray-600">·</span>
            <span>{build.ascendancy}</span>
            {build.main_skill && (
              <>
                <span className="text-gray-400 dark:text-gray-600">·</span>
                <span>{build.main_skill}</span>
              </>
            )}
            {build.league && (
              <>
                <span className="text-gray-400 dark:text-gray-600">·</span>
                <span className="text-gray-600 dark:text-gray-300">
                  {build.league}
                </span>
              </>
            )}
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3 mb-5 text-xs text-gray-500 dark:text-gray-400">
            {build.difficulty && (
              <span className="flex items-center gap-1">
                <span className="text-gray-600 dark:text-gray-500">
                  Difficulty:
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {DIFFICULTY_LABEL[build.difficulty]}
                </span>
              </span>
            )}
            {build.budget && (
              <span className="flex items-center gap-1">
                <span className="text-gray-600 dark:text-gray-500">
                  Budget:
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {BUDGET_LABEL[build.budget]}
                </span>
              </span>
            )}
            {build.author && (
              <span className="flex items-center gap-1">
                <span className="text-gray-600 dark:text-gray-500">By:</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {build.author}
                </span>
              </span>
            )}
          </div>

          {/* CTA */}
          <Button
            asChild
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            <Link href={pobUrl} target="_blank" rel="noopener noreferrer">
              Open in PoB Viewer
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
