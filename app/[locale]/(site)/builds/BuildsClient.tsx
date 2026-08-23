"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import BuildCard from "@/components/Builds/BuildCard";
import BuildFilters from "@/components/Builds/BuildFilters";
import type { Build } from "@/lib/interface";

const LIMIT = 12;

interface BuildsClientProps {
  builds: Build[];
  locale: string;
  leagues: string[];
}

// `builds/page.tsx` owns the Suspense boundary and supplies a crawlable fallback
// with the first page of cards. This component progressively enhances that HTML
// with URL-backed filters and pagination after hydration.
export default function BuildsClient({ builds, locale, leagues }: BuildsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("BuildsList");

  const filteredBuilds = useMemo(() => {
    const gameVersion = searchParams.get("gameVersion");
    const league = searchParams.get("league");
    const poeClass = searchParams.get("class");
    const ascendancy = searchParams.get("ascendancy");
    const search = searchParams.get("search")?.trim().toLocaleLowerCase();
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) ?? [];

    return builds.filter((build) => {
      if (gameVersion && build.game_version !== gameVersion) return false;
      if (league && build.league !== league) return false;
      if (poeClass && build.class !== poeClass) return false;
      if (ascendancy && build.ascendancy !== ascendancy) return false;
      if (search && !build.title.toLocaleLowerCase().includes(search)) return false;
      if (tags.length > 0 && !build.tags.some((tag) => tags.includes(tag))) return false;
      return true;
    });
  }, [builds, searchParams]);

  const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const totalPages = Math.max(1, Math.ceil(filteredBuilds.length / LIMIT));
  const page = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), totalPages)
    : 1;
  const visibleBuilds = filteredBuilds.slice((page - 1) * LIMIT, page * LIMIT);

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  const from = (page - 1) * LIMIT + 1;
  const to = Math.min(page * LIMIT, filteredBuilds.length);

  return (
    <section aria-label={locale === "pt-br" ? "Catálogo de builds" : "Build catalog"}>
      {/* Filters */}
      <div className="mb-6">
        <BuildFilters leagues={leagues} />
      </div>

      {/* Results count */}
      {filteredBuilds.length > 0 && (
        <p className="text-xs text-gray-500 mb-4">
          {t("resultsCount", { from, to, total: filteredBuilds.length })}
        </p>
      )}

      {/* Grid */}
      {visibleBuilds.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          {t("emptyState")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleBuilds.map((build, i) => (
            <BuildCard
              key={build.id}
              build={build}
              locale={locale}
              priority={page === 1 && i < 4}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm rounded border border-gray-700/50 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {t("previous")}
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={`px-3 py-1.5 text-sm rounded border transition-colors ${p === page
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'border-gray-700/50 text-gray-400 hover:text-white hover:border-gray-500'
                }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm rounded border border-gray-700/50 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {t("next")}
          </button>
        </div>
      )}
    </section>
  );
}
