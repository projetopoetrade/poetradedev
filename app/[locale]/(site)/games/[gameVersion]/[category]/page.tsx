import { Metadata } from "next";
import { getProductsWithParams, getLeagues } from "@/app/actions";
import { generateKeywords, buildBreadcrumbSchema } from "@/lib/utils";
import { encodeProductName } from "@/utils/url-helper";
import CategoryItemCard from "@/components/category-item-card";
import BlogItem from "@/components/Blog";
import { getRecentPostsByGameVersion } from "@/sanity/sanity-utils";
import type { Blog } from "@/types/blog";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";

export const revalidate = 300;

const CATEGORIES = ["currency", "items", "services"] as const;
type CategorySlug = (typeof CATEGORIES)[number];

const GAME_VERSIONS = ["path-of-exile-1", "path-of-exile-2"] as const;

const categoryDbValue: Record<CategorySlug, string> = {
  currency: "Currency",
  items: "Items",
  services: "Services",
};

const categoryLabels: Record<CategorySlug, { en: string; "pt-br": string }> = {
  currency: { en: "Currency", "pt-br": "Moedas" },
  items: { en: "Items", "pt-br": "Itens" },
  services: { en: "Services", "pt-br": "Serviços" },
};

const gameLabels: Record<string, { en: string; "pt-br": string }> = {
  "path-of-exile-1": { en: "Path of Exile 1", "pt-br": "Path of Exile 1" },
  "path-of-exile-2": { en: "Path of Exile 2", "pt-br": "Path of Exile 2" },
};

const categoryDescriptions: Record<
  CategorySlug,
  { en: (game: string, league?: string) => string; "pt-br": (game: string, league?: string) => string }
> = {
  currency: {
    en: (game, league) =>
      `Buy ${game} currency at the best prices — Divine Orbs, Chaos Orbs, Exalted Orbs and every orb you need to progress.${league ? ` All listings are for the ${league} league.` : ""} Fast in-game delivery and secure transactions on every order.`,
    "pt-br": (game, league) =>
      `Compre moedas de ${game} com os melhores preços — Divine Orbs, Chaos Orbs, Exalted Orbs e tudo que você precisa para progredir.${league ? ` Todos os itens são da liga ${league}.` : ""} Entrega rápida no jogo e transações seguras garantidas.`,
  },
  items: {
    en: (game, league) =>
      `Browse a wide selection of ${game} items — unique equipment, flasks, jewels, and powerful endgame gear.${league ? ` All listings are for the ${league} league.` : ""} Hand-selected items ready for immediate in-game delivery.`,
    "pt-br": (game, league) =>
      `Navegue por uma ampla seleção de itens de ${game} — equipamentos únicos, frascos, joias e gear de endgame.${league ? ` Todos os itens são da liga ${league}.` : ""} Itens selecionados prontos para entrega imediata no jogo.`,
  },
  services: {
    en: (game) =>
      `Buy ${game} services including power leveling, boss carry runs, and league progression boosts. All services are performed by experienced players with fast completion times and 100% discretion.`,
    "pt-br": (game) =>
      `Compre serviços de ${game} incluindo power leveling, carry de chefes e boosts de progressão de liga. Todos os serviços são realizados por jogadores experientes com conclusão rápida e total discrição.`,
  },
};

