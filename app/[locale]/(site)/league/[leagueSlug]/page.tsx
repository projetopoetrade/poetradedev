import React from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  LeagueHero,
  TableOfContents,
  TLDRSection,
  MechanicAnalysis,
  LeagueStarters,
  PatchNotesSection,
  BloodlineAscendancies,
} from "@/components/League";
import { buildCanonical } from "@/lib/utils";

interface PageProps {
  params: Promise<{
    leagueSlug: string;
    locale: string;
  }>;
}

// Dados das ligas - pode ser movido para um arquivo separado ou banco de dados
const leaguesData: Record<string, any> = {
  "keepers-of-the-flame": {
    slug: "keepers-of-the-flame",
    version: "3.27",
    releaseDate: {
      "pt-br": "31 de Outubro de 2025 (Américas) / 1 de Novembro de 2025 (ANZ)",
      en: "October 31, 2025 (Americas) / November 1, 2025 (ANZ)",
    },
    imageUrl: "/images/keepers-of-flame-banner.webp",
    datePublished: "2025-10-31",
  },
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const { leagueSlug, locale } = params;
  const t = await getTranslations({ locale, namespace: "League" });

  const leagueData = leaguesData[leagueSlug];

  if (!leagueData) {
    return { title: "Liga não encontrada" };
  }

  const title = t(`${leagueSlug}.title`);
  const description = t(`${leagueSlug}.metaDescription`);
  const canonical = buildCanonical(`/${locale}/league/${leagueSlug}`, locale);
  const siteName = "Path of Trade";
  const titleWithSuffix = `${title} | ${siteName}`;

  return {
    title: titleWithSuffix,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: titleWithSuffix,
      description,
      url: canonical,
      type: "article",
      siteName: "Path of Trade",
      images: [
        {
          url: leagueData.imageUrl || "/images/keepers-logo.webp",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titleWithSuffix,
      description,
    },
    keywords: t(`${leagueSlug}.keywords`),
  };
}

export default async function LeaguePage(props: PageProps) {
  const params = await props.params;
  const { leagueSlug, locale } = params;

  const leagueData = leaguesData[leagueSlug];

  if (!leagueData) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "League" });

  // Structured Data para SEO
  const guideStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t(`${leagueSlug}.title`),
    description: t(`${leagueSlug}.metaDescription`),
    image: leagueData.imageUrl,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}${locale === "en" ? "" : `/${locale}`}/league/${leagueSlug}`,
    inLanguage: locale === "pt-br" ? "pt-BR" : "en-US",
    datePublished: leagueData.datePublished,
    dateModified: leagueData.datePublished,
    publisher: {
      "@type": "Organization",
      name: "Path of Trade",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}/logo.png`,
      },
    },
    about: {
      "@type": "Game",
      name: "Path of Exile",
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}${locale === "en" ? "" : `/${locale}`}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: locale === "pt-br" ? "Ligas" : "Leagues",
          item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}${locale === "en" ? "" : `/${locale}`}/league`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: t(`${leagueSlug}.title`),
          item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}${locale === "en" ? "" : `/${locale}`}/league/${leagueSlug}`,
        },
      ],
    },
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideStructuredData) }}
      />

      <main className="container mx-auto min-h-screen">
        {/* Hero Section */}
        <LeagueHero
          title={t(`${leagueSlug}.title`)}
          subtitle={t(`${leagueSlug}.subtitle`)}
          version={leagueData.version}
          releaseDate={leagueData.releaseDate[locale] || leagueData.releaseDate.en}
          imageUrl={leagueData.imageUrl}
          locale={locale}
        />

        {/* Table of Contents */}
        <TableOfContents
          title={t("toc.title")}
          items={t.raw("toc.items")}
        />

        {/* TL;DR Section */}
        <div id="tldr">
          <TLDRSection
            title={t(`${leagueSlug}.tldr.title`)}
            items={t.raw(`${leagueSlug}.tldr.items`)}
          />
        </div>

        {/* Main Content */}
        <article>
          {/* Mechanic Analysis */}
          <div id="mechanics">
            <MechanicAnalysis
              title={t(`${leagueSlug}.mechanics.title`)}
              description={t(`${leagueSlug}.mechanics.description`)}
              mainPoints={t.raw(`${leagueSlug}.mechanics.points`)}
              tradeImpact={{
                title: t(`${leagueSlug}.mechanics.tradeImpact.title`),
                points: t.raw(`${leagueSlug}.mechanics.tradeImpact.points`),
              }}
              ctaLink="/products?gameVersion=path-of-exile-1&league=Keepers+of+the+Flame&difficulty=softcore"
              ctaText={t("buyDivines")}
              locale={locale}
            />
          </div>

          {/* Patch Notes Summary */}
          <div id="patch-notes">
            <PatchNotesSection
              title={t(`${leagueSlug}.patchNotes.title`)}
              subtitle={t(`${leagueSlug}.patchNotes.subtitle`)}
              categories={t.raw(`${leagueSlug}.patchNotes.categories`)}
              officialNotesUrl={t(`${leagueSlug}.patchNotes.officialUrl`)}
              officialNotesText={t(`${leagueSlug}.patchNotes.officialText`)}
            />
          </div>
          
            {/* League Starters */}
            <div id="builds">
              <LeagueStarters
                title={t(`${leagueSlug}.starters.title`)}
                subtitle={t(`${leagueSlug}.starters.subtitle`)}
                tierS={t.raw(`${leagueSlug}.starters.tierS`)}
                tierA={t.raw(`${leagueSlug}.starters.tierA`)}
                builds={t.raw(`${leagueSlug}.starters.builds`)}
                locale={locale}
              />
            </div>

            {/* Bloodline Ascendancies */}
            <div id="bloodlines">
              <BloodlineAscendancies
                title={t(`${leagueSlug}.bloodlineAscendancies.title`)}
                subtitle={t(`${leagueSlug}.bloodlineAscendancies.subtitle`)}
                description={t(`${leagueSlug}.bloodlineAscendancies.description`)}
                howItWorks={t.raw(`${leagueSlug}.bloodlineAscendancies.howItWorks`)}
                examples={t.raw(`${leagueSlug}.bloodlineAscendancies.examples`)}
                whyItMatters={t.raw(`${leagueSlug}.bloodlineAscendancies.whyItMatters`)}
                bestPractices={t.raw(`${leagueSlug}.bloodlineAscendancies.bestPractices`)}
                faq={t.raw(`${leagueSlug}.bloodlineAscendancies.faq`)}
              />
            </div>

          {/* CTA Section */}
          <section className="container mx-auto px-4 py-16">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">
                {t("cta.title")}
              </h2>
              <p className="text-lg mb-8 max-w-2xl mx-auto text-muted-foreground">
                {t("cta.description")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="font-bold text-lg px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200">
                  <Link href="/products?gameVersion=path-of-exile-1&league=Keepers+of+the++Flame&difficulty=softcore">
                    {t("cta.buyNow")}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="text-muted-foreground hover:text-foreground">
                  <Link href="/blog">
                    {t("cta.moreGuides")}
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </article>
      </main>
    </>
  );
}

