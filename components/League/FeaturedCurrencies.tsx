import React from "react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

interface FeaturedCurrenciesProps {
  slugs: string[];
  leagueName: string;
  label: string;
  ctaTemplate: string; // "Buy {currencyName} for {leagueName}"
}

const CURRENCY_DISPLAY_NAMES: Record<string, string> = {
  "divine-orb": "Divine Orb",
  "chaos-orb": "Chaos Orb",
  "exalted-orb": "Exalted Orb",
  "orb-of-alteration": "Orb of Alteration",
  "orb-of-fusing": "Orb of Fusing",
  "orb-of-alchemy": "Orb of Alchemy",
  "orb-of-scouring": "Orb of Scouring",
  "vaal-orb": "Vaal Orb",
  "mirror-of-kalandra": "Mirror of Kalandra",
  "regret-orb": "Orb of Regret",
  "blessed-orb": "Blessed Orb",
  "jeweller-orb": "Jeweller's Orb",
  "gemcutter-prism": "Gemcutter's Prism",
};

function getDisplayName(slug: string): string {
  return (
    CURRENCY_DISPLAY_NAMES[slug] ||
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

export default function FeaturedCurrencies({
  slugs,
  leagueName,
  label,
  ctaTemplate,
}: FeaturedCurrenciesProps) {
  if (!slugs || slugs.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-foreground">
        {label}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
        {slugs.map((slug) => {
          const displayName = getDisplayName(slug);
          const ctaText = ctaTemplate
            .replace("{currencyName}", displayName)
            .replace("{leagueName}", leagueName);
          return (
            <Link key={slug} href={`/products/${slug}`}>
              <Card className="h-full hover:shadow-md hover:border-primary/40 transition-all duration-200 cursor-pointer group">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground text-sm leading-tight">{ctaText}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
