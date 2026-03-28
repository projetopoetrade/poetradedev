import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabase } from '@/utils/supabase/server'
import { client as sanityClient } from '@/sanity/lib/client'
import { groq } from 'next-sanity'

export const revalidate = 60

// ─── Sanity queries ───────────────────────────────────────────────────────────

const searchPostsQuery = groq`*[_type == "post" && language == $language && (
  title match $q || pt::text(body) match $q
)] | order(publishedAt desc) [0...5] {
  title,
  "slug": slug.current,
  metadata,
  "imageUrl": mainImage.asset->url,
  publishedAt
}`

const searchLeaguesQuery = groq`*[_type == "league" && (
  title match $q || slug.current match $q
)] | order(launchDate desc) [0...4] {
  title,
  "slug": slug.current,
  gameVersion,
  status,
  "imageUrl": bannerImage.asset->url
}`

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const locale = searchParams.get('locale') ?? 'en'

  if (q.length < 2) {
    return NextResponse.json({ products: [], posts: [], leagues: [] })
  }

  try {
    const supabase = await createSupabase()

    const [productsResult, posts, leagues] = await Promise.all([
      // Products from Supabase
      supabase
        .from('products')
        .select('name, slug, category, imgUrl, price, gameVersion, in_stock, is_listed')
        .ilike('name', `%${q}%`)
        .eq('is_listed', true)
        .limit(6),

      // Blog posts from Sanity
      sanityClient.fetch(searchPostsQuery, { q: `${q}*`, language: locale }),

      // Leagues from Sanity
      sanityClient.fetch(searchLeaguesQuery, { q: `${q}*` }),
    ])

    return NextResponse.json({
      products: productsResult.data ?? [],
      posts: posts ?? [],
      leagues: leagues ?? [],
    })
  } catch (error) {
    console.error('[/api/search] Error:', error)
    return NextResponse.json({ products: [], posts: [], leagues: [] }, { status: 500 })
  }
}
