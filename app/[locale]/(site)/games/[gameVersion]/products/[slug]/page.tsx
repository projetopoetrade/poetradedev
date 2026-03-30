import { getProductsWithParams, getLeagues } from "@/app/actions";
import { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { parseProductSlug } from "@/utils/url-helper";
import ProductDetail from "../../../../../../components/product-detail";
import { getProductBySlug } from "@/sanity/sanity-utils";
import ProductContent from "@/components/product-detail/ProductContent";
import PriceHistoryChart from "@/components/Product/PriceHistoryChart";
import { getTranslations } from "next-intl/server";
import { buildAbsoluteUrl, generateKeywords, buildBreadcrumbSchema } from "@/lib/utils";
import { createAdminClient } from "@/utils/supabase/admin";
import { Breadcrumb } from "@/components/ui/breadcrumb";

// ISR: revalidate cache every 5 minutes
export const revalidate = 300;

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net";

export async function generateStaticParams() {
  try {
    const supabase = createAdminClient();

    const { data } = await supabase
      .from('products')
      .select('slug, locale')
      .eq('is_listed', true)
      .eq('gameVersion', 'path-of-exile-2');

    const locales = ['en', 'pt-br'];

    return locales.flatMap(locale =>
      (data || []).map(p => ({
        locale,
        gameVersion: 'path-of-exile-2',
        slug: p.slug,
      }))
    );
  } catch (error) {
    console.error('generateStaticParams error:', error);
    return [];
  }
}

export const generateMetadata = async (props: {
  params: Promise<{ slug: string; locale: string; gameVersion: string }>;
}): Promise<Metadata> => {
  const params = await props.params;

  const decodedName = parseProductSlug(params.slug);
  const t = await getTranslations({ locale: params.locale, namespace: "SEO" });

  const gameVersionLabel = params.gameVersion === 'path-of-exile-2' ? 'PoE 2' : 'PoE 1';

  // Fetch product for SEO and image
  const products = await getProductsWithParams({
    search: decodedName,
    gameVersion: params.gameVersion as "path-of-exile-1" | "path-of-exile-2",
  });
  const productFn = products?.[0];

  let sanitySeoTitle: string | null = null;
  let sanityMetaDescription: string | null = null;

  if (productFn) {
    const productSanity = await getProductBySlug(productFn.slug) as any;
    const localeKey = params.locale === 'pt-BR' || params.locale === 'pt-br' ? 'pt_br' : 'en';

    if (productSanity?.seoTitle) sanitySeoTitle = productSanity.seoTitle[localeKey];
    if (productSanity?.metaDescription) sanityMetaDescription = productSanity.metaDescription[localeKey];
  }

  const title = sanitySeoTitle || t("productDetail.title", { productName: decodedName, gameVersionLabel });
  const description = sanityMetaDescription || t("productDetail.description", { productName: decodedName, gameVersionLabel });

  // Canonical and hreflang
  const basePath = `/games/${params.gameVersion}/products/${params.slug}`;
  const enUrl = `${baseUrl}${basePath}`;
  const ptUrl = `${baseUrl}/pt-br${basePath}`;
  const canonicalUrl = params.locale === 'en' ? enUrl : ptUrl;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': enUrl,
        'pt-BR': ptUrl,
        'x-default': enUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
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
      gameVersion: params.gameVersion as "path-of-exile-1" | "path-of-exile-2",
      productName: decodedName,
      customKeywords: ['buy', 'cheap', 'fast delivery', 'secure trading'],
    }),
  };
};

