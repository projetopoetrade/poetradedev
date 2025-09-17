import { NextResponse } from "next/server";
import { Blog } from "@/types/blog";

import { getLeagues, getProducts } from "@/app/actions";
import { getPosts } from "@/sanity/sanity-utils";
import type { Product } from "@/lib/interface";

export async function GET() {
  try {
    // Call your actions to get the data
    const posts = await getPosts(); // Example action
    const products = await getProducts(); // Example action
    const leaguePoe1 = await getLeagues("path-of-exile-1"); // Example action
    const leaguePoe2 = await getLeagues("path-of-exile-2"); // Example action

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
      

      // For leagues (IMPORTANT CHANGE)
      leaguePoe1:
        leaguePoe1?.map(
          (league: {
            name: string;
            gameVersion: string;
            difficulty: string;
            updatedAt: string;
          }) => ({
            name: league.name,
            gameVersion: league.gameVersion,
            difficulty: league.difficulty,
            updatedAt: league.updatedAt?.toString() ?? "", // Use optional chaining/nullish coalescing
          })
        ) ?? [],

      leaguePoe2:
        leaguePoe2?.map(
          (league: {
            name: string;
            gameVersion: string;
            difficulty: string;
            updatedAt: string;
          }) => ({
            name: league.name,
            gameVersion: league.gameVersion,
            difficulty: league.difficulty,
            updatedAt: league.updatedAt?.toString() ?? "", // Use optional chaining/nullish coalescing
          })
        ) ?? [],
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching sitemap data:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
