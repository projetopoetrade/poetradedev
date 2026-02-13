import { getProductsWithParams, getLeagues } from "@/app/actions";
import { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Filters from "./filters";
import { parseProductSlug, getProductUrl } from "@/utils/url-helper";
import ProductDetail from "../../../../../components/product-detail";
import { getProductBySlug } from "@/sanity/sanity-utils";
import ProductContent from "@/components/product-detail/ProductContent";
import { getTranslations } from "next-intl/server";
import { buildCanonical, generateKeywords } from "@/lib/utils";

// Add formatPrice utility function
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export const generateMetadata = async (props: {
  params: Promise<{ name: string; locale: string }>;
  searchParams: Promise<{
    league?: string;
    difficulty?: string;
    gameVersion?: "path-of-exile-1" | "path-of-exile-2";
    locale?: string;
  }>;
}): Promise<Metadata> => {
  const params = await props.params;
  const searchParams = await props.searchParams;

  // Nome legível para o título
  const productName = await parseProductSlug(params.name);
  const t = await getTranslations({ locale: params.locale, namespace: "SEO" });

  // 1. URLs Canônicas e Alternativas (CLEAN URL ONLY for PoE 1; Param for PoE 2)
  // Determine Game Version (Default: POE 1)
  const targetGameVersion = searchParams.gameVersion || "path-of-exile-1";

  // Canonical: A versão desta página na língua atual e JOGO atual
  const canonicalPath = getProductUrl(productName, params.locale, undefined, undefined, targetGameVersion);

  // Alternates: Versões em outras línguas (mantendo o contexto do jogo)
  const enPath = getProductUrl(productName, 'en', undefined, undefined, targetGameVersion);
  const ptPath = getProductUrl(productName, 'pt-br', undefined, undefined, targetGameVersion);

  return {
    title: t("productDetail.title", { productName }),
    description: t("productDetail.description", { productName }),

    alternates: {
      canonical: canonicalPath,
      languages: {
        'en': enPath,
        'pt-BR': ptPath,
        'x-default': enPath,
      },
    },

    openGraph: {
      title: t("productDetail.title", { productName }),
      description: t("productDetail.description", { productName }),
      url: canonicalPath,
      type: "website",
      siteName: t("siteName"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("productDetail.title", { productName }),
      description: t("productDetail.description", { productName }),
    },
    keywords: generateKeywords({
      locale: params.locale,
      gameVersion: searchParams.gameVersion,
      league: searchParams.league,
      difficulty: searchParams.difficulty as 'softcore' | 'hardcore',
      productName: productName,
      customKeywords: ['buy', 'cheap', 'fast delivery', 'secure trading']
    })
  };
};

export default async function ProductDetailPage(props: {
  params: Promise<{ name: string, locale: string }>;
  searchParams: Promise<{
    league?: string;
    difficulty?: string;
    gameVersion?: "path-of-exile-1" | "path-of-exile-2";
    locale?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  try {
    const decodedName = await parseProductSlug(params.name);

    // ------------------------------------------------------------------
    // SMART LEAGUE DEFAULT LOGIC
    // ------------------------------------------------------------------
    // Determine Game Version (Default: POE 1)
    const targetGameVersion = searchParams.gameVersion || "path-of-exile-1";

    // Determine League
    // 1. Use param if exists
    // 2. Fetch active leagues and use first one (Primary Default)
    // 3. Last fallback: undefined (will fetch any)
    let targetLeague = searchParams.league;
    let activeLeagues: any[] = [];

    if (!targetLeague) {
      try {
        activeLeagues = await getLeagues(targetGameVersion);
        if (activeLeagues && activeLeagues.length > 0) {
          targetLeague = activeLeagues[0].name;
        }
      } catch (e) {
        console.warn("Failed to fetch default leagues", e);
      }
    } else {
      // If league provided, we still might want active leagues list for the dropdown later
      // Optimally we fetch it anyway
      activeLeagues = await getLeagues(targetGameVersion);
    }

    // Use the decoded name to find the specific product with SMART defaults
    const products = await getProductsWithParams({
      search: decodedName,
      league: targetLeague, // NOW using the smart default
      difficulty: searchParams.difficulty, // Default to undefined (any) -> ProductDetail handles selection
      gameVersion: targetGameVersion,
    });

    // If no product is found, try looser search (remove league filter check)
    // This handles cases where "Standard" might be the only option or Smart Default failed
    let productFn = products?.[0];

    if (!productFn && targetLeague) {
      // Retry without league filter to find ANY version of this product
      console.log("Smart default product not found, retrying without league filter...");
      const fallbackProducts = await getProductsWithParams({
        search: decodedName,
        gameVersion: targetGameVersion,
      });
      productFn = fallbackProducts?.[0];
    }

    if (!productFn) {
      return (
        <div className="container mx-auto py-16 px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
            <Link href="/products"><Button>Browse All Products</Button></Link>
          </div>
        </div>
      );
    }

    const product = productFn;
    const productSanity = await getProductBySlug(product.slug);

    // Dropdown Options
    const leagueOptions = activeLeagues.length > 0
      ? activeLeagues.map((l: any) => l.name)
      : [product.league]; // Fallback to product's own league if fetch failed

    const difficultyOptions = ["softcore", "hardcore"];
    const gameVersionOptions = [
      { value: "path-of-exile-1", label: "Path of Exile 1" },
      { value: "path-of-exile-2", label: "Path of Exile 2" },
    ];

    // Current selected values (for UI state)
    const currentLeague = targetLeague || product.league;
    const currentDifficulty = searchParams.difficulty || product.difficulty;

    // JSON-LD with CLEAN URL
    const productStructuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: productSanity?.body?.[0]?.children?.[0]?.text || product.name,
      image: product.imgUrl,
      sku: product.id?.toString() || product.name.replace(/\s+/g, '-'),
      offers: {
        "@type": "Offer",
        // Canonical URL in Schema too!
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}${getProductUrl(product.name, params.locale)}`,
        priceCurrency: "USD",
        price: product.price,
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: "Path of Trade" }
      }
    };

    return (
      <div className="container mx-auto py-6 md:py-12 px-4">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData) }}
        />

        <div className="max-w-6xl mx-auto rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="p-4 md:p-6 flex items-center justify-center bg-black/10 rounded-lg">
              <div className="relative w-full aspect-square max-w-[200px] md:max-w-[250px]">
                <Image
                  src={product.imgUrl || "/images/placeholder.jpg"}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                  quality={100}
                  priority // Hero image keeps priority
                />
              </div>
            </div>

            <ProductDetail
              product={product}
              currentGameVersion={targetGameVersion as any}
              currentLeague={currentLeague}
              currentDifficulty={currentDifficulty}
              gameVersionOptions={gameVersionOptions}
              leagueOptions={leagueOptions}
              difficultyOptions={difficultyOptions}
              productName={decodedName}
            />
          </div>
        </div>

        {productSanity?.body?.[params.locale === 'en' ? 'en' : 'pt_br'] && (
          <div className="p-4 md:p-6 mt-6 md:mt-12 bg-muted/10 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-100/40 mb-4">Description</h2>
            <ProductContent content={productSanity.body[params.locale === 'en' ? 'en' : 'pt_br']} />
          </div>
        )}
      </div>
    );
  } catch (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading product: {(error as Error).message}
      </div>
    );
  }
}

