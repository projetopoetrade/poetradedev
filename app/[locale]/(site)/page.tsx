import { FaqSection } from "@/components/faq-section";
import { Features } from "@/components/features";
import GameSelection from "@/components/game-selection";
import CarouselSpacing from "@/components/testemonials-section";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildCanonical } from "@/lib/utils";
import type { Metadata } from "next";

// ISR: revalidate cache every 5 minutes
export const revalidate = 300;

export async function generateMetadata(
  props: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "SEO" });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net";
  const canonical = locale === "en" ? baseUrl : `${baseUrl}/pt-br`;
  const enUrl = baseUrl;
  const ptUrl = `${baseUrl}/pt-br`;

  return {
    title: t("home.title"),
    description: t("home.description"),
    alternates: {
      canonical,
      languages: {
        "en": enUrl,
        "pt-BR": ptUrl,
        "x-default": enUrl,
      },
    },
    openGraph: {
      title: t("home.ogTitle"),
      description: t("home.ogDescription"),
      url: canonical,
      type: "website",
      locale: locale === "pt-br" ? "pt_BR" : "en_US",
      alternateLocale: locale === "pt-br" ? ["en_US"] : ["pt_BR"],
      siteName: t("siteName"),
      images: [{ url: `${baseUrl}/images/logo.webp`, width: 512, height: 512, alt: "Path of Trade" }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("home.ogTitle"),
      description: t("home.ogDescription"),
      images: [`${baseUrl}/images/logo.webp`],
    },
  };
}

// Split deliberado. `useTranslations` e um hook: so funciona em componente
// SINCRONO. Mas ler `params` no Next 15 exige await, o que forcaria async.
//
// Sem `setRequestLocale`, o next-intl nao consegue resolver o locale em build
// e opta por renderizacao dinamica — era o que mantinha a home fora do cache
// (`x-vercel-cache: MISS`) enquanto /about e /leagues serviam pre-renderizadas.
// Estas usam `getTranslations({locale})`, que recebe o locale explicitamente e
// por isso nunca precisaram desta chamada.
export default async function Home(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations("HomePage");
  const tSchema = useTranslations("Schema");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: tSchema("name"),
    alternateName: tSchema("alternateName"),
    description: tSchema("description"),
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net",
    logo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}/logo.webp`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Path of Trade",
        description: tSchema("sellerDescription"),
        url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net",
        logo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}/logo.webp`,
      },
    },
    serviceType: "Currency Trading",
    areaServed: "Worldwide",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: tSchema("offerName"),
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: tSchema("offerName"),
            description: tSchema("offerDescription"),
          },
        },
      ],
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Path of Trade",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <main className="container mx-auto px-4 py-8 min-h-screen">
        <GameSelection />
        <h1 className="text-3xl md:text-4xl tracking-tighter font-bold font-source-sans text-white text-center tracking-wide mt-10">
          {t("h1")}
        </h1>
        <Features />

        {/* SEO: descriptive content section for Google */}
        <section className="max-w-3xl mx-auto mt-16 mb-8 space-y-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-source-sans">
            {t("seoSection.title")}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t("seoSection.p1")}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {t("seoSection.p2")}
          </p>
          {t.has("seoSection.p3") && (
            <p className="text-muted-foreground leading-relaxed">
              {t("seoSection.p3")}
            </p>
          )}
        </section>

        <CarouselSpacing />
        <FaqSection />
      </main>
    </>
  );
}
