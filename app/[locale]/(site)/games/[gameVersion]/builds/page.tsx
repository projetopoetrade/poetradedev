import { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getBuilds } from "@/app/actions";
import { buildAbsoluteUrl, buildBreadcrumbSchema } from "@/lib/utils";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import BuildCard from "@/components/Builds/BuildCard";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export const revalidate = 300;

type GameVersion = "path-of-exile-1" | "path-of-exile-2";

interface Props {
  params: Promise<{ locale: string; gameVersion: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const VALID_VERSIONS: GameVersion[] = ["path-of-exile-1", "path-of-exile-2"];
const LIMIT = 12;

export async function generateStaticParams() {
  return ["en", "pt-br"].flatMap((locale) =>
    VALID_VERSIONS.map((gameVersion) => ({ locale, gameVersion }))
  );
}

// ─── Content maps ─────────────────────────────────────────────────────────────

const CONTENT = {
  "path-of-exile-1": {
    gameLabel: "Path of Exile 1",
    en: {
      title: "Best Path of Exile 1 Builds — PoE 1 Build Guides | Path of Trade",
      description:
        "Discover the best Path of Exile 1 builds for every class and ascendancy. Curated league starters, endgame, boss killers and SSF builds with full PoB codes.",
      h1: "Path of Exile 1 Builds",
      intro:
        "Path of Exile 1 builds are defined by one of the deepest passive skill trees in any ARPG, complex crafting synergies, and a decade of league mechanics to master. Whether you need a budget-friendly league starter to blast through acts, or a fully-juiced endgame build for pinnacle bossing, every guide here includes a full Path of Building code so you can import and min-max straight away.",
      faq: [
        {
          q: "What are the best Path of Exile 1 league starter builds?",
          a: "The best PoE 1 league starters are typically self-sufficient builds that deal consistent damage without expensive gear: Righteous Fire, Lightning Arrow, Arc, and Boneshatter are perennial favourites because they scale well on a low budget and can transition into endgame.",
        },
        {
          q: "What is the easiest class to play in Path of Exile 1?",
          a: "The Juggernaut (Marauder ascendancy) and the Elementalist (Witch ascendancy) are widely considered the most beginner-friendly in PoE 1. Juggernaut provides extreme tankiness with minimal investment, while Elementalist enables powerful elemental spells with built-in clear speed.",
        },
        {
          q: "What is the difference between a league starter and an endgame build in PoE 1?",
          a: "A league starter is designed to reach red maps with minimal or self-found gear, typically using skills that deal damage without relying on expensive unique items. An endgame build assumes access to crafted or rare items and may require hundreds of divine orbs to reach its full potential.",
        },
        {
          q: "Where can I open PoE builds in Path of Building?",
          a: "You can use our PoB Viewer tool on Path of Trade to paste any build code and inspect the full passive tree, gear, and skill gems directly in your browser without installing anything.",
        },
      ],
    },
    "pt-br": {
      title: "Melhores Builds Path of Exile 1 — Guias de Build PoE 1 | Path of Trade",
      description:
        "Descubra as melhores builds de Path of Exile 1 para cada classe e ascendência. League starters, endgame, boss killers e builds SSF com códigos PoB completos.",
      h1: "Builds Path of Exile 1",
      intro:
        "As builds de Path of Exile 1 se destacam pela profundidade da árvore de habilidades passivas, sistemas de craft complexos e mais de uma década de mecânicas de liga para dominar. Seja um league starter econômico para passar pelos atos ou uma build de endgame para boss pinnacle, todos os guias aqui incluem código completo para o Path of Building.",
      faq: [
        {
          q: "Quais são os melhores league starters de Path of Exile 1?",
          a: "Os melhores league starters do PoE 1 são builds autossuficientes que causam dano consistente sem equipamentos caros: Righteous Fire, Lightning Arrow, Arc e Boneshatter são escolhas clássicas por escalarem bem com pouco investimento e terem boa transição para o endgame.",
        },
        {
          q: "Qual é a classe mais fácil de jogar em Path of Exile 1?",
          a: "O Juggernaut (ascendência do Marauder) e a Elementalist (ascendência da Witch) são considerados os mais acessíveis para iniciantes no PoE 1. O Juggernaut oferece extrema resistência com pouco investimento, enquanto a Elementalist permite magias elementais poderosas com boa velocidade de clear.",
        },
        {
          q: "Qual a diferença entre league starter e build de endgame no PoE 1?",
          a: "Um league starter é feito para chegar aos mapas vermelhos com equipamentos mínimos ou encontrados pelo caminho. Uma build de endgame assume acesso a itens craftados ou raros e pode exigir centenas de divine orbs para atingir seu potencial máximo.",
        },
      ],
    },
  },
  "path-of-exile-2": {
    gameLabel: "Path of Exile 2",
    en: {
      title: "Best Path of Exile 2 Builds — PoE 2 Build Guides | Path of Trade",
      description:
        "Find the best Path of Exile 2 builds for every class and ascendancy. Curated PoE 2 league starters, endgame and boss killer builds with full PoB codes.",
      h1: "Path of Exile 2 Builds",
      intro:
        "Path of Exile 2 takes a fresh approach with a 6-act campaign, a revamped skill gem socketing system, and reworked classes — each with two ascendancies and a distinct identity. Builds in PoE 2 reward deliberate positioning and synergy between support gems and active skills more than raw stat stacking. Browse our curated guides to find the right build for your playstyle, complete with Path of Building codes.",
      faq: [
        {
          q: "What are the best Path of Exile 2 builds right now?",
          a: "The meta in PoE 2 shifts with each patch, but top-performing builds typically exploit strong ascendancy passives and high-synergy gem combinations. Check our latest guides for up-to-date picks for the current league.",
        },
        {
          q: "What is the best class in Path of Exile 2?",
          a: "No single class is universally best in PoE 2. The Witch (Infernalist / Blood Mage) excels at spell builds, the Warrior (Titan / Warbringer) is very tanky for melee, and the Ranger (Deadeye / Pathfinder) offers strong projectile and flask playstyles. The best class depends on your preferred playstyle.",
        },
        {
          q: "How are builds different in Path of Exile 2 vs PoE 1?",
          a: "PoE 2 builds rely more on gem support interactions and active skill rotations, while PoE 1 leans heavily on passive tree synergies and item modifiers. Defences are also revamped in PoE 2, making evasion and block more viable for a wider range of builds.",
        },
        {
          q: "Can I use the same Path of Building for PoE 2?",
          a: "PoE 1 and PoE 2 use separate versions of Path of Building. Our PoB Viewer on Path of Trade supports both — just paste your build code and the tool detects the game version automatically.",
        },
      ],
    },
    "pt-br": {
      title: "Melhores Builds Path of Exile 2 — Guias de Build PoE 2 | Path of Trade",
      description:
        "Encontre as melhores builds de Path of Exile 2 para cada classe e ascendência. League starters, endgame e boss killers para PoE 2 com códigos PoB completos.",
      h1: "Builds Path of Exile 2",
      intro:
        "Path of Exile 2 traz uma abordagem renovada com campanha de 6 atos, sistema de encaixe de gemas remodelado e classes revisadas — cada uma com duas ascendências e identidade própria. As builds no PoE 2 recompensam sinergia entre gemas de suporte e habilidades ativas. Explore nossos guias curados com códigos completos para o Path of Building.",
      faq: [
        {
          q: "Quais são as melhores builds de Path of Exile 2 agora?",
          a: "O meta do PoE 2 muda a cada patch, mas as builds mais fortes geralmente exploram passivas de ascendência poderosas e combinações de gemas com alta sinergia. Confira nossos guias mais recentes para as melhores picks da liga atual.",
        },
        {
          q: "Qual é a melhor classe em Path of Exile 2?",
          a: "Não há uma classe universalmente melhor no PoE 2. A Witch (Infernalist / Blood Mage) é excelente para builds de magia, o Warrior (Titan / Warbringer) é muito resistente para corpo a corpo, e a Ranger (Deadeye / Pathfinder) oferece builds fortes de projéteis e poções. A melhor classe depende do seu estilo de jogo.",
        },
        {
          q: "Qual a diferença entre builds de PoE 1 e PoE 2?",
          a: "As builds do PoE 2 dependem mais de interações entre gemas de suporte e rotações de habilidades ativas, enquanto o PoE 1 foca em sinergias da árvore passiva e modificadores de itens. As defesas também foram remodeladas no PoE 2, tornando evasão e bloqueio mais viáveis para mais estilos de build.",
        },
      ],
    },
  },
} as const;

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Props["params"] }): Promise<Metadata> {
  const { locale, gameVersion } = await params;
  if (!VALID_VERSIONS.includes(gameVersion as GameVersion)) return { title: "Not Found" };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net";
  const gv = gameVersion as GameVersion;
  const lang = locale === "pt-br" ? "pt-br" : "en";
  const c = CONTENT[gv][lang];

  const enUrl = `${baseUrl}/games/${gv}/builds`;
  const ptUrl = `${baseUrl}/pt-br/games/${gv}/builds`;
  const canonicalUrl = locale === "en" ? enUrl : ptUrl;

  return {
    title: c.title,
    description: c.description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: enUrl,
        "pt-BR": ptUrl,
        "x-default": enUrl,
      },
    },
    openGraph: {
      title: c.title,
      description: c.description,
      url: canonicalUrl,
      type: "website",
      siteName: "Path of Trade",
    },
    twitter: { card: "summary_large_image", title: c.title, description: c.description },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GameVersionBuildsPage({ params, searchParams }: Props) {
  const { locale, gameVersion } = await params;
  setRequestLocale(locale);

  if (!VALID_VERSIONS.includes(gameVersion as GameVersion)) notFound();

  const sp = await searchParams;
  const page = typeof sp.page === "string" ? Math.max(1, parseInt(sp.page, 10)) : 1;
  const gv = gameVersion as GameVersion;
  const lang = locale === "pt-br" ? "pt-br" : "en";
  const c = CONTENT[gv][lang];
  const { gameLabel } = CONTENT[gv];

  const { builds, total } = await getBuilds({ gameVersion: gv, page, limit: LIMIT });
  const totalPages = Math.ceil(total / LIMIT);

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net").replace(/\/+$/, "");
  const localePath = locale === "en" ? "" : `/${locale}`;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: `${baseUrl}${localePath}` },
    { name: gameLabel, url: `${baseUrl}${localePath}/games/${gv}` },
    { name: "Builds", url: `${baseUrl}${localePath}/games/${gv}/builds` },
  ]);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: c.h1,
    url: `${baseUrl}${localePath}/games/${gv}/builds`,
    numberOfItems: total,
    itemListElement: builds.map((build, i) => ({
      "@type": "ListItem",
      position: i + 1 + (page - 1) * LIMIT,
      url: buildAbsoluteUrl(`/builds/${build.slug}`),
      name: build.title,
      description: build.description ?? undefined,
    })),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const pagePath = `${localePath}/games/${gv}/builds`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <main className="min-h-screen py-12 px-4 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: gameLabel, href: `/games/${gv}` },
            { label: "Builds" },
          ]}
        />

        {/* Header + Intro */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{c.h1}</h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-3xl">{c.intro}</p>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-gray-500">
            {locale === "pt-br"
              ? `Mostrando ${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} de ${total} builds`
              : `Showing ${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} of ${total} builds`}
          </p>
          <Button asChild variant="outline" size="sm" className="border-gray-700 text-gray-400 hover:text-white text-xs">
            <Link href={`/builds?gameVersion=${gv}`}>
              {locale === "pt-br" ? "Filtrar builds →" : "Filter builds →"}
            </Link>
          </Button>
        </div>

        {/* Grid */}
        {builds.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            {locale === "pt-br" ? "Nenhuma build encontrada." : "No builds found yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {builds.map((build) => (
              <BuildCard key={build.id} build={build} locale={locale} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
            {page > 1 && (
              <Button asChild variant="outline" size="sm" className="border-gray-700 text-gray-400 hover:text-white">
                <Link href={`${pagePath}?page=${page - 1}`}>
                  {locale === "pt-br" ? "Anterior" : "Previous"}
                </Link>
              </Button>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                asChild
                variant={p === page ? "default" : "outline"}
                size="sm"
                className={p === page
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30"
                  : "border-gray-700 text-gray-400 hover:text-white"}
              >
                <Link href={`${pagePath}?page=${p}`}>{p}</Link>
              </Button>
            ))}
            {page < totalPages && (
              <Button asChild variant="outline" size="sm" className="border-gray-700 text-gray-400 hover:text-white">
                <Link href={`${pagePath}?page=${page + 1}`}>
                  {locale === "pt-br" ? "Próxima" : "Next"}
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* FAQ section */}
        <section className="mt-24 max-w-3xl">
          <h2 className="text-xl font-semibold text-white mb-6">
            {locale === "pt-br" ? "Perguntas Frequentes" : "Frequently Asked Questions"}
          </h2>
          <div className="space-y-5">
            {c.faq.map(({ q, a }) => (
              <div key={q} className="border border-gray-800/60 rounded-lg p-5 bg-black/30">
                <h3 className="font-medium text-white mb-2 text-sm">{q}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
