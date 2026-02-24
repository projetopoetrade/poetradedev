import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAuthorBySlug, getPostsByAuthor, SanityAuthor } from "@/sanity/sanity-utils";
import { Blog } from "@/types/blog";
import { buildCanonical, buildAbsoluteUrl } from "@/lib/utils";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Link } from "@/i18n/navigation";

export const revalidate = 300;

interface PageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug, locale } = await props.params;
  const author = await getAuthorBySlug(slug);

  if (!author) {
    return { title: "Author Not Found" };
  }

  const canonical = buildCanonical(`/blog/author/${slug}`, locale);
  const siteName = "Path of Trade";
  const titleWithSuffix = `${author.name} - Author | ${siteName}`;

  return {
    title: titleWithSuffix,
    description: author.bio || `Articles by ${author.name} on Path of Trade`,
    alternates: {
      canonical,
      languages: {
        en: buildAbsoluteUrl(`/blog/author/${slug}`),
        "pt-BR": buildAbsoluteUrl(`/pt-br/blog/author/${slug}`),
        "x-default": buildAbsoluteUrl(`/blog/author/${slug}`),
      },
    },
    openGraph: {
      title: titleWithSuffix,
      description: author.bio || `Articles by ${author.name} on Path of Trade`,
      url: canonical,
      type: "profile",
      siteName,
      ...(author.image && typeof author.image === 'string' && author.image.trim() !== '' && { images: [{ url: author.image }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: titleWithSuffix,
      description: author.bio || `Articles by ${author.name} on Path of Trade`,
    },
  };
}

export default async function AuthorPage(props: PageProps) {
  const { slug, locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "AuthorPage" });
  
  const [author, posts] = await Promise.all([
    getAuthorBySlug(slug),
    getPostsByAuthor(slug, locale),
  ]);

  if (!author) {
    notFound();
  }

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    ...(author.image && typeof author.image === 'string' && author.image.trim() !== '' && { image: author.image }),
    ...(author.bio && { description: author.bio }),
    url: buildAbsoluteUrl(`/blog/author/${slug}`),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": buildAbsoluteUrl(`/blog/author/${slug}`),
    },
  };

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <Breadcrumb
        items={[
          { label: locale === "pt-br" ? "Blog" : "Blog", href: "/blog" },
          { label: author.name },
        ]}
      />

      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-12">
        {author.image && typeof author.image === 'string' && author.image.trim() !== '' && (
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted shrink-0">
            <Image
              src={author.image}
              alt={author.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{author.name}</h1>
          {author.bio && (
            <p className="text-muted-foreground text-lg max-w-2xl">
              {author.bio}
            </p>
          )}
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6">
        {t("posts-by", { author: author.name })}
      </h2>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">{t("no-posts")}</p>
      ) : (
        <div className="grid gap-6">
          {posts.map((post: Blog) => (
            <Link
              key={post._id}
              href={`/blog/${post.slug.current}`}
              className="group block p-6 rounded-lg border border-border hover:border-primary/50 transition-colors no-underline"
            >
              <div className="flex flex-col md:flex-row gap-4">
                {post.mainImage?.asset?.url && (
                  <div className="relative w-full md:w-48 h-32 rounded overflow-hidden shrink-0">
                    <Image
                      src={post.mainImage.asset.url}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  {post.metadata && (
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                      {post.metadata}
                    </p>
                  )}
                  <time className="text-xs text-muted-foreground">
                    {new Date(post.publishedAt).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
