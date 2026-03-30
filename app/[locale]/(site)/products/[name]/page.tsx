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
import PriceHistoryChart from "@/components/Product/PriceHistoryChart";
import { getTranslations } from "next-intl/server";
import { buildCanonical, buildAbsoluteUrl, generateKeywords, buildBreadcrumbSchema } from "@/lib/utils";
import { createAdminClient } from "@/utils/supabase/admin";
import { Breadcrumb } from "@/components/ui/breadcrumb";

// ISR: revalidate cache every 5 minutes
export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const supabase = createAdminClient();
    
    const { data } = await supabase
      .from('products')
      .select('slug')
      .eq('is_listed', true);
    
    const locales = ['en', 'pt-br'];
    
    return locales.flatMap(locale => 
      (data || []).map(p => ({
        locale,
        name: p.slug
      }))
    );
  } catch (error) {
    console.error('generateStaticParams error:', error);
    return [];
  }
}

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
  const decodedName = await parseProductSlug(params.name);
  const t = await getTranslations({ locale: params.locale, namespace: "SEO" });

  // 1. URLs Canônicas e Alternativas (CLEAN URL ONLY for PoE 1; Param for PoE 2)
  // Determine Game Version (Default: POE 1)
  const targetGameVersion = searchParams.gameVersion || "path-of-exile-1";

  // Game version label for description
  const gameVersionLabel = targetGameVersion === 'path-of-exile-2'
    ? 'PoE 2'
    : 'PoE 1';

  // Buscar SEO no Sanity (caso o script de inteligência já tenha populado)
  const products = await getProductsWithParams({
    search: decodedName,
    gameVersion: targetGameVersion,
  });
  const productFn = products?.[0];
  let sanitySeoTitle = null;
  let sanityMetaDescription = null;

  if (productFn) {
    const productSanity = await getProductBySlug(productFn.slug) as any;
    const localeKey = params.locale === 'pt-BR' || params.locale === 'pt-br' ? 'pt_br' : 'en';

    if (productSanity?.seoTitle) sanitySeoTitle = productSanity.seoTitle[localeKey];
    if (productSanity?.metaDescription) sanityMetaDescription = productSanity.metaDescription[localeKey];
  }

  // Canonical: A versão desta página na língua atual e JOGO atual
  const canonicalPath = getProductUrl(productName, params.locale, undefined, undefined, targetGameVersion);

  // Alternates: Versões em outras línguas (mantendo o contexto do jogo)
  const enPath = getProductUrl(productName, 'en', undefined, undefined, targetGameVersion);
  const ptPath = getProductUrl(productName, 'pt-br', undefined, undefined, targetGameVersion);

  const title = sanitySeoTitle || t("productDetail.title", { productName, gameVersionLabel });
  const description = sanityMetaDescription || t("productDetail.description", { productName, gameVersionLabel });

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        'en': enPath,
        'pt-BR': ptPath,
        'x-default': enPath,
      },
    },

    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: "website",
      siteName: t("siteName"),
      images: productFn?.imgUrl ? [{ url: productFn.imgUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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

    // priceValidUntil: 30 days from build time
    const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Game version label for description
    const gameVersionLabel = targetGameVersion === 'path-of-exile-2'
      ? 'Path of Exile 2'
      : 'Path of Exile 1';

    const localeKey = params.locale === 'pt-BR' || params.locale === 'pt-br' ? 'pt_br' : 'en';

    const isPt = params.locale === 'pt-br' || params.locale === 'pt-BR';

    const seoTitle = (productSanity as any)?.seoTitle?.[localeKey]
      || (isPt
        ? `Comprar ${product.name} para ${gameVersionLabel} | Path of Trade`
        : `Buy ${product.name} for ${gameVersionLabel} | Path of Trade`);

    // Transactional description fallback when Sanity has no body text
    const schemaDescription =
      productSanity?.metaDescription?.[localeKey] ||
      (isPt
        ? `Compre ${product.name} para ${gameVersionLabel}. Entrega rápida no jogo, negociação segura e melhores preços no Path of Trade.`
        : `Buy ${product.name} for ${gameVersionLabel}. Fast in-game delivery, secure trading, best prices at Path of Trade.`);

    // Canonical URL — buildAbsoluteUrl avoids double-slash when getProductUrl already starts with /
    const schemaUrl = buildAbsoluteUrl(getProductUrl(product.name, params.locale));

    // BreadcrumbList schema
    const breadcrumbSchema = buildBreadcrumbSchema([
      { name: isPt ? 'Início' : 'Home', url: '/' },
      { name: isPt ? 'Produtos' : 'Products', url: '/products' },
      { name: product.name, url: getProductUrl(product.name, params.locale) },
    ]);

    // Dynamic FAQ Data
    const faqData = [
      {
        question: params.locale === 'en'
          ? `Is it safe to buy ${product.name} for ${gameVersionLabel} here?`
          : `É seguro comprar ${product.name} para ${gameVersionLabel} aqui?`,
        answer: params.locale === 'en'
          ? `Yes! Buying ${product.name} at Path of Trade is 100% secure. We use safe in-game trading methods to ensure your account is protected at all times.`
          : `Sim! Comprar ${product.name} no Path of Trade é 100% seguro. Usamos métodos seguros de troca no jogo para garantir a proteção da sua conta.`
      },
      {
        question: params.locale === 'en'
          ? `How fast is the delivery for ${product.name}?`
          : `Quão rápida é a entrega para ${product.name}?`,
        answer: params.locale === 'en'
          ? `We typically deliver ${product.name} within 5 to 15 minutes of payment confirmation in the ${currentLeague} league.`
          : `Nós normalmente entregamos ${product.name} entre 5 e 15 minutos após a confirmação do pagamento na liga ${currentLeague}.`
      },
      {
        question: params.locale === 'en'
          ? `How will I receive my ${product.name} in-game?`
          : `Como vou receber meu ${product.name} no jogo?`,
        answer: params.locale === 'en'
          ? `After your purchase is confirmed, our team will invite you to a party in-game. We usually trade face-to-face in your hideout or a town. Make sure to put a random rare item in the trade window for extra safety.`
          : `Após a confirmação da compra, nossa equipe convidará você para um grupo no jogo. Geralmente negociamos cara a cara no seu refúgio (hideout) ou em uma cidade. Coloque um item raro aleatório na janela de troca para maior segurança.`
      },
      {
        question: params.locale === 'en'
          ? `Is it possible to buy ${product.name} for other leagues or ${targetGameVersion === 'path-of-exile-1' ? 'PoE 2' : 'PoE 1'}?`
          : `É possível comprar ${product.name} para outras ligas ou ${targetGameVersion === 'path-of-exile-1' ? 'PoE 2' : 'PoE 1'}?`,
        answer: params.locale === 'en'
          ? `Yes, you can use the dropdown filters on this page to check the availability and current price of ${product.name} across different game versions and active leagues.`
          : `Sim, você pode usar os filtros nesta página para verificar a disponibilidade e o preço atual de ${product.name} em diferentes versões do jogo e ligas ativas.`
      },
      {
        question: params.locale === 'en'
          ? `What payment methods are accepted to buy ${product.name}?`
          : `Quais métodos de pagamento são aceitos para comprar ${product.name}?`,
        answer: params.locale === 'en'
          ? `We accept a variety of secure payment methods including PIX, Credit Cards, and other local options depending on your region. Check our checkout page for the full list.`
          : `Aceitamos uma variedade de métodos de pagamento seguros, incluindo PIX, Cartões de Crédito e outras opções locais dependendo da sua região. Verifique nossa página de checkout para a lista completa.`
      }
    ];

    // FAQPage schema (dynamically generated from the array)
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqData.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };

    // JSON-LD with CLEAN URL
    const productStructuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: schemaDescription,
      image: product.imgUrl,
      sku: product.id?.toString() || product.name.replace(/\s+/g, '-'),
      brand: {
        "@type": "Brand",
        name: gameVersionLabel,
      },
      category: product.category || "Currency",
      offers: {
        "@type": "Offer",
        url: schemaUrl,
        priceCurrency: "USD",
        price: product.price,
        priceValidUntil: priceValidUntil,
        availability: product.in_stock !== false
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: "Path of Trade" },
        itemCondition: "https://schema.org/NewCondition",
      }
    };

