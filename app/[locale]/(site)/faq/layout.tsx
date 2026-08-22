import { Metadata } from "next";
import { getOgLocale } from "@/lib/utils";

// ISR: revalidate cache every 5 minutes (must be in server component)
// ISR: o conteúdo vem do Sanity, e `sanityFetch` marca toda query com o `_type`
// do documento — publicar no Studio dispara o webhook em `/api/revalidate` e a
// página se refaz na hora. Este TTL é só a rede de segurança se o webhook cair.
export const revalidate = 86400;

export async function generateMetadata(props: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await props.params;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net";

    const titles: Record<string, string> = {
        en: "PoE Currency FAQ — Safe Buying, Delivery & Payment | Path of Trade",
        "pt-br": "FAQ Moedas PoE — Compra Segura, Entrega e Pagamento | Path of Trade",
    };
    const descriptions: Record<string, string> = {
        en: "Find answers to the most common questions about buying Path of Exile currency safely: payment methods, delivery times, safety, and more.",
        "pt-br":
            "Encontre respostas para as perguntas mais comuns sobre comprar moedas Path of Exile com segurança: métodos de pagamento, tempos de entrega, segurança e mais.",
    };

    const title = titles[locale] ?? titles.en;
    const description = descriptions[locale] ?? descriptions.en;

    const enUrl = `${baseUrl}/faq`;
    const ptUrl = `${baseUrl}/pt-br/faq`;
    const canonicalUrl = locale === "en" ? enUrl : ptUrl;

    return {
        title,
        description,
        alternates: {
            canonical: canonicalUrl,
            languages: {
                en: enUrl,
                "pt-BR": ptUrl,
                "x-default": enUrl,
            },
        },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            type: "website",
            ...getOgLocale(locale),
            siteName: "Path of Trade",
            images: [{ url: "/images/logo.webp" }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: ["/images/logo.webp"],
        },
    };
}

export default function FAQLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
