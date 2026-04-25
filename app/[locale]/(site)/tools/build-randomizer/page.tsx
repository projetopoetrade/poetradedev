import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  buildCanonical,
  buildAbsoluteUrl,
  buildBreadcrumbSchema,
  getOgLocale,
} from "@/lib/utils";
import BuildRandomizerClient from "./BuildRandomizerClient";
import { CurrencyCtaSection } from "@/components/currency-cta-section";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const isPt = locale === "pt-br";
  const canonical = buildCanonical("/tools/build-randomizer", locale);

  const title = isPt
    ? "Randomizador de Builds PoE — Escolha Sua Build | Path of Trade"
    : "PoE Build Randomizer — Pick Your Build | Path of Trade";
  const description = isPt
    ? "Indeciso no league start? Use nosso randomizador de builds para Path of Exile. Filtre por classe, dificuldade, orçamento e deixe o destino escolher."
    : "Can't decide on your league start? Use our Path of Exile build randomizer. Filter by class, difficulty, budget and let fate choose your build.";

  const enUrl = buildAbsoluteUrl("/tools/build-randomizer");
  const ptUrl = buildAbsoluteUrl("/pt-br/tools/build-randomizer");

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: enUrl,
        "pt-BR": ptUrl,
        "x-default": enUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      ...getOgLocale(locale),
      siteName: "Path of Trade",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BuildRandomizerPage(props: PageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const isPt = locale === "pt-br";

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: isPt ? "Ferramentas" : "Tools", url: "/tools" },
    {
      name: isPt ? "Randomizador de Build" : "Build Randomizer",
      url: "/tools/build-randomizer",
    },
  ]);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: isPt
          ? "O que é o PoE Build Randomizer?"
          : "What is the PoE Build Randomizer?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isPt
            ? "O Path of Exile Build Randomizer é uma ferramenta gratuita que ajuda jogadores indecisos a escolherem sua próxima build. Use filtros como orçamento, dificuldade e estilo de jogo para encontrar a build perfeita."
            : "The Path of Exile Build Randomizer is a free tool that helps undecided players pick their next build. Use filters like budget, difficulty, and playstyle to find the perfect build.",
        },
      },
      {
        "@type": "Question",
        name: isPt
          ? "O randomizador suporta Path of Exile 2?"
          : "Does the randomizer support Path of Exile 2?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isPt
            ? 'Sim! Selecione "Path of Exile 2" no filtro de versão do jogo para buscar builds do PoE 2.'
            : 'Yes! Select "Path of Exile 2" in the game version filter to search for PoE 2 builds.',
        },
      },
      {
        "@type": "Question",
        name: isPt
          ? "Como funciona o filtro de orçamento?"
          : "How does the budget filter work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: isPt
            ? "O filtro de orçamento classifica builds em: Cheap (até 5 Divine), Medium (5-20 Divine) e Expensive (20+ Divine)."
            : "The budget filter classifies builds into: Cheap (up to 5 Divine), Medium (5-20 Divine), and Expensive (20+ Divine).",
        },
      },
    ],
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "PoE Build Randomizer",
    url: buildAbsoluteUrl("/tools/build-randomizer"),
    description: isPt
      ? "Randomizador de builds gratuito para Path of Exile. Filtre por classe, orçamento e dificuldade."
      : "Free build randomizer for Path of Exile. Filter by class, budget and difficulty.",
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <BuildRandomizerClient locale={locale} />
      <div className="container mx-auto px-4 pb-8">
        <CurrencyCtaSection locale={locale} />
      </div>
    </>
  );
}
