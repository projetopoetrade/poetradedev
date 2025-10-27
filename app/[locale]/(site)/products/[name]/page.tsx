import { getProductsWithParams, getLeagues } from "@/app/actions";
import { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Filters from "./filters";
import { parseProductSlug } from "@/utils/url-helper";
import ProductDetail from "../../../../../components/product-detail";
import { getProductBySlug } from "@/sanity/sanity-utils";
import ProductContent from "@/components/product-detail/ProductContent";
import { getTranslations } from "next-intl/server";
import { buildCanonical } from "@/lib/utils";

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
}): Promise<Metadata> => {
  const params = await props.params;
  // Get a readable product name from the URL slug
  const productName = await parseProductSlug(params.name);

  const t = await getTranslations({ locale: params.locale, namespace: "SEO" });
  const title = t("productDetail.title", { productName });
  const description = t("productDetail.description", { productName });
  const canonical = buildCanonical(`/${params.locale}/products/${encodeURIComponent(params.name)}`, params.locale);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: t("siteName")
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
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
    // Get the decoded product name for searching
    const decodedName = await parseProductSlug(params.name);

    // Convert locale format before using it
    let currentLocale = searchParams.locale || params.locale;
    if(currentLocale === "pt-br") {
      currentLocale = "pt_br";
    }

    // Use the decoded name to find the specific product
    const products = await getProductsWithParams({
      search: decodedName,
      league: searchParams.league,
      difficulty: searchParams.difficulty,
      gameVersion: searchParams.gameVersion,
    });

    // If no product is found, show an error
    if (!products || products.length === 0) {
      return (
        <div className="container mx-auto py-16 px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
            <p className="mb-8 text-muted-foreground">
              The product '{decodedName}' could not be found. It may have been
              removed or doesn't exist.
            </p>
            <Link href="/products">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Browse All Products
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    // Use the first product from the results
    const product = products[0];

    // Fetch product details from Sanity
    const productSanity = await getProductBySlug(product.slug);

    // Fetch leagues from database based on product's game version
    const currentGameVersion = searchParams.gameVersion || product.gameVersion;
    const leaguesData = await getLeagues(
      currentGameVersion as "path-of-exile-1" | "path-of-exile-2"
    );
    const leagueOptions = leaguesData.map((league) => league.name);

    // Difficulty options
    const difficultyOptions = ["softcore", "hardcore"];

    // Game version options
    const gameVersionOptions = [
      { value: "path-of-exile-1", label: "Path of Exile 1" },
      { value: "path-of-exile-2", label: "Path of Exile 2" },
    ];

    // Current selected values
    const currentLeague = searchParams.league || product.league;
    const currentDifficulty = searchParams.difficulty || product.difficulty;


    const productStructuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: productSanity?.body?.[0]?.children?.[0]?.text || product.name,
      image: product.imgUrl,
      sku: product.id?.toString() || product.name.replace(/\s+/g, '-'),
      category: "Virtual Goods > Game Currency",
      brand: {
        "@type": "Brand",
        name: product.gameVersion === "path-of-exile-1" ? "Path of Exile 1" : "Path of Exile 2",
      },
      offers: {
        "@type": "Offer",
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}${params.locale === 'en' ? '' : `/${params.locale}`}/products/${encodeURIComponent(product.name)}?league=${encodeURIComponent(product.league)}&difficulty=${encodeURIComponent(product.difficulty)}&gameVersion=${encodeURIComponent(product.gameVersion)}`,
        priceCurrency: "USD",
        price: product.price,
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        priceValidUntil: new Date(new Date().setDate(new Date().getDate() + 30))
          .toISOString()
          .split("T")[0],
        seller: {
          "@type": "Organization",
          name: "Path of Trade",
          url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net",
        },
      },
      // Additional metadata for better SEO
      additionalProperty: [
        {
          "@type": "PropertyValue",
          name: "League",
          value: product.league
        },
        {
          "@type": "PropertyValue",
          name: "Difficulty",
          value: product.difficulty
        },
        {
          "@type": "PropertyValue",
          name: "Game Version",
          value: product.gameVersion
        }
      ]
    };

    return (
      <div className="container mx-auto py-6 md:py-12 px-4">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productStructuredData),
          }}
        />

        <div className="max-w-6xl mx-auto rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {/* Product Image */}
            <div className="p-4 md:p-6 flex items-center justify-center bg-black/10 rounded-lg">
              <div className="relative w-full aspect-square max-w-[200px] md:max-w-[250px]">
                <Image
                  src={product.imgUrl || "/images/placeholder.jpg"}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                  quality={100}
                  priority
                />
              </div>
            </div>

            {/* Product Info */}
            <ProductDetail
              product={product}
              currentGameVersion={currentGameVersion}
              currentLeague={currentLeague}
              currentDifficulty={currentDifficulty}
              gameVersionOptions={gameVersionOptions}
              leagueOptions={leagueOptions}
              difficultyOptions={difficultyOptions}
              productName={decodedName}
            />
          </div>
        </div>

        {/* Description Section */}
        {productSanity?.body?.[currentLocale] && (
          <div className="p-4 md:p-6 mt-6 md:mt-12 bg-muted/10 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-100/40 mb-4">Description</h2>
            <ProductContent content={productSanity.body[currentLocale]} />
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

