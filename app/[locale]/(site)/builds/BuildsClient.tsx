"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import BuildCard from "@/components/Builds/BuildCard";
import BuildFilters from "@/components/Builds/BuildFilters";
import type { Build } from "@/lib/interface";

const LIMIT = 12;

interface BuildsClientProps {
  builds: Build[];
  total: number;
  page: number;
  locale: string;
  leagues: string[];
}

export default function BuildsClient({ builds, total, page, locale, leagues }: BuildsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / LIMIT);

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="min-h-screen py-12 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">PoE Builds</h1>
        <p className="text-gray-400 text-sm">
          Browse curated builds for Path of Exile. Open any build directly in our PoB Viewer.
        </p>
      </div>

      {/* Build Randomizer CTA */}
      <div className="mb-8 p-6 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-amber-400 mb-1">
            {locale === "pt-br" ? "Indeciso sobre o que jogar?" : "Undecided on what to play?"}
          </h2>
          <p className="text-sm text-amber-200/70">
            {locale === "pt-br"
              ? "Use o nosso Build Randomizer para sortear um league starter baseado nos filtros que você gosta."
              : "Use our Build Randomizer to roll a league starter based on the filters you like."}
          </p>
        </div>
        <button
          onClick={() => router.push(`/${locale}/tools/build-randomizer`)}
          className="shrink-0 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          {locale === "pt-br" ? "Abrir Build Randomizer" : "Open Build Randomizer"}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <BuildFilters leagues={leagues} />
      </div>

      {/* Results count */}
      {total > 0 && (
        <p className="text-xs text-gray-500 mb-4">
          Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} builds
        </p>
      )}

      {/* Grid */}
      {builds.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No builds found. Try adjusting the filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {builds.map((build) => (
            <BuildCard key={build.id} build={build} locale={locale} />
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
            Previous
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
            Next
          </button>
        </div>
      )}
    </div>
  );
}
