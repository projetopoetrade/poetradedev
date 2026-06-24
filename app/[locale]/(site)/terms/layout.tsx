import { Metadata } from "next";
import { buildCanonical, getOgLocale } from "@/lib/utils";

type Props = {
    params: Promise<{ locale: string }>;
    children: React.ReactNode;
};

export async function generateMetadata(
    props: Omit<Props, "children">,
): Promise<Metadata> {
    const { locale } = await props.params;
    const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net";

    const titles: Record<string, string> = {
        en: "Terms of Service — Path of Trade",
        "pt-br": "Termos de Serviço — Path of Trade",
    };
    const descriptions: Record<string, string> = {
        en: "Read the Path of Trade Terms of Service: rules for buying Path of Exile currency, delivery, payments, refunds and account responsibilities.",
        "pt-br":
            "Leia os Termos de Serviço da Path of Trade: regras de compra de currency de Path of Exile, entrega, pagamentos, reembolsos e responsabilidades da conta.",
    };

    const title = titles[locale] ?? titles.en;
    const description = descriptions[locale] ?? descriptions.en;

    const enUrl = `${baseUrl}/terms`;
    const ptUrl = `${baseUrl}/pt-br/terms`;
    const canonicalUrl = buildCanonical(`/terms`, locale);

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

export default function TermsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
