import { FaqSection } from "@/components/faq-section";
import { Features } from "@/components/features";
import GameSelection from "@/components/game-selection";
import CarouselSpacing from "@/components/testemonials-section";
import { useTranslations } from "next-intl";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "Path of Trade Net",
  alternateName: `Path of Exile Currency Trading`,
  description:
    "Path of Trade Net - Your trusted source for Path of Exile currency trading. Buy and sell POE currency with instant delivery. Get the best prices, secure trading, and 24/7 customer support.",
  url: "https://pathoftrade.net",
  logo: "https://pathoftrade.net/logo.png",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    seller: {
      "@type": "Organization",
      name: "Path of Trade",
      description: "Professional Path of Exile currency trading service",
      url: "https://pathoftrade.net",
      logo: "https://pathoftrade.net/logo.png",
    },
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "1000+",
  },
  serviceType: "Currency Trading",
  areaServed: "Worldwide",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "POE Currency Trading Services",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "POE Currency Trading",
          description:
            "Safe and instant POE currency trading service by Path of Trade Net",
        },
      },
    ],
  },
};

export default function Home() {
  const t = useTranslations("HomePage");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="container mx-auto px-4 py-8 min-h-screen">
        <GameSelection />
        <h2 className="text-xl md:text-4xl tracking-tighter font-bold font-source-sans text-white text-center tracking-wide">
          {t("why-path-of-trade")}
        </h2>
        <Features />

        <CarouselSpacing />
        <FaqSection />
      </main>
    </>
  );
}
