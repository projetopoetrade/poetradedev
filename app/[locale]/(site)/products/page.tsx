import { getProductsWithParams } from "@/app/actions";
import ProductsClient from "@/components/products-client";
import { Metadata } from "next";
import { SearchParamsStorage } from "@/components/search-params-storage";
import { CurrencyInfo } from "@/components/currency-info";
import PatchInfo from "@/components/PatchInfo";
import { getCurrentPatch } from "@/lib/patch-from-league";
import { getTranslations } from "next-intl/server";
import { generateKeywords } from "@/lib/utils"; // Removi buildCanonical pois vamos montar manualmente aqui
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";

// ISR: revalidate every 5 minutes for faster bot crawling
export const revalidate = 300;

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
// Nao le `searchParams`: ler aqui tornaria a rota dinamica tanto quanto ler no
// componente. Como a canonical sempre apontou para a URL limpa, o titulo e a
// descricao passam a descrever a listagem completa — que e o que a versao
// indexavel de fato mostra.
export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "SEO" });

  const league = "All Leagues";
  const category = "All Items";
  const gameVersion = "Current";

  // Base URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net";

  // URLs canônicas sem query params — evita indexar variações filtradas
  const enUrl = `${baseUrl}/products`;
  const ptUrl = `${baseUrl}/pt-br/products`;

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
      customKeywords: ['buy', 'cheap', 'best price', 'fast delivery']
    })
  };
}

// ---------------------------------------------------------
// COMPONENTE DA PÁGINA
// ---------------------------------------------------------
// A pagina nao le mais `searchParams`: todos os produtos listados vem no payload
// estatico e a filtragem (categoria, busca, liga, dificuldade, versao) acontece
// no cliente, em `ProductsClient`. Antes, cada combinacao de filtro era uma
// execucao de funcao no servidor — e a canonical ja apontava para a URL limpa,
// entao essas variacoes nunca foram indexaveis.
export default async function ProductsPage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "Products" });

  try {
    const products = await getProductsWithParams({ isListed: true });

    // Estado nao-filtrado: e o que a versao estatica representa.
    const league = "All Leagues";
    const difficulty = "All Difficulties";
    const category = "All Items";
    const gameVersion = "Current";

    // Esta página é o catálogo geral, sem jogo selecionado — mostramos o patch de
    // PoE 1, que é o carro-chefe. Antes recebia a string "Current", que não casava
    // com chave nenhuma e sempre caía no estado vazio.
    const currentPatch = await getCurrentPatch("path-of-exile-1", locale);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net";
    const path = locale === 'en' ? '/products' : `/${locale}/products`;
    const pageUrl = `${baseUrl}${path}`;

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
      <main className="container mx-auto py-8">
        <SearchParamsStorage />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogStructuredData) }}
        />

        <div className="mb-12">
          {/* Header da Liga */}
          <div className="bg-indigo-700 rounded-t-lg py-2 px-4 md:mt-10 md:px-8 shadow-lg flex items-center justify-between max-w-[520px]">
            <Link
              href={`/games/${gameVersion === "Current" ? "path-of-exile-1" : gameVersion}`}
              className="flex items-center text-white hover:text-indigo-200 transition-colors group"
              aria-label={t("backToLeagues")}
            >
              <ArrowLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <h1 className="text-md md:text-2xl text-center text-white font-bold antialiased capitalize tracking-wider flex-1">
              {league} - {difficulty}
            </h1>
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

        <PatchInfo patch={currentPatch} />
        <CurrencyInfo gameVersion={gameVersion} />

        {(() => {
          const isPt = locale === "pt-br";
          return (
            <section className="mt-12 border-t border-border pt-8">
              <div className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-3xl space-y-4">
                {isPt ? (
                  <>
                    <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                      Comprando currency de Path of Exile com segurança
                    </h2>
                    <p>
                      Currency em Path of Exile não é apenas dinheiro: orbs como Divine,
                      Exalted e Chaos são a base de todo crafting, troca e progressão no
                      endgame. Conseguir esses recursos farmando pode levar muitas horas, e
                      é por isso que muitos jogadores preferem comprar a quantidade exata que
                      precisam para montar a build dos sonhos sem interromper o ritmo da liga.
                    </p>
                    <p>
                      Trabalhamos com entrega in-game feita por pessoas reais: depois do
                      pagamento, combinamos um encontro no jogo e transferimos os itens
                      diretamente para o seu personagem em poucos minutos, respeitando as
                      regras de troca da Grinding Gear Games. Aceitamos os principais métodos
                      de pagamento, incluindo cartão, carteiras digitais e PIX para clientes
                      do Brasil, o que torna a confirmação praticamente instantânea.
                    </p>
                    <p>
                      Nossos preços acompanham o mercado em tempo real e são revisados ao
                      longo de cada liga, para que você sempre pague um valor justo seja no
                      início, quando a economia ainda está se formando, seja no endgame. Use
                      os filtros acima para escolher a versão do jogo, a liga e a dificuldade,
                      e fale com a gente caso tenha qualquer dúvida antes de finalizar.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                      Trading Path of Exile currency the safe way
                    </h2>
                    <p>
                      Currency in Path of Exile is far more than money: orbs like Divine,
                      Exalted and Chaos underpin every bit of crafting, trading and endgame
                      progression. Farming those resources can take many hours, which is why
                      a lot of players prefer to pick up exactly the amount they need to
                      finish a build instead of grinding against the clock of a fresh league.
                    </p>
                    <p>
                      Every order is delivered in-game by real people. Once your payment
                      clears we arrange a quick meeting inside the game and hand the items
                      straight to your character within minutes, always following Grinding
                      Gear Games&apos; trading rules. We support the major payment methods,
                      including cards and digital wallets, plus PIX for customers in Brazil,
                      so confirmation is usually close to instant.
                    </p>
                    <p>
                      Our prices track the live market and are reviewed throughout each
                      league, so you get a fair rate whether you shop during the opening days
                      while the economy settles or deep into the endgame. Use the filters
                      above to pick your game version, league and difficulty, and reach out
                      any time if you have a question before checking out.
                    </p>
                  </>
                )}
              </div>
            </section>
          );
        })()}
      </main>
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