function getCategoryFaq(
  cat: CategorySlug,
  game: string,
  league: string | undefined,
  isPtBr: boolean
): { q: string; a: string }[] {
  if (isPtBr) {
    const delivery = {
      q: "Quanto tempo demora a entrega?",
      a: `A maioria dos pedidos é entregue em 5 a 30 minutos${league ? ` na liga ${league}` : ""}. Após a confirmação do pagamento, um representante entrará em contato com você no jogo para completar a troca.`,
    };
    const safety = {
      q: "É seguro comprar no Path of Trade?",
      a: "Sim. Todas as transações são feitas pela janela de troca padrão do jogo. Nunca pedimos sua senha. Nosso método de entrega é discreto e seguro, testado em milhares de pedidos.",
    };
    if (cat === "currency") return [
      { q: `O que é moeda em ${game} e para que serve?`, a: `A moeda em ${game} são itens como Divine Orbs, Chaos Orbs e Exalted Orbs, usados para craftar equipamentos, aprimorar itens e negociar com outros jogadores. São essenciais para progredir na economia do jogo.` },
      delivery,
      safety,
      { q: "Posso comprar moeda para uma liga específica?", a: `Sim. Nossos produtos mostram a liga ativa atual${league ? ` (${league})` : ""}. Entre em contato antes de fazer o pedido se precisar de uma liga diferente.` },
    ];
    if (cat === "items") return [
      { q: `Que tipos de itens posso comprar para ${game}?`, a: `Oferecemos armas únicas, armaduras, frascos de alta qualidade, joias raras e gear de endgame para ${game}. Todos os itens são verificados antes de serem listados.` },
      delivery,
      safety,
      { q: "Os itens são obtidos de forma legítima?", a: "Sim. Todos os itens são obtidos por meios legítimos no jogo, sem uso de bots ou exploits que violem os termos de serviço." },
    ];
    return [
      { q: `Que serviços estão disponíveis para ${game}?`, a: `Oferecemos power leveling, carry de chefes, boosts de progressão de liga e muito mais. Todos os serviços são realizados por jogadores experientes em ${game}.` },
      delivery,
      safety,
      { q: "Minha conta fica segura durante o serviço?", a: "Sim. A maioria dos serviços é realizada com você online em grupo, sem necessidade de compartilhar credenciais. Nunca pedimos sua senha sem acordo explícito." },
    ];
  }

  const delivery = {
    q: "How fast is delivery after I buy?",
    a: `Most orders are delivered within 5–30 minutes${league ? ` in the ${league} league` : ""}. After payment is confirmed, a representative will contact you in-game to complete the trade.`,
  };
  const safety = {
    q: "Is buying from Path of Trade safe?",
    a: "Yes. All transactions are completed through the standard in-game trade window. We never ask for your password. Our delivery method is discreet and tested on thousands of orders.",
  };
  if (cat === "currency") return [
    { q: `What is ${game} currency and how does it work?`, a: `Currency in ${game} consists of orbs and scrolls like Divine Orbs, Chaos Orbs, and Exalted Orbs. They are used for crafting equipment, enhancing items, and trading with other players — essential for progressing through the game's economy.` },
    delivery,
    safety,
    { q: "Can I buy currency for a specific league?", a: `Yes. Our listings show the current active league${league ? ` (${league})` : ""}. Contact us before placing your order if you need currency for a different league.` },
  ];
  if (cat === "items") return [
    { q: `What types of items can I buy for ${game}?`, a: `We offer unique weapons, armor, high-quality flasks, rare jewels, and powerful endgame gear for ${game}. All items are hand-selected and verified before listing.` },
    delivery,
    safety,
    { q: "Are the items obtained legitimately?", a: "Yes. All items are obtained through legitimate in-game methods. We do not use bots, exploits, or any methods that violate the game's terms of service." },
  ];
  return [
    { q: `What services are available for ${game}?`, a: `We offer power leveling, boss carry runs, league progression boosts, and more for ${game}. All services are performed by experienced players who know the game inside out.` },
    delivery,
    safety,
    { q: "Do I need to share my account for a service?", a: "Most services are completed with you online in a party — no account sharing required. We will never ask for your login credentials unless explicitly agreed upon for a specific service type." },
  ];
}

export async function generateStaticParams() {
  const locales = ["en", "pt-br"];
  const params = [];
  for (const locale of locales) {
    for (const gameVersion of GAME_VERSIONS) {
      for (const category of CATEGORIES) {
        params.push({ locale, gameVersion, category });
      }
    }
  }
  return params;
}

