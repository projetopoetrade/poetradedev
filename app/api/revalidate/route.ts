import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

// Sanity types whose publish/unpublish events should bust the sitemap cache.
// Posts are the only Sanity-driven entries in app/sitemap.ts today; products
// in the sitemap come from Supabase, so a Sanity product publish does not
// invalidate the sitemap from this handler.
const SITEMAP_TYPES = new Set(["post"]);

const bustSitemapIfNeeded = (type: string) => {
  if (SITEMAP_TYPES.has(type)) revalidatePath("/sitemap.xml");
};

export async function POST(req: NextRequest) {
  try {
    // Check if it's an internal request with authorization header
    const authHeader = req.headers.get("authorization");
    const internalSecret = process.env.REVALIDATE_SECRET || "your-secret-key";

    if (authHeader === `Bearer ${internalSecret}`) {
      // Internal request - parse JSON directly
      const body = await req.json();

      if (!body?._type) {
        return new Response("Bad Request: _type is required", { status: 400 });
      }

      revalidateTag(body._type);
      bustSitemapIfNeeded(body._type);
      return NextResponse.json({
        status: 200,
        revalidated: true,
        sitemapRevalidated: SITEMAP_TYPES.has(body._type),
        now: Date.now(),
        body,
      });
    }

    // Sanity webhook request - validate signature
    const { body, isValidSignature } = await parseBody<{
      _type: string;
      slug?: string | undefined;
    }>(req, process.env.NEXT_PUBLIC_SANITY_HOOK_SECRET);

    if (!isValidSignature) {
      return new Response("Invalid Signature", { status: 401 });
    }

    if (!body?._type) {
      return new Response("Bad Request", { status: 400 });
    }

    revalidateTag(body._type);
    bustSitemapIfNeeded(body._type);
    return NextResponse.json({
      status: 200,
      revalidated: true,
      sitemapRevalidated: SITEMAP_TYPES.has(body._type),
      now: Date.now(),
      body,
    });
  } catch (error: any) {
    console.error(error);
    return new Response(error.message, { status: 500 });
  }
}