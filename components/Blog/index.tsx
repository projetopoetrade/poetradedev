import { Blog } from "@/types/blog";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import { imageBuilder } from "@/sanity/sanity-utils";

interface BlogItemProps {
  blog: Blog;
  locale: string;
}

const BlogItem = ({ blog, locale }: BlogItemProps) => {
  return (
    <Link
      href={`/${locale}/blog/${blog.slug.current}`}
      className="block p-4 bg-black/40 backdrop-blur-sm rounded-lg border border-gray-800/50 hover:border-gray-500/50 transition-all duration-300 my-6 group no-underline" 
    >
      <article className="flex gap-4 items-start">
        {blog.mainImage && (
          <div className="relative min-w-32 min-h-36  md:min-w-56 md:min-h-40 flex-shrink-0 rounded-md overflow-hidden">
            <Image
              src={imageBuilder(blog.mainImage)
                .width(800)
                .height(400)
                .quality(85)
                .url()}
              alt={blog.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105 m-0 mt-2 md:m-0  "
              sizes="(max-width: 768px) 100vw, 800px"
              loading="lazy"
              priority={false}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="mb-1 text-xl  text-white group-hover:text-gray-300 transition-colors line-clamp-2 mt-4">
            {blog.title}
          </h3>
          <p className="mb-2 text-xs text-gray-500/70">
            {new Date(blog.publishedAt).toLocaleDateString(locale, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </p>
          <p className="text-base text-gray-400 line-clamp-2 max-w-[90%] ">
            {blog.metadata}
          </p>
        </div>
      </article>
    </Link>
  );
};

export default BlogItem;