export async function generateMetadata(props: {
  params: Promise<{ gameVersion: string; category: string; locale: string }>;
}): Promise<Metadata> {
  const { gameVersion, category, locale } = await props.params;

  if (!CATEGORIES.includes(category as CategorySlug)) return {};

  const cat = category as CategorySlug;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net";
  const isPoe2 = gameVersion === "path-of-exile-2";
  const isPtBr = locale === "pt-br";

  const catLabel = categoryLabels[cat][isPtBr ? "pt-br" : "en"];
  const gameLabel = gameLabels[gameVersion]?.[isPtBr ? "pt-br" : "en"] ?? gameVersion;
  const gameShort = isPoe2 ? "PoE 2" : "PoE 1";

  const title = isPtBr
    ? `Comprar ${catLabel} ${gameShort} — Preços Baratos e Entrega Rápida | Path of Trade`
    : `Buy ${gameLabel} ${catLabel} — Cheap Prices & Fast Delivery | Path of Trade`;

  const description = isPtBr
    ? `Compre ${catLabel} para ${gameLabel} com segurança e entrega rápida. Veja todos os itens disponíveis com os melhores preços no Path of Trade.`
    : `Buy ${gameLabel} ${catLabel} safely with fast in-game delivery. Browse all available ${catLabel.toLowerCase()} at the best prices on Path of Trade.`;

  const path = `/games/${gameVersion}/${category}`;
  const enUrl = `${baseUrl}${path}`;
  const ptUrl = `${baseUrl}/pt-br${path}`;
  const canonicalUrl = locale === "en" ? enUrl : ptUrl;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: { en: enUrl, "pt-BR": ptUrl, "x-default": enUrl },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "Path of Trade",
      images: [`${baseUrl}/images/${isPoe2 ? "path-of-exile2-card.webp" : "path-of-exile-card.webp"}`],
    },
    twitter: { card: "summary_large_image", title, description },
    keywords: generateKeywords({ locale, gameVersion: gameVersion as any, productName: catLabel }),
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ gameVersion: string; category: string; locale: string }>;
  searchParams: Promise<{ league?: string }>;
}) {
  const [{ gameVersion, category, locale }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  if (!CATEGORIES.includes(category as CategorySlug)) notFound();
  if (!GAME_VERSIONS.includes(gameVersion as any)) notFound();

  const cat = category as CategorySlug;
  const isPoe2 = gameVersion === "path-of-exile-2";
  const isPtBr = locale === "pt-br";

  const catLabel = categoryLabels[cat][isPtBr ? "pt-br" : "en"];
  const gameLabel = gameLabels[gameVersion]?.[isPtBr ? "pt-br" : "en"] ?? gameVersion;
  const gameShort = isPoe2 ? "PoE 2" : "PoE 1";

  let allLeagues: { name: string }[] = [];
  let defaultLeague: string | undefined;
  try {
    allLeagues = await getLeagues(gameVersion as any);
    const requestedLeague = searchParams.league;
    defaultLeague = requestedLeague
      ? (allLeagues.find((l) => l.name === requestedLeague)?.name ?? allLeagues[0]?.name)
      : allLeagues[0]?.name;
  } catch {}

  const [products, blogPosts] = await Promise.all([
    getProductsWithParams({ gameVersion, category: categoryDbValue[cat], league: defaultLeague, orderByPrice: 'desc' }),
    getRecentPostsByGameVersion(gameVersion, locale, 3).catch(() => [] as Blog[]),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net";
  const path = `/games/${gameVersion}/${category}`;
  const canonicalUrl = locale === "en" ? `${baseUrl}${path}` : `${baseUrl}/pt-br${path}`;

  const faqItems = getCategoryFaq(cat, gameLabel, defaultLeague, isPtBr);

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: gameLabel, url: `/games/${gameVersion}` },
    { name: catLabel, url: path },
  ]);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${gameLabel} ${catLabel}`,
    url: canonicalUrl,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: p.name,
        image: p.imgUrl,
        url: `${baseUrl}/products/${encodeProductName(p.name)}?gameVersion=${gameVersion}${defaultLeague ? `&league=${encodeURIComponent(defaultLeague)}` : ""}`,
        offers: {
          "@type": "Offer",
          price: p.price,
          priceCurrency: "USD",
          availability: p.in_stock !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
      },
    })),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const buyLabel = isPtBr ? "Comprar" : "Buy";
  const outOfStockLabel = isPtBr ? "Esgotado" : "Out of Stock";

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 max-w-7xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Breadcrumb */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground transition-colors">Home</Link></li>
          <li className="opacity-40">/</li>
          <li><Link href={`/games/${gameVersion}`} className="hover:text-foreground transition-colors">{gameLabel}</Link></li>
          <li className="opacity-40">/</li>
          <li className="text-foreground">{catLabel}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {gameShort}
          </span>
          {defaultLeague && (
            <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
              {defaultLeague}
            </span>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          {isPtBr ? `Comprar ${catLabel} para ${gameShort}` : `Buy ${gameShort} ${catLabel}`}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm md:text-base leading-relaxed">
          {categoryDescriptions[cat][isPtBr ? "pt-br" : "en"](gameLabel, defaultLeague)}
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-8 border-b border-border/40">
        {CATEGORIES.map((c) => {
          const label = categoryLabels[c][isPtBr ? "pt-br" : "en"];
          const isActive = c === cat;
          const localePath = locale === "en" ? "" : `/${locale}`;
          return (
            <Link
              key={c}
              href={`${localePath}/games/${gameVersion}/${c}`}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors border-b-2 -mb-px ${
                isActive
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* League Switcher */}
      {allLeagues.length > 1 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-xs text-muted-foreground shrink-0">
            {isPtBr ? "Liga:" : "League:"}
          </span>
          {allLeagues.map((league) => {
            const isActive = league.name === defaultLeague;
            const localePfx = locale === "en" ? "" : `/${locale}`;
            return (
              <Link
                key={league.name}
                href={`${localePfx}/games/${gameVersion}/${category}?league=${encodeURIComponent(league.name)}`}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  isActive
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {league.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* Product count */}
      <p className="text-xs text-muted-foreground mb-5">
        {isPtBr ? `${products.length} produtos disponíveis` : `${products.length} products available`}
      </p>

      {/* Product Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {products.map((product) => (
            <CategoryItemCard
              key={product.id}
              product={product}
              locale={locale}
              buyLabel={buyLabel}
              outOfStockLabel={outOfStockLabel}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          {isPtBr ? "Nenhum produto disponível no momento." : "No products available at the moment."}
        </div>
      )}

      {/* Blog Posts */}
      {blogPosts.length > 0 && (
        <section className="mt-16 pt-10 border-t border-border/40">
          <h2 className="text-2xl font-bold mb-2">
            {isPtBr ? `Guias e Notícias — ${gameLabel}` : `Guides & News — ${gameLabel}`}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isPtBr
              ? "Artigos recentes sobre builds, mecânicas de liga e estratégias de currency."
              : "Recent articles about builds, league mechanics and currency strategies."}
          </p>
          <div className="space-y-2">
            {blogPosts.map((post: Blog) => (
              <BlogItem key={`${post._id}-${post.slug.current}`} blog={post} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="mt-16 pt-10 border-t border-border/40">
        <h2 className="text-2xl font-bold mb-6">
          {isPtBr ? "Perguntas Frequentes" : "Frequently Asked Questions"}
        </h2>
        <div className="max-w-3xl space-y-0 divide-y divide-border/40">
          {faqItems.map((item, i) => (
            <details key={i} className="group py-4">
              <summary className="flex cursor-pointer items-center justify-between list-none gap-4 font-medium text-foreground hover:text-primary transition-colors">
                {item.q}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed pr-8">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
