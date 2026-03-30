import Link from "next/link";
import { Coins } from "lucide-react";

interface CurrencyCtaProps {
  locale: string;
}

const products = [
  { name: "Divine Orb", slug: "divine-orb" },
  { name: "Chaos Orb", slug: "chaos-orb" },
  { name: "Exalted Orb", slug: "exalted-orb" },
];

export function CurrencyCta({ locale }: CurrencyCtaProps) {
  const isPt = locale === "pt-br";
  const prefix = isPt ? "/pt-br" : "";

  return (
    <section className="mt-10 rounded-xl border border-primary/20 bg-primary/5 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-3">
        <Coins className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">
          {isPt ? "Precisa de currency para sua build?" : "Need currency for your build?"}
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {isPt
          ? "Compre orbs com entrega rápida e preços competitivos no Path of Trade."
          : "Buy orbs with fast delivery and competitive prices at Path of Trade."}
      </p>
      <div className="flex flex-wrap gap-2">
        {products.map((p) => (
          <Link
            key={p.slug}
            href={`${prefix}/products/${p.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium hover:border-primary hover:text-primary transition-colors"
          >
            {isPt ? `Comprar ${p.name}` : `Buy ${p.name}`}
          </Link>
        ))}
        <Link
          href={`${prefix}/products`}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          {isPt ? "Ver todos os produtos" : "Browse all products"}
        </Link>
      </div>
    </section>
  );
}
