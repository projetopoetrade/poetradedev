import { getProductsWithParams, getLeagues, getCurrentTempLeague } from "@/app/actions";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ProductDetail from "@/components/product-detail";
import { getProductBySlug } from "@/sanity/sanity-utils";
import ProductContent from "@/components/product-detail/ProductContent";
import PriceHistoryChart from "@/components/Product/PriceHistoryChart";
import { getTranslations } from "next-intl/server";
import { buildAbsoluteUrl, generateKeywords, buildBreadcrumbSchema, getOgLocale } from "@/lib/utils";
import { createAdminClient } from "@/utils/supabase/admin";
import { createPublicClient } from "@/utils/supabase/public";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProductVariantProvider } from "@/lib/contexts/product-variant-context";
import type { Product } from "@/lib/interface";

// ISR: revalidate cache every 5 minutes
// ISR: preço/estoque vêm do Supabase, invalidados por tag (`db-products`) pelas
// rotas em `/api/admin/products/*`. 6 h é o piso caso alguém escreva no banco
// por fora do Next — ver DB_CACHE_TTL em lib/cache-tags.ts.
export const revalidate = 21600;

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net";

export async function generateStaticParams() {
  try {
    const supabase = createAdminClient();

    // url_slug é o identificador canônico da URL (curto, sem liga). Cada produto
    // existe em 2 linhas (Standard/Mirage) com o MESMO url_slug, então
    // deduplicamos por (gameVersion, url_slug) para 1 entrada por jogo+slug.
    const { data } = await supabase
      .from('products')
      .select('url_slug, "gameVersion"')
      .eq('is_listed', true)
      .in('gameVersion', ['path-of-exile-1', 'path-of-exile-2']);

    const locales = ['en', 'pt-br'];

    // Deduplica por (gameVersion, url_slug); pula linhas com url_slug nulo.
    const seen = new Set<string>();
    const uniques: { gameVersion: string; slug: string }[] = [];
    for (const p of data || []) {
      const urlSlug = (p as { url_slug?: string | null }).url_slug;
      const gameVersion = (p as { gameVersion?: string }).gameVersion;
      if (!urlSlug || !gameVersion) continue;
      const key = `${gameVersion}::${urlSlug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      uniques.push({ gameVersion, slug: urlSlug });
    }

    return locales.flatMap(locale =>
      uniques.map(u => ({
        locale,
        gameVersion: u.gameVersion,
        slug: u.slug,
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

  const t = await getTranslations({ locale: params.locale, namespace: "SEO" });

  const gameVersionLabel = params.gameVersion === 'path-of-exile-2' ? 'PoE 2' : 'PoE 1';

  // Resolve o produto pelo url_slug (identificador canônico da URL). Qualquer
  // liga serve para o metadata, por isso não filtramos por liga aqui.
  const products = await getProductsWithParams({
    urlSlug: params.slug,
    gameVersion: params.gameVersion as "path-of-exile-1" | "path-of-exile-2",
  });
  const productFn = products?.[0];

  if (!productFn) {
    return { title: "Not Found" };
  }

  // Usa o NOME REAL do produto (não o slug decodificado) no título/descrição.
  const productName = productFn.name;

  let sanitySeoTitle: string | null = null;
  let sanityMetaDescription: string | null = null;

  // Sanity é chaveado pelo slug ORIGINAL (productFn.slug), nunca pelo url_slug.
  const productSanity = await getProductBySlug(productFn.slug) as any;
  const localeKey = params.locale === 'pt-BR' || params.locale === 'pt-br' ? 'pt_br' : 'en';

  if (productSanity?.seoTitle) sanitySeoTitle = productSanity.seoTitle[localeKey];
  if (productSanity?.metaDescription) sanityMetaDescription = productSanity.metaDescription[localeKey];

  const title = sanitySeoTitle || t("productDetail.title", { productName, gameVersionLabel });
  const description = sanityMetaDescription || t("productDetail.description", { productName, gameVersionLabel });

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
      ...getOgLocale(params.locale),
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
      productName: productName,
      customKeywords: ['buy', 'cheap', 'fast delivery', 'secure trading'],
    }),
  };
};

// Sem `searchParams`. Lê-los aqui tornava a rota dinâmica: apesar do
// `generateStaticParams` e do `revalidate` acima, esta página não aparecia no
// prerender-manifest e servia `Cache-Control: private, no-store` em toda visita
// — cada bot e cada usuário custavam uma invocação de função e uma rodada
// completa de Supabase + Sanity. E o filtro que os alimentava nem funcionava: o
// dropdown navegava para `/products/<nome>?league=...`, que faz
// `permanentRedirect` para cá descartando a query.
//
// Agora o servidor entrega a variante canônica (liga temp atual) mais todas as
// variantes de liga ativa, e o `ProductVariantProvider` troca no cliente.
export default async function ProductDetailPage(props: {
  params: Promise<{ slug: string; locale: string; gameVersion: string }>;
}) {
  const params = await props.params;

  try {
    const targetGameVersion = params.gameVersion as "path-of-exile-1" | "path-of-exile-2";

    // ------------------------------------------------------------------
    // SMART LEAGUE DEFAULT LOGIC
    // ------------------------------------------------------------------
    // 1. Prefere a liga temp atual (getCurrentTempLeague).
    // 2. Último fallback: primeira liga ativa registrada.
    let targetLeague: string | undefined;
    let activeLeagues: any[] = [];

    try {
      const tempLeague = await getCurrentTempLeague(targetGameVersion);
      activeLeagues = await getLeagues(targetGameVersion);
      targetLeague = tempLeague ?? activeLeagues?.[0]?.name;
    } catch (e) {
      console.warn("Failed to fetch default leagues", e);
    }

    // Uma consulta só, sem filtro de liga: devolve todas as linhas deste
    // url_slug. Antes eram duas idas ao banco (liga smart-default + fallback);
    // agora a desambiguação acontece em memória e as demais linhas viram as
    // variantes que o dropdown do cliente usa.
    // Sem filtro de gameVersion: as linhas das duas versões vêm juntas, então o
    // select de versão do jogo pode oferecer só as que existem de verdade em vez
    // de mandar o usuário para um 404.
    const allRows = await getProductsWithParams({ urlSlug: params.slug });
    const rows = (allRows ?? []).filter((r) => r.gameVersion === targetGameVersion);

    if (!rows.length) {
      notFound();
    }

    // Só ligas ativas viram opção. As inativas (ex.: uma liga encerrada cujas
    // linhas continuam no banco) seguem acessíveis por URL direta, mas não
    // devem aparecer num select como se dessem para comprar.
    const activeLeagueNames = new Set<string>(
      (activeLeagues ?? []).map((l: any) => l?.name).filter(Boolean),
    );
    const variants: Product[] = rows.filter((r) => activeLeagueNames.has(r.league));

    const product =
      variants.find((r) => r.league === targetLeague) ?? variants[0] ?? rows[0];
    // Sanity e histórico de preço usam o slug ORIGINAL (product.slug), que embute
    // a liga e é a chave compartilhada — NUNCA o url_slug.
    const productSanity = await getProductBySlug(product.slug);

    // Dropdown options — derivadas das variantes que existem de verdade, não de
    // uma lista fixa. O catálogo atual só tem linhas softcore; oferecer
    // "hardcore" era um select que não mudava nada.
    const leagueOptions = variants.length > 0
      ? Array.from(new Set(variants.map((v) => v.league)))
      : [product.league];

    const difficultyOptions = Array.from(
      new Set(variants.filter((v) => v.league === product.league).map((v) => v.difficulty)),
    );
    const GAME_VERSION_LABELS: Record<string, string> = {
      "path-of-exile-1": "Path of Exile 1",
      "path-of-exile-2": "Path of Exile 2",
    };
    const gameVersionOptions = Array.from(new Set((allRows ?? []).map((r) => r.gameVersion)))
      .filter((v) => v in GAME_VERSION_LABELS)
      .sort()
      .map((v) => ({ value: v, label: GAME_VERSION_LABELS[v] }));

    const currentLeague = product.league;
    const currentDifficulty = product.difficulty;

    // Itens relacionados para o bloco de links no rodapé. createPublicClient
    // (sem cookies) para não acrescentar mais um motivo de render dinâmico.
    // Deduplica por url_slug: o mesmo item existe em várias ligas.
    const relatedProducts: Array<{ name: string; url_slug: string }> = await (async () => {
      try {
        const supabase = createPublicClient();
        const { data } = await supabase
          .from("products")
          .select("name, url_slug")
          .eq("gameVersion", targetGameVersion)
          .eq("is_listed", true)
          .eq("category", product.category || "Currency")
          .neq("url_slug", product.url_slug)
          .not("url_slug", "is", null)
          .limit(60);

        const seen = new Set<string>();
        const unique: Array<{ name: string; url_slug: string }> = [];
        for (const p of data || []) {
          if (!p.url_slug || seen.has(p.url_slug)) continue;
          seen.add(p.url_slug);
          unique.push({ name: p.name, url_slug: p.url_slug });
        }
        return unique.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 16);
      } catch {
        return [];
      }
    })();

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

        {/* Preço, seletor de liga e gráfico de histórico compartilham a mesma
            seleção. O provider é client component, mas os filhos continuam
            renderizados no servidor — só a variante escolhida atravessa. */}
        <ProductVariantProvider variants={variants} initial={product}>
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
              productName={product.name}
              seoTitle={seoTitle}
              urlSlug={product.url_slug}
              locale={params.locale}
            />
          </div>
        </div>

        {/* Price History */}
        <div className="max-w-6xl mx-auto mt-8">
          <PriceHistoryChart productSlug={product.slug} league={currentLeague} />
        </div>
        </ProductVariantProvider>

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

        {/* Itens relacionados.
            Cada página de produto era uma ilha: o único link de saída era o
            "voltar" para a categoria. São ~388 páginas, muitas rankeando em
            posição 8-12, sem passar autoridade entre si nem dar ao leitor um
            caminho lateral. Links canônicos diretos, sem passar pelo 301. */}
        {relatedProducts.length > 0 && (
          <div className="max-w-6xl mx-auto mt-8">
            <div className="p-4 md:p-6 bg-muted/5 rounded-xl border border-white/5">
              <h2 className="text-xl font-bold text-gray-100 mb-4">
                {isPt
                  ? `Outros itens de ${product.category || 'currency'}`
                  : `More ${(product.category || 'currency').toLowerCase()} in ${gameVersionLabel}`}
              </h2>
              <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
                {relatedProducts.map((rel) => (
                  <li key={rel.url_slug}>
                    <Link
                      href={`${params.locale === 'en' ? '' : `/${params.locale}`}/games/${targetGameVersion}/products/${rel.url_slug}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isPt ? `Preço ${rel.name}` : `${rel.name} price`}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    // Re-lança os erros de controle de fluxo do Next (notFound/redirect). Sem
    // isto, o notFound() cairia neste catch e devolveria 200 com erro em vez de
    // um 404 real (ruim para SEO/crawl). Next sinaliza via erro com digest
    // "NEXT_..." (em v15 o not-found usa "NEXT_HTTP_ERROR_FALLBACK;404").
    if (
      error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_")
    ) {
      throw error;
    }
    return (
      <div className="text-red-500 p-4">
        Error loading product: {(error as Error).message}
      </div>
    );
  }
}
