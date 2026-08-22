import { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, Coins, Package, Wrench } from "lucide-react";
import {
  getProductsWithParams,
  getAllActiveLeagues,
  getLeagueBySlugFromSupabase,
} from "@/app/actions";
import { buildBreadcrumbSchema, getOgLocale, generateKeywords } from "@/lib/utils";
import type { Product } from "@/lib/interface";

// ISR: preço/estoque vêm do Supabase, invalidados por tag (`db-products`) pelas
// rotas em `/api/admin/products/*`. 6 h é o piso caso alguém escreva no banco
// por fora do Next — ver DB_CACHE_TTL em lib/cache-tags.ts.
export const revalidate = 21600;

const CATEGORIES = ["currency", "items", "services"] as const;
type CategorySlug = (typeof CATEGORIES)[number];

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

const categoryIcon: Record<CategorySlug, typeof Coins> = {
  currency: Coins,
  items: Package,
  services: Wrench,
};

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"
).replace(/\/+$/, "");

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

// ─── generateStaticParams ─────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const leagues = await getAllActiveLeagues();
    const params: { locale: string; gameVersion: string; leagueSlug: string }[] =
      [];
    for (const locale of ["en", "pt-br"]) {
      for (const league of leagues) {
        params.push({
          locale,
          gameVersion: league.gameVersion,
          leagueSlug: nameToSlug(league.name),
        });
      }
    }
    return params;
  } catch {
    return [];
  }
}

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata(props: {
  params: Promise<{ locale: string; gameVersion: string; leagueSlug: string }>;
}): Promise<Metadata> {
  const { locale, gameVersion, leagueSlug } = await props.params;
  const league = await getLeagueBySlugFromSupabase(leagueSlug, gameVersion);
  if (!league) return { title: "Not Found" };

  const isPt = locale === "pt-br";
  const gv = gameVersion as "path-of-exile-1" | "path-of-exile-2";
  const gameShort = gv === "path-of-exile-2" ? "PoE 2" : "PoE 1";
  const path = `/games/${gameVersion}/league/${leagueSlug}`;
  const enUrl = `${SITE_URL}${path}`;
  const ptUrl = `${SITE_URL}/pt-br${path}`;
  const canonicalUrl = locale === "en" ? enUrl : ptUrl;

  const title = isPt
    ? `Comprar ${gameShort} — ${league.name}: Moedas, Itens e Serviços | Path of Trade`
    : `Buy ${gameShort} ${league.name} — Currency, Items & Services | Path of Trade`;
  const description = isPt
    ? `Compre moedas, itens e serviços de ${gameShort} para a liga ${league.name}. Preços atualizados diariamente, entrega rápida e segura no jogo.`
    : `Buy ${gameShort} currency, items and services for the ${league.name} league. Daily updated prices, fast and secure in-game delivery.`;

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
      ...getOgLocale(locale),
      siteName: "Path of Trade",
      images: [
        `${SITE_URL}/images/${gv === "path-of-exile-2" ? "path-of-exile2-card.webp" : "path-of-exile-card.webp"}`,
      ],
    },
    twitter: { card: "summary_large_image", title, description },
    keywords: generateKeywords({ locale, gameVersion: gv, league: league.name }),
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LeagueIndexPage(props: {
  params: Promise<{ locale: string; gameVersion: string; leagueSlug: string }>;
}) {
  const { locale, gameVersion, leagueSlug } = await props.params;
  setRequestLocale(locale);

  const league = await getLeagueBySlugFromSupabase(leagueSlug, gameVersion);
  if (!league) notFound();

  const isPt = locale === "pt-br";
  const loc = isPt ? "pt-br" : "en";
  const gv = gameVersion as "path-of-exile-1" | "path-of-exile-2";
  const gameShort = gv === "path-of-exile-2" ? "PoE 2" : "PoE 1";
  const gameLabel =
    gv === "path-of-exile-2" ? "Path of Exile 2" : "Path of Exile 1";
  const path = `/games/${gameVersion}/league/${leagueSlug}`;

  // Produtos da liga (para contagem por categoria)
  const products = await getProductsWithParams({
    gameVersion,
    league: league.name,
    orderByPrice: "desc",
  });
  const countByCat = (db: string) =>
    products.filter(
      (p: Product) => (p.category || "").toLowerCase() === db.toLowerCase(),
    ).length;

  const h1 = isPt
    ? `${gameShort} — ${league.name}: Moedas, Itens e Serviços`
    : `${gameShort} ${league.name} — Currency, Items & Services`;

  const intro = isPt
    ? `Tudo para a liga ${league.name} de ${gameLabel} em um só lugar. Escolha entre moedas (Divine, Chaos, Exalted e mais), itens únicos e serviços de boost — com preços atualizados diariamente e entrega rápida e segura no jogo.`
    : `Everything for the ${gameLabel} ${league.name} league in one place. Choose from currency (Divine, Chaos, Exalted and more), unique items and boosting services — with daily updated prices and fast, secure in-game delivery.`;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: gameLabel, url: `/games/${gameVersion}` },
    { name: league.name, url: path },
  ]);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${gameShort} ${league.name}`,
    url: `${SITE_URL}${path}`,
    numberOfItems: CATEGORIES.length,
    itemListElement: CATEGORIES.map((cat, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: categoryLabels[cat][loc],
      url: `${SITE_URL}${path}/${cat}`,
    })),
  };

  return (
    <main className="container mx-auto py-6 md:py-10 px-4 max-w-7xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <li className="opacity-40">/</li>
          <li>
            <Link
              href={`/games/${gameVersion}`}
              className="hover:text-foreground transition-colors"
            >
              {gameLabel}
            </Link>
          </li>
          <li className="opacity-40">/</li>
          <li className="text-foreground">{league.name}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {gameShort}
          </span>
          <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
            {league.name}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{h1}</h1>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-3xl">
          {intro}
        </p>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => {
          const Icon = categoryIcon[cat];
          const count = countByCat(categoryDbValue[cat]);
          return (
            <Link
              key={cat}
              href={`${path}/${cat}`}
              className="group border border-border/40 rounded-xl p-6 hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <Icon className="h-7 w-7 text-primary mb-3" />
              <h2 className="text-lg font-semibold mb-1">
                {categoryLabels[cat][loc]}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isPt
                  ? `${count} produtos disponíveis`
                  : `${count} products available`}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Back link */}
      <div className="mt-10">
        <Link
          href={`/games/${gameVersion}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {isPt ? `Voltar para ${gameLabel}` : `Back to ${gameLabel}`}
        </Link>
      </div>
    </main>
  );
}
