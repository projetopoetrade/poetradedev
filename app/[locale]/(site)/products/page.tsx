import { getProductsWithParams } from "@/app/actions";
import ProductsClient from "@/components/products-client";
import { Metadata } from "next";
import { SearchParamsStorage } from "@/components/search-params-storage";
import { CurrencyInfo } from "@/components/currency-info";
import PatchInfo from "@/components/PatchInfo";
import { getTranslations } from "next-intl/server";
import { generateKeywords } from "@/lib/utils"; // Removi buildCanonical pois vamos montar manualmente aqui
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { FilterModalWrapper } from "@/components/filter-modal-wrapper";

// 1. Definição Correta dos Tipos
type SearchParams = {
  gameVersion?: string;
  league?: string;
  difficulty?: string;
  category?: string;
  search?: string;
};

// 2. Função Helper Corrigida (Coloque fora dos componentes)
function buildQueryString(params: SearchParams): string {
  const urlParams = new URLSearchParams();
  
  // Só adiciona se o valor existir e for uma string válida
  if (params.gameVersion) urlParams.set("gameVersion", params.gameVersion);
  if (params.league) urlParams.set("league", params.league);
  if (params.difficulty) urlParams.set("difficulty", params.difficulty);
  if (params.category) urlParams.set("category", params.category);
  if (params.search) urlParams.set("search", params.search);
  
  const str = urlParams.toString();
  return str ? `?${str}` : '';
}

// ---------------------------------------------------------
// GENERATE METADATA
// ---------------------------------------------------------
export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<SearchParams>;
  }
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "SEO" });

  const league = searchParams.league || "All Leagues";
  const category = searchParams.category || "All Items";
  const gameVersion = searchParams.gameVersion || "Current";

  // Base URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net";
  
  // Gera a string de busca idêntica para todas as linguagens
  const queryString = buildQueryString(searchParams);

  // URLs completas
  // Nota: Ajuste se sua rota padrão for '/products' e a pt for '/pt-br/products'
  const enUrl = `${baseUrl}/products${queryString}`;
  const ptUrl = `${baseUrl}/pt-br/products${queryString}`;

  // Canonical: Se estou em EN usa a url EN, se PT usa PT.
  const canonical = locale === 'en' ? enUrl : ptUrl;

  return {
    title: t("products.title", { gameVersion, category, league }),
    description: t("products.description", { gameVersion, category, league }),
    
    alternates: {
      canonical: canonical,
      // HREFLANGS: Crucial para indexar PT-BR corretamente com os filtros
      languages: {
        'en': enUrl,
        'pt-BR': ptUrl,
        'x-default': enUrl, 
      },
    },

    openGraph: {
      title: t("products.ogTitle", { category, league }),
      description: t("products.ogDescription", { category, league, gameVersion }),
      url: canonical,
      type: "website",
      siteName: t("siteName")
    },
    twitter: {
      card: "summary_large_image",
      title: t("products.ogTitle", { category, league }),
      description: t("products.ogDescription", { category, league, gameVersion }),
    },
    keywords: generateKeywords({
      locale,
      gameVersion: searchParams.gameVersion as 'path-of-exile-1' | 'path-of-exile-2',
      league: searchParams.league,
      category: searchParams.category,
      difficulty: searchParams.difficulty as 'softcore' | 'hardcore',
      customKeywords: ['buy', 'cheap', 'best price', 'fast delivery']
    })
  };
}

// ---------------------------------------------------------
// COMPONENTE DA PÁGINA
// ---------------------------------------------------------
export default async function ProductsPage(
  props: {
    searchParams: Promise<SearchParams>;
    params: Promise<{ locale: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "Products" });
  
  // Logs seguros
  console.log("🔍 [PRODUCTS PAGE] Search Params:", searchParams);

  try {
    const products = await getProductsWithParams(searchParams);
    
    // Variáveis para UI
    const league = searchParams.league || "All Leagues";
    const difficulty = searchParams.difficulty || "All Difficulties";
    const category = searchParams.category || "All Items";
    const gameVersion = searchParams.gameVersion || "Current";

    // Recria a URL atual para o Schema.org usando a mesma função helper
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net";
    const path = locale === 'en' ? '/products' : `/${locale}/products`;
    const pageUrl = `${baseUrl}${path}${buildQueryString(searchParams)}`;

    // SCHEMA.ORG (JSON-LD)
    const catalogStructuredData = {
      "@context": "https://schema.org",
      "@type": "OfferCatalog",
      "name": `${gameVersion} ${category} - ${league} (${difficulty})`,
      "description": `Browse and buy ${gameVersion} ${category} for the ${league} league (${difficulty}). Secure trading on Path of Trade Net.`,
      "url": pageUrl,
      "numberOfItems": products.length,
      "itemListElement": products.map((product, index) => {
          const productName = product.name || "Unknown Product";
          const productImageUrl = product.imgUrl || `${baseUrl}/images/default.png`;
          
          // URLs de produto individuais
          const productPath = locale === 'en' ? `/products/${encodeURIComponent(product.name)}` : `/${locale}/products/${encodeURIComponent(product.name)}`;
          // Query string específica do produto (mantém filtros atuais)
          const productQuery = buildQueryString({
             gameVersion: product.gameVersion,
             league: product.league,
             difficulty: product.difficulty
          });
          const productUrl = `${baseUrl}${productPath}${productQuery}`;

          return {
            "@type": "ListItem",
            "position": index + 1,
            "item": {
              "@type": "Product",
              "name": `${productName} (${league})`,
              "description": product.alt || productName,
              "image": productImageUrl,
              "url": productUrl,
              "brand": {
                "@type": "Brand",
                "name": gameVersion === "Current" ? "Path of Exile" : gameVersion
              },
              "offers": {
                "@type": "Offer",
                "url": productUrl,
                "priceCurrency": "USD",
                "price": product.price || "0.00",
                "availability": "https://schema.org/InStock",
                "seller": {
                  "@type": "Organization",
                  "name": "Path of Trade Net"
                }
              }
            }
          };
      })
    };
    
    return (
      <div className="container mx-auto py-8">
        <SearchParamsStorage searchParams={searchParams} />
        <FilterModalWrapper searchParams={searchParams} />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogStructuredData) }}
        />

        <div className="mb-12">
          {/* Header da Liga */}
          <div className="bg-indigo-700 rounded-t-lg py-2 px-4 md:mt-10 md:px-8 shadow-lg flex items-center justify-between max-w-[520px]">
            <Link 
              href={`/games/${gameVersion}`}
              className="flex items-center text-white hover:text-indigo-200 transition-colors group"
              aria-label={t("backToLeagues")}
            >
              <ArrowLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <h2 className="text-md md:text-2xl text-center text-white font-bold antialiased capitalize tracking-wider flex-1">
              {league} - {difficulty}
            </h2>
            <div className="w-6" />
          </div>

          <ProductsClient 
            products={products} 
            initialFilters={{
              gameVersion,
              league,
              difficulty
            }}
          />
        </div>

        <PatchInfo gameVersion={gameVersion} />
        <CurrencyInfo gameVersion={gameVersion} />
      </div>
    );
  } catch (error) {
    return (
      <div className="text-red-500 p-4 border border-red-300 bg-red-50">
        <h3 className="font-bold mb-2">Error Loading Products</h3>
        <p>{(error as Error).message}</p>
        <p className="mt-4 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }
}