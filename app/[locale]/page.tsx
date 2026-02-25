import { FaqSection } from "@/components/faq-section";
import { Features } from "@/components/features";
import GameSelection from "@/components/game-selection";
import CarouselSpacing from "@/components/testemonials-section";
import { useTranslations } from "next-intl";

// ISR: revalidate cache every 5 minutes
export const revalidate = 300;


export default function Home() {
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="container mx-auto px-4 py-8 min-h-screen">
        <GameSelection />
        <h1 className="text-3xl md:text-4xl tracking-tighter font-bold font-source-sans text-white text-center tracking-wide mt-10">
          {t("h1")}
        </h1>
        <Features />

        <CarouselSpacing />
        <FaqSection />
      </main>
    </>
  );
}
