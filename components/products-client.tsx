"use client";
import type { Product } from "@/lib/interface";
import ProductCard from "./product-card";
import { Suspense, useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ProductSkeleton } from "./ui/skeleton";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
// Navegacao locale-aware do next-intl. Os equivalentes de `next/navigation` sao
// agnosticos de locale: com `localePrefix: 'as-needed'`, um `replace('/products')`
// volta ao middleware, que renegocia o idioma e joga o usuario de /products para
// /pt-br/products. Filtrar trocava a lingua do site.
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import FiltersToggle from "./filters-toggle";

interface ProductsClientProps {
  products: Product[];
  initialFilters: {
    gameVersion: string;
    league: string;
    difficulty: string;
  };
}

// Suspense por causa do `useSearchParams` em rota pré-renderizada.
export default function ProductsClient(props: ProductsClientProps) {
  return (
    <Suspense fallback={null}>
      <ProductsClientInner {...props} />
    </Suspense>
  );
}

// Valores "guarda-chuva" que a UI usa para dizer "sem filtro nesta dimensao".
const CATCH_ALL = new Set([
  "all leagues",
  "all difficulties",
  "all items",
  "all categories",
  "current",
]);

function isSpecificFilter(value: string | undefined): boolean {
  return Boolean(value) && !CATCH_ALL.has(String(value).toLowerCase());
}

function ProductsClientInner({ products, initialFilters }: ProductsClientProps) {
  const t = useTranslations('Products');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const buttons = [
    { label: t("allCategories"), value: "All Categories" },
    { label: t("currency"), value: "Currency" },
    { label: t("services"), value: "Services" },
    { label: t("items"), value: "Items" },
  ];
  const [selectedFilter, setSelectedFilter] = useState<string>(
    searchParams.get("category") ?? "All Categories"
  );
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") ?? "");
  const [gameVersion, setGameVersion] = useState(
    searchParams.get("gameVersion") ?? initialFilters.gameVersion
  );
  const [league, setLeague] = useState(
    searchParams.get("league") ?? initialFilters.league
  );
  const [difficulty, setDifficulty] = useState(
    searchParams.get("difficulty") ?? initialFilters.difficulty
  );

  // league/difficulty/gameVersion eram filtrados no SERVIDOR, o que obrigava a
  // pagina a ler `searchParams` e a tornava dinamica (uma execucao de funcao por
  // combinacao de filtro). Agora os 206 produtos vem estaticos no HTML e todo o
  // filtro acontece aqui. A canonical ja apontava para a URL limpa, entao as
  // combinacoes filtradas nunca foram indexaveis — nao se perde SEO.
  const matchesFilters = (product: Product): boolean => {
    if (
      selectedFilter.toLowerCase() !== "all categories" &&
      product.category?.toLowerCase() !== selectedFilter.toLowerCase()
    ) {
      return false;
    }

    if (
      searchTerm.trim() !== "" &&
      !product.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
    ) {
      return false;
    }

    if (isSpecificFilter(gameVersion) && product.gameVersion !== gameVersion) {
      return false;
    }

    if (isSpecificFilter(league) && product.league !== league) {
      return false;
    }

    if (isSpecificFilter(difficulty) && product.difficulty !== difficulty) {
      return false;
    }

    return true;
  };

  // Mantem a URL em sincronia com os filtros sem ida ao servidor. `replace`
  // (nao `push`) evita empilhar uma entrada de historico por tecla digitada;
  // `scroll: false` impede o salto para o topo a cada ajuste de filtro.
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    if (isSpecificFilter(selectedFilter)) params.set("category", selectedFilter);
    if (isSpecificFilter(gameVersion)) params.set("gameVersion", gameVersion);
    if (isSpecificFilter(league)) params.set("league", league);
    if (isSpecificFilter(difficulty)) params.set("difficulty", difficulty);

    // Compara so a query: `pathname` aqui vem sem o prefixo de locale (next-intl),
    // enquanto `window.location` o inclui — comparar os dois daria sempre diferente.
    const qs = params.toString();
    const current = window.location.search.replace(/^\?/, "");
    if (qs === current) return;

    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchTerm, selectedFilter, gameVersion, league, difficulty, pathname, router]);

  const handleSearch = (e: React.FormEvent) => {
    // O filtro ja e reativo ao estado; o submit existe so para o Enter no campo.
    e.preventDefault();
  };

  const filteredList = products.filter(matchesFilters);

  return (
    <div className="border rounded-b-lg py-4 md:min-h-[678px] bg-black/5 mb-12">
      <div className="flex flex-col gap-4 px-3 mb-4">
        {/* Search and Filters Section */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Buttons */}
          <nav className="grid grid-cols-2 gap-3 md:flex md:flex-wrap" aria-label="Filters">
            {buttons.map((button) => (
              <Button
                key={button.value}
                variant="secondary"
                className={` min-w-[100px] text-sm md:text-base font-bold hover:bg-indigo-600 ${
                  selectedFilter === button.value ? "bg-indigo-600 text-white" : ""
                }`}
                onClick={() => setSelectedFilter(button.value)}
                aria-label={`Filter by ${button.label}`}
              >
                {button.label}
              </Button>
            ))}
          </nav>

          {/* Search and Advanced Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex-1 sm:w-64">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search products..."
                  aria-label="Search products"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="absolute right-0 top-0 h-full"
                  aria-label="Search products"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>

            {/* Advanced Filters */}
            <div className="w-full sm:w-auto">
              <FiltersToggle
                currentGameVersion={gameVersion}
                currentLeague={league}
                currentDifficulty={difficulty}
                onFilterChange={(type, value) => {
                  if (type === "gameVersion") setGameVersion(value);
                  else if (type === "league") setLeague(value);
                  else if (type === "difficulty") setDifficulty(value);
                }}
                open={isFiltersOpen}
                onOpenChange={setIsFiltersOpen}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-3">
        {/* Sem gate de "carregando": os produtos ja vem no payload estatico.
            O `setTimeout(500)` que existia aqui fazia o HTML do servidor conter
            SKELETONS em vez de produtos — o crawler nunca via a listagem. */}
        {filteredList.length > 0 ? (
          // Show products
          filteredList.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          // Show empty state
          <div className="col-span-full text-center py-12">
            <p className="text-lg text-muted-foreground">
              {t("noProductsFound")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
