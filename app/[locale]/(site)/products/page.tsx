import { getProductsWithParams } from "@/app/actions";
import ProductsClient from "@/components/products-client";
import { Metadata } from "next";
import { SearchParamsStorage } from "@/components/search-params-storage";
import { CurrencyInfo } from "@/components/currency-info";


type SearchParams = {
  gameVersion?: string;
  league?: string;
  difficulty?: string;
  category?: string;
  search?: string;
};

export async function generateMetadata(
  props: {
    searchParams: Promise<SearchParams>;
  }
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const league = searchParams.league || "All Leagues";
  const category = searchParams.category || "All Items";
  const gameVersion = searchParams.gameVersion || "Current";

  return {
    title: `${gameVersion} ${category} - ${league} | Path of Trade Net`,
    description: `Search  and buy ${gameVersion} ${category} for the ${league} league. Secure trading on Path of Trade Net.`,
    openGraph: {
      title: `Best Price: ${category} - PoE ${league} Currency | PathofTrade.net`,
      description: `Find the best deals on Path of Exile ${category} for ${league} at PathofTrade.net. We offer cheap PoE currency, instant delivery, and 100% secure transactions for your ${gameVersion} gameplay.`,
      type: "website",
    }, 
    alternates: {
      canonical: `https://www.pathoftrade.net/products?league=${league}&gameVersion=${gameVersion}&category=${category}`,
    },
  };
}

export default async function ProductsPage(
  props: {
    searchParams: Promise<SearchParams>;
  }
) {
  const searchParams = await props.searchParams;
  try {
    const products = await getProductsWithParams(searchParams);
    const league = searchParams.league || "All Leagues";
    const difficulty = searchParams.difficulty || "All Difficulties";
    const category = searchParams.category || "All Items";
    const gameVersion = searchParams.gameVersion || "Current";

    const baseUrl = 'https://pathoftrade.net/products';
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
          
          const productImageUrl = product.imgUrl || "https://pathoftrade.net/images/default.png";
          const productUrl =  `/products/${encodeURIComponent(product.name)}?gameVersion=${encodeURIComponent(product.gameVersion)}&league=${encodeURIComponent(product.league)}&difficulty=${encodeURIComponent(product.difficulty)}`;
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
        <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogStructuredData) }}
      />
        <div className="bg-indigo-700 inline-block min-w-[320px] md:min-w-[380px] rounded-tl-md rounded-tr-sm py-2 px-4 shadow-lg">
          <h2 className="text-lg md:text-3xl text-center text-white font-bold antialiased capitalize tracking-wider">
            {league} - {difficulty}
          </h2>
        </div>

        <ProductsClient 

          products={products} 
          initialFilters={{
            gameVersion,
            league,
            difficulty
          }}
        />
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
