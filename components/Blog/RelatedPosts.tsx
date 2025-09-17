import { Blog } from "@/types/blog";
import Link from "next/link";
import React from "react";

interface RelatedPostsProps {
  posts: Blog[];
  locale: string;
}

const RelatedPosts = ({ posts, locale }: RelatedPostsProps) => {
  if (!posts.length) return null;

  return (
    <section className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Related Posts
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post._id}
            href={`/${locale}/blog/${post.slug.current}`}
            className="group block no-underline"
          >
            <article className="p-4 rounded-lg transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-900">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(post.publishedAt).toLocaleDateString(locale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {post.metadata}
              </p>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedPosts; 