import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import AscendancyImage from "./AscendancyImage";
import type { Build } from "@/lib/interface";
import { BUILD_TAGS } from "@/lib/builds-data";

interface BuildCardProps {
  build: Build;
  locale: string;
  /** Set on the first few above-the-fold cards so the LCP image is not lazy-loaded. */
  priority?: boolean;
}

const TAG_COLORS: Record<string, string> = {
  "league-starter": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  endgame: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "boss-killer": "bg-red-500/20 text-red-400 border-red-500/30",
  "speed-farm": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "ssf-viable": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  hardcore: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const DIFFICULTY_ICONS: Record<string, string> = {
  easy: "●○○",
  medium: "●●○",
  hard: "●●●",
};

const BUDGET_LABELS: Record<string, string> = {
  cheap: "$",
  medium: "$$",
  expensive: "$$$",
};

export default function BuildCard({ build, locale, priority }: BuildCardProps) {
  const href =
    locale === "en"
      ? `/builds/${build.slug}`
      : `/${locale}/builds/${build.slug}`;
  const tagLabels = BUILD_TAGS.reduce(
    (acc, t) => ({ ...acc, [t.value]: t.label }),
    {} as Record<string, string>,
  );

  return (
    <Link
      href={href}
      className="group block rounded-lg border border-gray-800/50 bg-black/40 backdrop-blur-sm hover:border-gray-600/60 transition-all duration-300 overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-40 w-full overflow-hidden bg-gray-900">
        <AscendancyImage
          ascendancy={build.ascendancy}
          imageUrl={build.image_url}
          alt={`${build.ascendancy} - ${build.title}`}
          gameVersion={build.game_version}
          fill
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        {/* Tags overlay */}
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
          {build.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${TAG_COLORS[tag] ?? "bg-gray-700/50 text-gray-300 border-gray-600/30"}`}
            >
              {tagLabels[tag] ?? tag}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-white group-hover:text-gray-200 transition-colors line-clamp-2 mb-1.5">
          {build.title}
        </h3>

        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <Badge
            variant="outline"
            className="text-[10px] text-amber-400 border-amber-500/40 bg-amber-500/10 px-1.5 py-0"
          >
            {build.class}
          </Badge>
          <span className="text-gray-600 text-xs">·</span>
          <Badge
            variant="outline"
            className="text-[10px] text-gray-300 border-gray-600/40 px-1.5 py-0"
          >
            {build.ascendancy}
          </Badge>
        </div>

        {(build.main_skill ||
          build.difficulty ||
          build.budget ||
          build.league) && (
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span className="truncate">
              {build.main_skill ?? build.league ?? ""}
            </span>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {build.difficulty && (
                <span title={build.difficulty} className="text-gray-400">
                  {DIFFICULTY_ICONS[build.difficulty]}
                </span>
              )}
              {build.budget && (
                <span className="text-gray-400">
                  {BUDGET_LABELS[build.budget]}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
