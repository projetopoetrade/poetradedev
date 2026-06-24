import { Blog } from "@/types/blog";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import React from "react";
import { imageBuilder } from "@/sanity/sanity-utils";

interface RelatedPostsProps {
  posts: Blog[];
  locale: string;
}

const RelatedPosts = ({ posts, locale }: RelatedPostsProps) => {
  if (!posts.length) return null;

  return (
    <section className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        {locale === "pt-br" ? "Posts Relacionados" : "Related Posts"}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post._id}
            href={`/blog/${post.slug.current}`}
            className="group block no-underline"
          >
            <article className="rounded-lg overflow-hidden bg-black/40 backdrop-blur-sm border border-gray-800/50 hover:border-gray-500/50 transition-all duration-300">
              {post.mainImage && (
                <div className="relative w-full h-48 overflow-hidden">
                  <Image
                    src={imageBuilder(post.mainImage)
                      .width(600)
                      .height(400)
                      .quality(80)
                      .url()}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-gray-300 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-500/70 mb-2">
                  {new Date(post.publishedAt).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {post.metadata}
                </p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedPosts; 