import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getBuildBySlug, getPublishedBuildSlugs, getRelatedBuilds } from "@/app/actions";
import { getBuildGuideBySlug, getBuildOverviewBySlug } from "@/sanity/sanity-utils";
import { generateKeywords, buildBreadcrumbSchema, getOgLocale } from "@/lib/utils";
import BuildHero from "@/components/Builds/BuildHero";
import RelatedBuilds from "@/components/Builds/RelatedBuilds";
import { BlockContentRenderer } from "@/components/portable-text/blockContentComponents";
import { resolveBlocks } from "@/lib/placeholders/resolve-blocks";

export const revalidate = 300;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getPublishedBuildSlugs();
  const locales = ['en', 'pt-br'];
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const build = await getBuildBySlug(slug);

  if (!build) {
    return { title: 'Build Not Found | Path of Trade' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pathoftrade.net';
  const title = `${build.seo_title || build.title} — PoE Build Guide | Path of Trade`;
  const description =
    build.seo_description ||
    build.description ||
    `${build.ascendancy} build guide for Path of Exile. ${build.tags.join(', ')}.`;

  const enUrl = `${baseUrl}/builds/${build.slug}`;
  const ptUrl = `${baseUrl}/pt-br/builds/${build.slug}`;
  const canonicalUrl = locale === 'en' ? enUrl : ptUrl;

  const keywords = generateKeywords({
    locale,
    blogTitle: build.title,
    gameVersion: build.game_version,
    customKeywords: ['poe build', 'path of exile build', build.class, build.ascendancy, ...build.tags],
  });

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: enUrl,
        'pt-BR': ptUrl,
        'x-default': enUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
      ...getOgLocale(locale),
      siteName: 'Path of Trade',
      ...(build.image_url ? { images: [{ url: build.image_url }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function BuildPage({ params }: Props) {
  const { locale, slug } = await params;
  const build = await getBuildBySlug(slug);

  if (!build) {
    notFound();
  }

const [sanityGuide, relatedBuilds, buildOverview] =
    await Promise.all([
      getBuildGuideBySlug(build.slug),
      getRelatedBuilds(build.slug, 3, { ascendancy: build.ascendancy }),
      getBuildOverviewBySlug(build.slug),
    ]);

  // Resolve placeholders ({{item:...}}, gems, currency, {{price:...}},
  // {{pobitem:...}}, {{passive:...}}, {{cta:...}}) in the Sanity-authored guide
  // content — the exact pipeline the blog runs — so build guides can embed the
  // same item/gem cards. Server-side; cached by ISR (revalidate 300).
  // gameVersion drives {{cta:...}} defaulting (poe1/poe2).
  const resolveCtx = {
    locale,
    gameVersion:
      build.game_version === "path-of-exile-2"
        ? ("path-of-exile-2" as const)
        : ("path-of-exile-1" as const),
  };
  const [resolvedSections, resolvedGuideBody] = await Promise.all([
    Promise.all(
      (buildOverview?.sections ?? []).map(async (section) => ({
        ...section,
        body: Array.isArray(section.body)
          ? await resolveBlocks(section.body as never, resolveCtx)
          : section.body,
      })),
    ),
    sanityGuide && Array.isArray((sanityGuide as { body?: unknown }).body)
      ? resolveBlocks((sanityGuide as { body: never }).body, resolveCtx)
      : Promise.resolve(null),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pathoftrade.net';
  const buildsUrl = locale === 'en' ? `${baseUrl}/builds` : `${baseUrl}/pt-br/builds`;
  const buildUrl = locale === 'en' ? `${baseUrl}/builds/${build.slug}` : `${baseUrl}/pt-br/builds/${build.slug}`;

  const breadcrumbJsonLd = buildBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Builds', url: locale === 'pt-br' ? '/pt-br/builds' : '/builds' },
    { name: build.title, url: locale === 'pt-br' ? `/pt-br/builds/${build.slug}` : `/builds/${build.slug}` },
  ]);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: build.title,
    description: build.description ?? build.seo_description ?? '',
    url: buildUrl,
    // image/author/publisher.logo são obrigatórios no schema Article — sempre
    // fornecer um fallback para o JSON-LD validar.
    image: [build.image_url || `${baseUrl}/images/logo.webp`],
    datePublished: build.created_at,
    dateModified: build.updated_at,
    author: build.author
      ? { '@type': 'Person', name: build.author }
      : { '@type': 'Organization', name: 'Path of Trade', url: baseUrl },
    publisher: {
      '@type': 'Organization',
      name: 'Path of Trade',
      url: baseUrl,
      logo: { '@type': 'ImageObject', url: `${baseUrl}/images/logo.webp` },
    },
    inLanguage: locale === 'pt-br' ? 'pt-BR' : 'en-US',
    ...(build.tags?.length ? { keywords: build.tags.join(', ') } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <article className="max-w-5xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-6">
          <a href={locale === 'pt-br' ? '/pt-br' : '/'} className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Home</a>
          <span>/</span>
          <a href={locale === 'pt-br' ? '/pt-br/builds' : '/builds'} className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Builds</a>
          <span>/</span>
          <span className="text-gray-600 dark:text-gray-300 truncate">{build.title}</span>
        </nav>

        {/* Hero */}
        <BuildHero build={build} />

        {/* Sanity-authored sections */}
        {resolvedSections.length > 0 && (
          <div className="mt-8 space-y-8">
            {resolvedSections.map((section) => (
              <section key={section._key}>
                {section.heading && (
                  <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="inline-block w-1 h-5 bg-amber-500 rounded" />
                    {section.heading}
                  </h2>
                )}
                {Array.isArray(section.body) && section.body.length > 0 && (
                  <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-amber-600 dark:prose-a:text-amber-400 prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-amber-700 dark:prose-code:text-amber-300 prose-li:text-gray-700 dark:prose-li:text-gray-300">
                    <BlockContentRenderer value={section.body} />
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        {/* Video embed */}
        {build.video_url && (
          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 my-8">
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                src={build.video_url.replace('watch?v=', 'embed/')}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`${build.title} video guide`}
              />
            </div>
          </div>
        )}

        {/* Guide content (Sanity Portable Text) — same prose style as blog */}
        {resolvedGuideBody && (
          <div className="mt-8">
            <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-amber-600 dark:prose-a:text-amber-400 prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-amber-700 dark:prose-code:text-amber-300 prose-li:text-gray-700 dark:prose-li:text-gray-300">
              <BlockContentRenderer value={resolvedGuideBody} />
            </div>
          </div>
        )}

        {relatedBuilds.length > 0 && (
          <RelatedBuilds builds={relatedBuilds} locale={locale} />
        )}
      </article>
    </>
  );
}
