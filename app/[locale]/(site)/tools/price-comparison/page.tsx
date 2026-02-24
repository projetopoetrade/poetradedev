import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildCanonical, buildAbsoluteUrl } from "@/lib/utils";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import PriceComparisonClient from "./PriceComparisonClient";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ game?: string; league?: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const canonical = buildCanonical("/tools/price-comparison", locale);

  return {
    title: locale === "pt-br" 
      ? "Comparação de Preços: poe.ninja vs Currency Exchange | Path of Trade"
      : "Price Comparison: poe.ninja vs Currency Exchange | Path of Trade",
    description: locale === "pt-br"
      ? "Compare preços de currency entre poe.ninja e o Currency Exchange oficial do Path of Exile. Veja diferenças e oportunidades de arbitragem."
      : "Compare currency prices between poe.ninja and the official Path of Exile Currency Exchange. See differences and arbitrage opportunities.",
    alternates: {
      canonical,
      languages: {
        en: buildAbsoluteUrl("/tools/price-comparison"),
        "pt-BR": buildAbsoluteUrl("/pt-br/tools/price-comparison"),
        "x-default": buildAbsoluteUrl("/tools/price-comparison"),
      },
    },
  };
}

export default async function PriceComparisonPage(props: PageProps) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const initialGame = searchParams.game || "poe1";
  const initialLeague = searchParams.league;

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: locale === "pt-br" ? "Ferramentas" : "Tools", href: "/tools" },
          { label: locale === "pt-br" ? "Comparação de Preços" : "Price Comparison" },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {locale === "pt-br" ? "Comparação de Preços" : "Price Comparison"}
        </h1>
        <p className="text-muted-foreground">
          {locale === "pt-br"
            ? "Compare preços entre poe.ninja e o Currency Exchange oficial do PoE"
            : "Compare prices between poe.ninja and the official PoE Currency Exchange"}
        </p>
      </div>

      <PriceComparisonClient 
        locale={locale} 
        initialGame={initialGame}
        initialLeague={initialLeague}
      />
    </div>
  );
}
