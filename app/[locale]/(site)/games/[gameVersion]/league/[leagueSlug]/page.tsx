import React from "react";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, AlertTriangle } from "lucide-react";
import {
    LeagueHero,
    TableOfContents,
    TLDRSection,
    MechanicAnalysis,
    LeagueStarters,
    PatchNotesSection,
} from "@/components/League";
import { buildCanonical, buildAbsoluteUrl, generateKeywords } from "@/lib/utils";
import { getLeagueBySlug, getAllLeagues, getLiveLeague } from "@/sanity/sanity-utils";

export const revalidate = 300;

interface PageProps {
    params: Promise<{ leagueSlug: string; gameVersion: string; locale: string }>;
}

// ─── generateStaticParams ────────────────────────────────────────────────────

export async function generateStaticParams() {
    try {
        const leagues = await getAllLeagues();
        return leagues.flatMap((l) =>
            ["en", "pt-br"].map((locale) => ({
                locale,
                gameVersion: l.gameVersion,
                leagueSlug: l.slug,
            }))
        );
    } catch {
        return [];
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function leaguePath(slug: string, gameVersion: string, locale: string) {
    const base = `/games/${gameVersion}/league/${slug}`;
    return locale === "en" ? base : `/${locale}${base}`;
}

function formatDate(dateStr: string, locale: string) {
    try {
        return new Intl.DateTimeFormat(locale === "pt-br" ? "pt-BR" : "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }).format(new Date(dateStr));
    } catch {
        return dateStr;
    }
}

function extractYouTubeId(url: string): string | null {
    try {
        const u = new URL(url);
        if (u.pathname.includes("/embed/")) return u.pathname.split("/embed/")[1].split("?")[0];
        if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("?")[0];
        return u.searchParams.get("v");
    } catch {
        return null;
    }
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net").replace(/\/+$/, "");

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata(props: PageProps): Promise<Metadata> {
    const { leagueSlug, gameVersion, locale } = await props.params;
    const league = await getLeagueBySlug(leagueSlug);

    // Strict URL Validation: if the gameVersion in the URL doesn't match the one in DB, return 404
    if (!league || league.gameVersion !== gameVersion) return { title: "League Not Found" };

    const gameLabel = league.gameVersion === "path-of-exile-2" ? "Path of Exile 2" : "Path of Exile 1";
    const launchFormatted = league.launchDate ? formatDate(league.launchDate, locale) : "";

    let title: string;
    let description: string;

    if (league.status === "announced") {
        title =
            league.seoTitle ||
            `${league.title} — Release Date, Teasers & What We Know | Path of Trade`;
        description =
            league.seoDescription ||
            `${league.title} launches${launchFormatted ? ` on ${launchFormatted}` : ""}. See teasers, GGG posts, and prepare your currency for day one.`;
    } else if (league.status === "ended") {
        title = league.seoTitle || `${league.title} — League Archive | Path of Trade`;
        description =
            league.seoDescription ||
            `${league.title} has ended. View builds, mechanic guide and patch notes from this league.`;
    } else {
        const patch = league.patchVersion ? ` ${league.patchVersion}` : "";
        title =
            league.seoTitle ||
            `${league.title}${patch} — Builds, Patch Notes & Currency Guide | ${gameLabel} | Path of Trade`;
        description =
            league.seoDescription ||
            `${league.title} league starter builds tier list, mechanic guide, and patch notes highlights. Buy currency for ${league.title} with fast delivery.`;
    }

    const canonical = buildCanonical(leaguePath(leagueSlug, gameVersion, locale), locale);

    return {
        title,
        description,
        alternates: {
            canonical,
            languages: {
                en: buildAbsoluteUrl(leaguePath(leagueSlug, gameVersion, "en")),
                "pt-BR": buildAbsoluteUrl(leaguePath(leagueSlug, gameVersion, "pt-br")),
                "x-default": buildAbsoluteUrl(leaguePath(leagueSlug, gameVersion, "en")),
            },
        },
        openGraph: {
            title,
            description,
            url: canonical,
            type: "article",
            siteName: "Path of Trade",
            ...(league.bannerImage?.asset?.url && {
                images: [{ url: league.bannerImage.asset.url, width: 1200, height: 630, alt: league.title }],
            }),
        },
        twitter: { card: "summary_large_image", title, description },
        keywords: generateKeywords({
            locale,
            leagueSlug,
            customKeywords: ["poe league", "league guide", "patch notes", "league starters", "buy currency"],
        }),
    };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function LeaguePage(props: PageProps) {
    const { leagueSlug, gameVersion, locale } = await props.params;
    setRequestLocale(locale);

    const [league, t] = await Promise.all([
        getLeagueBySlug(leagueSlug),
        getTranslations({ locale, namespace: "League" }),
    ]);

    if (!league || league.gameVersion !== gameVersion) notFound();

    const imageUrl = league.bannerImage?.asset?.url;
    const launchFormatted = league.launchDate ? formatDate(league.launchDate, locale) : "";
    const endFormatted = league.endDate ? formatDate(league.endDate, locale) : "";
    const gameLabel = league.gameVersion === "path-of-exile-2" ? "Path of Exile 2" : "Path of Exile 1";
    const baseUrl = `${SITE_URL}${leaguePath(leagueSlug, gameVersion, locale)}`;

    // ─── JSON-LD ──────────────────────────────────────────────────────────────

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: league.title,
        description: league.subtitle,
        url: baseUrl,
        inLanguage: locale === "pt-br" ? "pt-BR" : "en-US",
        datePublished: league.datePublished || league.launchDate,
        dateModified: league._updatedAt,
        publisher: {
            "@type": "Organization",
            name: "Path of Trade",
            logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
        },
        breadcrumb: {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}${locale === "en" ? "" : `/${locale}`}` },
                { "@type": "ListItem", position: 2, name: gameLabel, item: `${SITE_URL}${locale === "en" ? "" : `/${locale}`}/games/${league.gameVersion}` },
                { "@type": "ListItem", position: 3, name: league.title, item: baseUrl },
            ],
        },
    };

    // Auto-generate FAQs
    const faqItems: { q: string; a: string }[] = [];
    if (league.status === "announced") {
        if (launchFormatted)
            faqItems.push({ q: `When does ${league.title} launch?`, a: `${league.title} is scheduled to launch on ${launchFormatted}.` });
        faqItems.push({ q: `Where to buy currency for ${league.title}?`, a: `Path of Trade will have currency available from ${league.title} launch day.` });
    } else {
        if (league.mechanics?.description)
            faqItems.push({ q: `What is the ${league.title} league mechanic?`, a: league.mechanics.description });
        if (league.starters?.builds?.length)
            faqItems.push({ q: `What are the best builds for ${league.title}?`, a: `Top picks for ${league.title} include: ${league.starters.builds.slice(0, 3).map((b) => b.name).join(", ")}.` });
        faqItems.push({ q: `Where to buy currency for ${league.title}?`, a: `Path of Trade offers fast delivery of Divine Orbs, Chaos Orbs and more for ${league.title}.` });
    }

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
        })),
    };

    // ─── PRE-LAUNCH ──────────────────────────────────────────────────────────

    if (league.status === "announced") {
        return (
            <>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

                <main className="container mx-auto min-h-screen">
                    <LeagueHero
                        title={league.title}
                        subtitle={league.subtitle || (locale === "pt-br" ? `Prepare-se para a próxima liga do ${gameLabel}` : `Prepare for the next ${gameLabel} league`)}
                        version={league.patchVersion || ""}
                        releaseDate={launchFormatted ? `${t("launchDate")}: ${launchFormatted}` : ""}
                        imageUrl={imageUrl}
                        locale={locale}
                        status="announced"
                    />

                    <div className="space-y-12 py-8">
                        {/* Teaser Text */}
                        {league.prelaunchTeaser && (
                            <section className="container mx-auto px-4">
                                <div className="max-w-3xl mx-auto">
                                    <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
                                        {t("whatWeKnowSoFar")}
                                    </h2>
                                    <div className="bg-muted/30 border border-border rounded-xl p-6">
                                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                            {league.prelaunchTeaser}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Teaser Media */}
                        {league.prelaunchMediaUrls && league.prelaunchMediaUrls.length > 0 && (
                            <section className="container mx-auto px-4">
                                <div className="max-w-4xl mx-auto">
                                    <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
                                        {t("teaserMedia")}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {league.prelaunchMediaUrls.map((url, i) => {
                                            const id = extractYouTubeId(url);
                                            const src = id ? `https://www.youtube.com/embed/${id}` : url;
                                            return (
                                                <div key={i} className="aspect-video rounded-xl overflow-hidden border border-border shadow-lg">
                                                    <iframe src={src} title={`Teaser ${i + 1}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* GGG Posts */}
                        {league.gggPosts && league.gggPosts.length > 0 && (
                            <section className="container mx-auto px-4">
                                <div className="max-w-3xl mx-auto">
                                    <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">
                                        {t("gggOfficialPosts")}
                                    </h2>
                                    <div className="space-y-4">
                                        {league.gggPosts.map((post, i) => (
                                            <Card key={i} className="hover:shadow-md transition-shadow">
                                                <CardContent className="p-5">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <h3 className="font-semibold text-foreground leading-tight">{post.title}</h3>
                                                        <Badge variant="outline" className="shrink-0">GGG</Badge>
                                                    </div>
                                                    {post.date && (
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDate(post.date, locale)}
                                                        </p>
                                                    )}
                                                    {post.summary && (
                                                        <p className="text-sm text-muted-foreground mb-3">{post.summary}</p>
                                                    )}
                                                    {post.url && (
                                                        <a href={post.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                            {t("viewOfficialPost")}
                                                        </a>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Currency notice */}
                        <section className="container mx-auto px-4">
                            <div className="max-w-2xl mx-auto text-center bg-primary/5 border border-primary/20 rounded-xl p-8">
                                <p className="text-lg font-semibold text-foreground mb-1">
                                    {t("currencyOnLaunchDay")}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {locale === "pt-br"
                                        ? `Currency de ${league.title} disponível a partir do lançamento.`
                                        : `${league.title} currency will be available from launch day.`}
                                </p>
                            </div>
                        </section>

                        {/* CTA */}
                        <section className="container mx-auto px-4 py-8">
                            <div className="text-center">
                                <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">
                                    {t("cta.title")}
                                </h2>
                                <p className="text-lg mb-8 max-w-2xl mx-auto text-muted-foreground">
                                    {t("cta.description")}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button asChild size="lg" className="font-bold text-lg px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200">
                                        <Link href="/products">{t("browseAllCurrency")}</Link>
                                    </Button>
                                    <Button asChild size="lg" variant="ghost" className="text-muted-foreground hover:text-foreground">
                                        <Link href="/blog">{t("cta.moreGuides")}</Link>
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </>
        );
    }

    // ─── LIVE / ENDED ────────────────────────────────────────────────────────

    const liveLeague = league.status === "ended" ? await getLiveLeague() : null;

    // Build TOC from translation array, filtered to sections with actual data
    const activeSectionIds = new Set([
        league.tldr ? "tldr" : null,
        league.mechanics ? "mechanics" : null,
        league.patchNotes ? "patch-notes" : null,
        league.starters?.builds?.length ? "builds" : null,
    ].filter(Boolean));

    const allTocItems: { id: string; title: string }[] = t.raw("toc.items") as any;
    const tocItems = allTocItems.filter((item) => activeSectionIds.has(item.id));

    const ctaLink =
        league.ctaLink ||
        `/products?gameVersion=${league.gameVersion}&league=${encodeURIComponent(league.title)}&difficulty=softcore`;

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            <main className="container mx-auto min-h-screen">
                {/* ENDED BANNER */}
                {league.status === "ended" && (
                    <div className="bg-muted border-b border-border">
                        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>
                                    {t("leagueEnded")}
                                    {endFormatted && ` (${endFormatted})`}
                                </span>
                            </div>
                            {liveLeague && (
                                <Link href={`/games/${liveLeague.gameVersion}/league/${liveLeague.slug}`} className="text-sm font-medium text-primary hover:underline underline-offset-2">
                                    {t("lookingForCurrentLeague")} → {liveLeague.title}
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                {/* HERO */}
                <LeagueHero
                    title={league.title}
                    subtitle={league.subtitle || ""}
                    version={league.patchVersion || ""}
                    releaseDate={launchFormatted}
                    imageUrl={imageUrl}
                    locale={locale}
                    status={league.status}
                    liveLabel={t("liveNow")}
                    endedLabel={t("leagueEndedBadge")}
                />

                {/* TOC */}
                {tocItems.length > 0 && (
                    <TableOfContents title={t("toc.title")} items={tocItems} />
                )}

                <article>
                    {/* TL;DR */}
                    {league.tldr && (
                        <div id="tldr">
                            <TLDRSection title={league.tldr.title} items={league.tldr.items as any} />
                        </div>
                    )}

                    {/* Mechanic Analysis */}
                    {league.mechanics && (
                        <div id="mechanics">
                            <MechanicAnalysis
                                title={league.mechanics.title}
                                description={league.mechanics.description}
                                mainPoints={league.mechanics.points}
                                tradeImpact={league.mechanics.tradeImpact}
                                ctaLink={ctaLink}
                                ctaText={t("buyDivines")}
                                locale={locale}
                            />
                        </div>
                    )}

                    {/* Patch Notes */}
                    {league.patchNotes && (
                        <div id="patch-notes">
                            <PatchNotesSection
                                title={league.patchNotes.title}
                                subtitle={league.patchNotes.subtitle}
                                categories={league.patchNotes.categories}
                                officialNotesUrl={league.patchNotes.officialUrl}
                                officialNotesText={league.patchNotes.officialText}
                            />
                        </div>
                    )}

                    {/* League Starters */}
                    {league.starters && league.starters.builds.length > 0 && (
                        <div id="builds">
                            <LeagueStarters
                                title={league.starters.title}
                                subtitle={league.starters.subtitle}
                                tierS={league.starters.tierS}
                                tierA={league.starters.tierA}
                                builds={league.starters.builds as any}
                                locale={locale}
                            />
                        </div>
                    )}

                    {/* CTA */}
                    <section className="container mx-auto px-4 py-16">
                        <div className="text-center">
                            <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">
                                {t("cta.title")}
                            </h2>
                            <p className="text-lg mb-8 max-w-2xl mx-auto text-muted-foreground">
                                {t("cta.description")}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button asChild size="lg" className="font-bold text-lg px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200">
                                    <Link href={ctaLink}>{t("cta.buyNow")}</Link>
                                </Button>
                                <Button asChild size="lg" variant="ghost" className="text-muted-foreground hover:text-foreground">
                                    <Link href="/blog">{t("cta.moreGuides")}</Link>
                                </Button>
                            </div>
                        </div>
                    </section>
                </article>
            </main>
        </>
    );
}
