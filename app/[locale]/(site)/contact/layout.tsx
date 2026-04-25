import { Metadata } from "next";
import { getOgLocale } from "@/lib/utils";

export async function generateMetadata(props: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await props.params;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net";

    const titles: Record<string, string> = {
        en: "Contact Us — Path of Trade Support",
        "pt-br": "Fale Conosco — Suporte Path of Trade",
    };
    const descriptions: Record<string, string> = {
        en: "Get in touch with Path of Trade. Reach our support team via Discord or email for help with orders, payments, or any questions about buying PoE currency.",
        "pt-br": "Entre em contato com o Path of Trade. Fale com nosso suporte via Discord ou e-mail para dúvidas sobre pedidos, pagamentos ou compra de moedas PoE.",
    };

    const title = titles[locale] ?? titles.en;
    const description = descriptions[locale] ?? descriptions.en;

    const enUrl = `${baseUrl}/contact`;
    const ptUrl = `${baseUrl}/pt-br/contact`;
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
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
