import { getProductsWithParams } from "@/app/actions";
import ProductsClient from "@/components/products-client";
import { Metadata } from "next";
import { SearchParamsStorage } from "@/components/search-params-storage";
import { CurrencyInfo } from "@/components/currency-info";
import PatchInfo from "@/components/PatchInfo";
import { getTranslations } from "next-intl/server";
import { buildCanonical } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { FilterModalWrapper } from "@/components/filter-modal-wrapper";


type SearchParams = {
  gameVersion?: string;
  league?: string;
  difficulty?: string;
  category?: string;
  search?: string;
};

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

  const title = t("products.title", { gameVersion, category, league });
  const description = t("products.description", { gameVersion, category, league });
  const ogTitle = t("products.ogTitle", { category, league });
  const ogDescription = t("products.ogDescription", { category, league, gameVersion });

  // Build path without locale for default locale (en), with locale for others
  const basePath = locale === 'en' ? `/products` : `/${locale}/products`;
  const url = new URL(basePath, process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net");
  if (searchParams.gameVersion) url.searchParams.set("gameVersion", searchParams.gameVersion);
  if (searchParams.league) url.searchParams.set("league", searchParams.league);
  if (searchParams.category) url.searchParams.set("category", searchParams.category);
  if (searchParams.difficulty) url.searchParams.set("difficulty", searchParams.difficulty);
  if (searchParams.search) url.searchParams.set("search", searchParams.search);

  const canonical = url.toString();

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      type: "website",
      siteName: t("siteName")
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription
    }
  };
}

export default async function ProductsPage(
  props: {
    searchParams: Promise<SearchParams>;
    params: Promise<{ locale: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "Products" });
  
  // Debug logs for search functionality
  console.log("🔍 [PRODUCTS PAGE] Search Params:", searchParams);
  console.log("🔍 [PRODUCTS PAGE] Search query:", searchParams.search);
  console.log("🔍 [PRODUCTS PAGE] All search params keys:", Object.keys(searchParams));
  
  try {
    const products = await getProductsWithParams(searchParams);
    console.log("🔍 [PRODUCTS PAGE] Products found:", products.length);
    console.log("🔍 [PRODUCTS PAGE] First few products:", products.slice(0, 3));
    const league = searchParams.league || "All Leagues";
    const difficulty = searchParams.difficulty || "All Difficulties";
    const category = searchParams.category || "All Items";
    const gameVersion = searchParams.gameVersion || "Current";

    const basePath = locale === 'en' ? `/products` : `/${locale}/products`;
    const baseUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}${basePath}`;
    const pageUrlObj = new URL(baseUrl);
    Object.keys(searchParams).forEach(key => {
        if (searchParams[key as keyof SearchParams]) {
            pageUrlObj.searchParams.append(key, searchParams[key as keyof SearchParams]!);
        }
    });
    const pageUrl = pageUrlObj.toString();

    const catalogStructuredData = {
      "@context": "https://schema.org",
      "@type": "OfferCatalog",
      "name": `${gameVersion} ${category} - ${league} (${difficulty})`,
      "description": `Browse and buy ${gameVersion} ${category} for the ${league} league (${difficulty}). Secure trading on Path of Trade Net.`,
      "url": pageUrl,
      "numberOfItems": products.length,
      "itemListElement": products.map((product, index) => {
          // --- !!! ADAPT THESE FIELDS !!! ---
          // Replace 'product.productName', 'product.productDesc', etc.,
          // with the actual field names from YOUR 'products' array.
          const productName = product.name || "Unknown Product";
          
          const productImageUrl = product.imgUrl || `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}/images/default.png`;
          const productPath = locale === 'en' ? `/products/${encodeURIComponent(product.name)}` : `/${locale}/products/${encodeURIComponent(product.name)}`;
          const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}${productPath}?gameVersion=${encodeURIComponent(product.gameVersion)}&league=${encodeURIComponent(product.league)}&difficulty=${encodeURIComponent(product.difficulty)}`;
          const productPrice = product.price || "0.00";
          // --- !!! END ADAPTATION !!! ---
  
          return {
            "@type": "ListItem",
            "position": index + 1,
            "item": {
              "@type": "Product",
              "name": `${productName} (${league})`,
              "description": product.alt,
              "image": productImageUrl,
              "url": productUrl,
              "brand": {
                "@type": "Brand",
                "name": gameVersion === "Current" ? "Path of Exile" : gameVersion // Adjust if needed
              },
              "offers": {
                "@type": "Offer",
                "url": productUrl,
                "priceCurrency": "USD",
                "price": productPrice,
                "availability": "https://schema.org/InStock", // Or use actual product availability if you have it
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
          <div className="bg-indigo-700 rounded-t-lg py-2 px-4 md: mt-10 px-8 shadow-lg flex items-center justify-between max-w-[520px]">
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
      <div className="text-red-500 p-4 border border-red-300  bg-red-50">
        <h3 className="font-bold mb-2">Error Loading Products</h3>
        <p>{(error as Error).message}</p>
        <p className="mt-4 text-sm">Please try refreshing the page or adjusting your search parameters.</p>
      </div>
    );
  }
}