export default async function ProductDetailPage(props: {
  params: Promise<{ slug: string; locale: string; gameVersion: string }>;
  searchParams: Promise<{
    league?: string;
    difficulty?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  try {
    const decodedName = parseProductSlug(params.slug);
    const targetGameVersion = params.gameVersion as "path-of-exile-1" | "path-of-exile-2";

    // ------------------------------------------------------------------
    // SMART LEAGUE DEFAULT LOGIC
    // ------------------------------------------------------------------
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
      activeLeagues = await getLeagues(targetGameVersion);
    }

    // Fetch product with smart defaults
    const products = await getProductsWithParams({
      search: decodedName,
      league: targetLeague,
      difficulty: searchParams.difficulty,
      gameVersion: targetGameVersion,
    });

    let productFn = products?.[0];

    if (!productFn && targetLeague) {
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
            <Link href={`/games/${params.gameVersion}/currency`}>
              <Button>Browse All Products</Button>
            </Link>
          </div>
        </div>
      );
    }

    const product = productFn;
    const productSanity = await getProductBySlug(product.slug);

    // Dropdown options
    const leagueOptions = activeLeagues.length > 0
      ? activeLeagues.map((l: any) => l.name)
      : [product.league];

    const difficultyOptions = ["softcore", "hardcore"];
    const gameVersionOptions = [
      { value: "path-of-exile-1", label: "Path of Exile 1" },
      { value: "path-of-exile-2", label: "Path of Exile 2" },
    ];

    const currentLeague = targetLeague || product.league;
    const currentDifficulty = searchParams.difficulty || product.difficulty;

    // priceValidUntil: 30 days from build time
    const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const gameVersionLabel = targetGameVersion === 'path-of-exile-2'
      ? 'Path of Exile 2'
      : 'Path of Exile 1';

    const localeKey = params.locale === 'pt-BR' || params.locale === 'pt-br' ? 'pt_br' : 'en';
    const isPt = params.locale === 'pt-br' || params.locale === 'pt-BR';

    const seoTitle = (productSanity as any)?.seoTitle?.[localeKey]
      || (isPt
        ? `Comprar ${product.name} para ${gameVersionLabel} | Path of Trade`
        : `Buy ${product.name} for ${gameVersionLabel} | Path of Trade`);

    const schemaDescription =
      (productSanity as any)?.metaDescription?.[localeKey] ||
      (isPt
        ? `Compre ${product.name} para ${gameVersionLabel}. Entrega rápida no jogo, negociação segura e melhores preços no Path of Trade.`
        : `Buy ${product.name} for ${gameVersionLabel}. Fast in-game delivery, secure trading, best prices at Path of Trade.`);

    // Canonical URL for schema
    const schemaUrl = buildAbsoluteUrl(`/games/${params.gameVersion}/products/${params.slug}`);

    // Breadcrumb schema
    const gameLabel = params.gameVersion === 'path-of-exile-2' ? 'Path of Exile 2' : 'Path of Exile 1';
    const gameUrl = `/games/${params.gameVersion}`;

    const breadcrumbSchema = buildBreadcrumbSchema([
      { name: isPt ? 'Início' : 'Home', url: '/' },
      { name: gameLabel, url: gameUrl },
      { name: isPt ? 'Produtos' : 'Products', url: `${gameUrl}/currency` },
      { name: product.name, url: `${gameUrl}/products/${params.slug}` },
    ]);

    // FAQ data
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
          ? `Is it possible to buy ${product.name} for other leagues or ${targetGameVersion === 'path-of-exile-2' ? 'PoE 1' : 'PoE 2'}?`
          : `É possível comprar ${product.name} para outras ligas ou ${targetGameVersion === 'path-of-exile-2' ? 'PoE 1' : 'PoE 2'}?`,
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
            { label: gameLabel, href: gameUrl },
            { label: isPt ? 'Produtos' : 'Products', href: `${gameUrl}/currency` },
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
                  ? `${gameUrl}/${catSlug}`
                  : `${gameUrl}/currency`;
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
              currentGameVersion={targetGameVersion}
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

        {(productSanity as any)?.body?.[params.locale === 'en' ? 'en' : 'pt_br'] && (
          <div className="max-w-6xl mx-auto mt-8">
            <div className="p-4 md:p-6 bg-muted/10 rounded-xl border border-white/5">
              <h2 className="text-lg font-semibold text-gray-100/40 mb-4">{isPt ? 'Descrição' : 'Description'}</h2>
              <ProductContent content={(productSanity as any).body[params.locale === 'en' ? 'en' : 'pt_br']} />
            </div>
          </div>
        )}

        {/* FAQ Section */}
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
