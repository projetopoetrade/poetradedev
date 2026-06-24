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
        en: "Privacy Policy & Cookies — Path of Trade",
        "pt-br": "Política de Privacidade e Cookies — Path of Trade",
    };
    const descriptions: Record<string, string> = {
        en: "How Path of Trade collects, uses and protects your data, including cookies and your rights. We follow strict data-protection and privacy practices.",
        "pt-br":
            "Como a Path of Trade coleta, usa e protege seus dados, incluindo cookies e seus direitos, em conformidade com a LGPD (Lei 13.709/2018).",
    };

    const title = titles[locale] ?? titles.en;
    const description = descriptions[locale] ?? descriptions.en;

    const enUrl = `${baseUrl}/privacy`;
    const ptUrl = `${baseUrl}/pt-br/privacy`;
    const canonicalUrl = buildCanonical(`/privacy`, locale);

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

export default function PrivacyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