return (
      <div className="container mx-auto py-6 md:py-12 px-4">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />

        <Breadcrumb
          items={[
            { label: params.locale === 'pt-br' ? 'Produtos' : 'Products', href: '/products' },
            { label: product.name },
          ]}
        />

        <div className="max-w-6xl mx-auto rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="sticky top-4 flex flex-col items-center justify-start p-8 md:p-12 gap-4">
              {(() => {
                const catSlug = product.category?.toLowerCase();
                const validCats = ['currency', 'items', 'services'];
                const backHref = validCats.includes(catSlug)
                  ? `/games/${targetGameVersion}/${catSlug}`
                  : '/products';
                const backLabel = params.locale === 'en'
                  ? catSlug === 'currency' ? 'Back to Currency'
                  : catSlug === 'items' ? 'Back to Items'
                  : catSlug === 'services' ? 'Back to Services'
                  : 'Back to Products'
                  : catSlug === 'currency' ? 'Voltar às Moedas'
                  : catSlug === 'items' ? 'Voltar aos Itens'
                  : catSlug === 'services' ? 'Voltar aos Serviços'
                  : 'Voltar aos Produtos';
                return (
                  <Link href={backHref} className="self-start flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    {backLabel}
                  </Link>
                );
              })()}
              <div className="flex-1 flex items-center justify-center">
              <div className="relative w-[188px] h-[188px]">
                <Image
                  src={product.imgUrl || "/images/placeholder.jpg"}
                  alt={product.name}
                  fill
                  sizes="188px"
                  className="object-contain"
                  quality={100}
                  priority
                />
              </div>
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
              seoTitle={seoTitle}
            />
          </div>
        </div>

        {/* Price History */}
        <div className="max-w-6xl mx-auto mt-8">
          <PriceHistoryChart productSlug={product.slug} league={currentLeague} />
        </div>

        {productSanity?.body?.[params.locale === 'en' ? 'en' : 'pt_br'] && (
          <div className="max-w-6xl mx-auto mt-8">
            <div className="p-4 md:p-6 bg-muted/10 rounded-xl border border-white/5">
              <h2 className="text-lg font-semibold text-gray-100/40 mb-4">{isPt ? 'Descrição' : 'Description'}</h2>
              <ProductContent content={productSanity.body[params.locale === 'en' ? 'en' : 'pt_br']} />
            </div>
          </div>
        )}

        {/* FAQ Section Render */}
        <div className="max-w-6xl mx-auto mt-8">
        <div className="p-4 md:p-6 bg-muted/5 rounded-xl border border-white/5">
          <h2 className="text-xl font-bold text-gray-100 mb-6">
            {params.locale === 'en' ? 'Frequently Asked Questions' : 'Perguntas Frequentes'}
          </h2>
          <div className="space-y-6">
            {faqData.map((faq, index) => (
              <div key={index} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                <h3 className="text-lg font-medium text-gray-200 mb-2">{faq.question}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
        </div>
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

