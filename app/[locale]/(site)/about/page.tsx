import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildCanonical, buildBreadcrumbSchema } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Clock,
    Shield,
    HeadphonesIcon,
    Flag,
    ArrowLeft,
    ShoppingBag,
    CreditCard,
    PackageCheck,
} from "lucide-react";

export const revalidate = 300;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { locale } = await props.params;
    const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net";

    const titles: Record<string, string> = {
        en: "About Path of Trade — Trusted PoE Currency Shop Since 2024 | Path of Trade",
        "pt-br":
            "Sobre a Path of Trade — Loja Confiável de Currency PoE | Path of Trade",
    };
    const descriptions: Record<string, string> = {
        en: "Learn about Path of Trade, a trusted Path of Exile currency shop. Fast delivery, secure payments, PIX support for Brazilian players, and 24/7 customer support.",
        "pt-br":
            "Conheça a Path of Trade, loja confiável de currency de Path of Exile. Entrega rápida, pagamentos seguros, PIX e suporte 24/7.",
    };

    const title = titles[locale] ?? titles.en;
    const description = descriptions[locale] ?? descriptions.en;

    const enUrl = `${baseUrl}/about`;
    const ptUrl = `${baseUrl}/pt-br/about`;
    const canonicalUrl = buildCanonical(`/about`, locale);

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
            siteName: "Path of Trade",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}

export default async function AboutPage(props: Props) {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: "About" });
    const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net";

    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Path of Trade",
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
        description:
            "Trusted Path of Exile currency shop with fast delivery and secure payments.",
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            availableLanguage: ["English", "Portuguese"],
        },
    };

    const breadcrumbSchema = buildBreadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "About", url: "/about" },
    ]);

    const trustCards = [
        {
            icon: <Clock className="h-8 w-8 text-white" />,
            bg: "bg-indigo-600",
            title: t("trustCard1Title"),
            body: t("trustCard1Body"),
        },
        {
            icon: <Shield className="h-8 w-8 text-white" />,
            bg: "bg-emerald-600",
            title: t("trustCard2Title"),
            body: t("trustCard2Body"),
        },
        {
            icon: <HeadphonesIcon className="h-8 w-8 text-white" />,
            bg: "bg-purple-600",
            title: t("trustCard3Title"),
            body: t("trustCard3Body"),
        },
        {
            icon: <Flag className="h-8 w-8 text-white" />,
            bg: "bg-green-600",
            title: t("trustCard4Title"),
            body: t("trustCard4Body"),
        },
    ];

    const steps = [
        {
            num: "01",
            icon: <ShoppingBag className="h-6 w-6 text-indigo-400" />,
            title: t("step1Title"),
            body: t("step1Body"),
        },
        {
            num: "02",
            icon: <CreditCard className="h-6 w-6 text-emerald-400" />,
            title: t("step2Title"),
            body: t("step2Body"),
        },
        {
            num: "03",
            icon: <PackageCheck className="h-6 w-6 text-purple-400" />,
            title: t("step3Title"),
            body: t("step3Body"),
        },
    ];

    const stats = [
        { value: "15 min", label: t("stat1Label") },
        { value: "24/7", label: t("stat2Label") },
        { value: "2", label: t("stat3Label") },
        { value: "100%", label: t("stat4Label") },
    ];

    const productsHref = locale === "en" ? "/products" : "/pt-br/products";

    return (
        <main className="container mx-auto px-4 py-8 max-w-5xl">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />

            {/* Back button */}
            <Button variant="ghost" className="mb-6 gap-2" asChild>
                <Link href="/">
                    <ArrowLeft className="h-4 w-4" />
                    {t("backToHome")}
                </Link>
            </Button>

            <div className="space-y-16">
                {/* ── Hero ── */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                        {t("heroTitle")}
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        {t("heroSubtitle")}
                    </p>
                </div>

                {/* ── Who We Are ── */}
                <section className="space-y-4">
                    <h2 className="text-2xl md:text-3xl font-bold">{t("whoWeAreTitle")}</h2>
                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                        <p>{t("whoWeArePara1")}</p>
                        <p>{t("whoWeArePara2")}</p>
                    </div>
                </section>

                {/* ── Why Players Trust Us ── */}
                <section className="space-y-6">
                    <h2 className="text-2xl md:text-3xl font-bold">{t("whyTrustTitle")}</h2>
                    <div className="grid sm:grid-cols-2 gap-6">
                        {trustCards.map((card, i) => (
                            <Card
                                key={i}
                                className="p-6 flex gap-5 items-start hover:shadow-lg transition-shadow"
                            >
                                <div
                                    className={`shrink-0 w-14 h-14 ${card.bg} rounded-xl flex items-center justify-center`}
                                >
                                    {card.icon}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
                                    <p className="text-sm text-muted-foreground">{card.body}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── How It Works ── */}
                <section className="space-y-6">
                    <h2 className="text-2xl md:text-3xl font-bold">{t("howWorksTitle")}</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {steps.map((step, i) => (
                            <Card key={i} className="p-6 space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-black text-primary/30">
                                        {step.num}
                                    </span>
                                    {step.icon}
                                </div>
                                <h3 className="text-lg font-semibold">{step.title}</h3>
                                <p className="text-sm text-muted-foreground">{step.body}</p>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── Our Commitment ── */}
                <section className="space-y-4">
                    <h2 className="text-2xl md:text-3xl font-bold">
                        {t("commitmentTitle")}
                    </h2>
                    <Card className="p-8 bg-primary/5 border-primary/20 space-y-4 text-muted-foreground leading-relaxed">
                        <p>{t("commitmentPara1")}</p>
                        <p>{t("commitmentPara2")}</p>
                        <p>{t("commitmentPara3")}</p>
                    </Card>
                </section>

                {/* ── Stats ── */}
                <section className="space-y-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-center">
                        {t("statsTitle")}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stats.map((s, i) => (
                            <Card
                                key={i}
                                className="p-6 text-center space-y-1 hover:shadow-lg transition-shadow"
                            >
                                <p className="text-3xl md:text-4xl font-black text-primary">
                                    {s.value}
                                </p>
                                <p className="text-sm text-muted-foreground">{s.label}</p>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ── CTA ── */}
                <Card className="p-10 text-center space-y-5 bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border-indigo-700/40">
                    <h2 className="text-3xl font-bold">{t("ctaTitle")}</h2>
                    <Button size="lg" asChild>
                        <a href={productsHref}>
                            <ShoppingBag className="mr-2 h-5 w-5" />
                            {t("ctaButton")}
                        </a>
                    </Button>
                </Card>
            </div>
        </main>
    );
}
