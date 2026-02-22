import { NextResponse } from "next/server";
import { Blog } from "@/types/blog";

import { getProducts } from "@/app/actions";
import { getPosts } from "@/sanity/sanity-utils";
import type { Product } from "@/lib/interface";

export async function GET() {
  try {
    // Call your actions to get the data
    const postsEn = await getPosts("en", 1, 100);
    const postsPtBr = await getPosts("pt-br", 1, 100);
    const posts = [...(postsEn || []), ...(postsPtBr || [])];

    const products = await getProducts(); // Example action

    // Combine or format data as needed
    const data = {
      // For posts
      posts:
        posts?.map((post: Blog) => ({
          slug: post.slug,
          updatedAt: post.publishedAt?.toString() ?? "",
        })) ?? [], // Add ?? [] in case posts itself is null/undefined

      products: products?.map((product: Product) => ({
        name: product.name,
        gameVersion: product.gameVersion,
        league: product.league,
        difficulty: product.difficulty,
        updatedAt: product.updatedAt?.toString() ?? "",
      })) ?? [],
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching sitemap data:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
