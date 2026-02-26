import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getBuildBySlug, getPublishedBuildSlugs, getRelatedBuilds } from "@/app/actions";
import { getBuildGuideBySlug } from "@/sanity/sanity-utils";
import { generateKeywords, buildBreadcrumbSchema } from "@/lib/utils";
import BuildHero from "@/components/Builds/BuildHero";
import BuildGuide from "@/components/Builds/BuildGuide";
import RelatedBuilds from "@/components/Builds/RelatedBuilds";
import { BlockContentRenderer } from "@/components/portable-text/blockContentComponents";

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

  const [sanityGuide, relatedBuilds] = await Promise.all([
    !build.guide_content?.trim() ? getBuildGuideBySlug(build.slug) : null,
    getRelatedBuilds(build.slug, 3, { ascendancy: build.ascendancy }),
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
    image: build.image_url ? [build.image_url] : undefined,
    datePublished: build.created_at,
    dateModified: build.updated_at,
    author: build.author ? { '@type': 'Person', name: build.author } : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Path of Trade',
      url: baseUrl,
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

        {/* Guide content: same prose style as blog (no card background) */}
        {(build.guide_content?.trim() || sanityGuide) && (
          <div className="mt-8">
            {build.guide_content?.trim() ? (
              <BuildGuide content={build.guide_content} />
            ) : sanityGuide ? (
              <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-a:text-amber-600 dark:prose-a:text-amber-400 prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-amber-700 dark:prose-code:text-amber-300 prose-li:text-gray-700 dark:prose-li:text-gray-300">
                <BlockContentRenderer value={sanityGuide.body} />
              </div>
            ) : null}
          </div>
        )}

        {relatedBuilds.length > 0 && (
          <RelatedBuilds builds={relatedBuilds} locale={locale} />
        )}
      </article>
    </>
  );
}
