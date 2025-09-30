import React from "react";
import Link from "next/link";
import { getPostBySlug, getRelatedPosts } from "@/sanity/sanity-utils";
import RenderBodyContent from "@/components/Blog/RenderBodyContent";
import RelatedPosts from "@/components/Blog/RelatedPosts";
import { Blog } from "@/types/blog";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildCanonical, getHreflangAlternates } from "@/lib/utils";

interface PageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const { slug, locale } = params;
  const t = await getTranslations({ locale, namespace: "SEO" });

  const post = await getPostBySlug(slug, locale);

  if (!post) {
    return { title: t("blog.notFoundTitle") };
  }

  const canonical = buildCanonical(`/${locale}/blog/${slug}`);
  const siteName = "Path of Trade";
  const titleWithSuffix = `${post.title} | ${siteName}`;

  return {
    title: titleWithSuffix,
    description: post.metadata,
    alternates: {
      canonical,
      ...getHreflangAlternates({
        "en": `/en/blog/${slug}`,
        "pt-br": `/pt-br/blog/${slug}`
      })
    },
    openGraph: {
      title: titleWithSuffix,
      description: post.metadata,
      url: canonical,
      type: "article",
      siteName: t("siteName")
    },
    twitter: {
      card: "summary_large_image",
      title: titleWithSuffix,
      description: post.metadata
    },
  };
}

const SingleBlogPage = async (props: PageProps) => {
  const params = await props.params;

  const {
    slug,
    locale
  } = params;

  const post = await getPostBySlug(slug, locale);
  const relatedPosts: Blog[] = await getRelatedPosts(slug, locale);

  if (!post) {
    return <div className="py-5">Post not found</div>;
  }

  return (
    <article className="max-w-5xl mx-auto px-4 py-12">
      <Link 
        href={`/${locale}/blog`}
        className="inline-flex items-center px-4 py-2 rounded-lg text-gray-600 dark:text-gray-200 hover:text-gray-200 dark:hover:text-white mb-8 transition-all duration-200  group"
      >
        <svg 
          className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10 19l-7-7m0 0l7-7m-7 7h18" 
          />
        </svg>
        <span className="font-medium">Back to Blog</span>
      </Link>
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
          {post.title}
        </h1>
        
        <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 mb-8">
          <time className="text-sm">
            {new Date(post.publishedAt).toLocaleDateString(locale, {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </time>
          <span className="text-sm">•</span>
          <span className="text-sm">By {post.author.name}</span>
        </div>

        <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          {post.metadata}
        </p>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <RenderBodyContent post={post} />
      </div>

      {relatedPosts.length > 0 && (
        <RelatedPosts posts={relatedPosts} locale={locale} />
      )}
    </article>
  );
};

export default SingleBlogPage;