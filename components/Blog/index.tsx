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
          <div className="relative w-32 md:w-56 flex-shrink-0 rounded-md overflow-hidden aspect-[4/3]">
            <Image
              src={imageBuilder(blog.mainImage)
                .width(800)
                .height(600)
                .quality(85)
                .fit('fill')
                .url()}
              alt={blog.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 128px, 224px"
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