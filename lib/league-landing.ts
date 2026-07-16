import { sanityFetch } from "@/sanity/sanity-utils";
import {
  leagueLandingBySlugQuery,
  leagueLandingIndexQuery,
  leagueLandingSlugsQuery,
} from "@/sanity/sanity-query";
import type {
  FaqItem,
  Highlight,
  LeagueLanding,
  LeagueLandingSlug,
  LeagueLandingSummary,
  LeagueStatus,
  LocaleField,
  Mechanic,
  RawLeagueLanding,
  RawLeagueLandingSummary,
  Trailer,
  TrailerKind,
} from "@/types/league-landing";

/** Site gold, used when a league has no accent colour of its own. */
export const DEFAULT_ACCENT = "#c9a227";

/**
 * Collapse a localeString/localeText down to one string for `locale`.
 *
 * PT-BR falls back to EN by design: the reveal stream is the one moment where
 * content lands faster than it can be translated, and an untranslated headline
 * beats an empty section. EN is required at the schema level, so the fallback
 * always has something to land on.
 */
export function resolveLocale(
  field: LocaleField | undefined,
  locale: string,
): string | undefined {
  if (!field) return undefined;
  const value = locale === "pt-br" ? field.ptBr || field.en : field.en;
  return value?.trim() || undefined;
}

/**
 * The league's phase, derived purely from `startsAt` vs now.
 *
 * Deriving beats storing a status field: nobody has to remember to flip a toggle
 * at launch, and the page cannot sit on a countdown that has already hit zero.
 * `now` is injectable so the client countdown can re-derive on every tick with
 * its own clock instead of trusting the (cached, possibly stale) server render.
 */
export function getLeagueStatus(
  startsAt: string | undefined,
  now: number = Date.now(),
): LeagueStatus {
  if (!startsAt) return "tba";
  const target = new Date(startsAt).getTime();
  if (Number.isNaN(target)) return "tba";
  return target > now ? "upcoming" : "live";
}

/**
 * YouTube's own thumbnail for a video.
 *
 * `hqdefault` rather than `maxresdefault`: maxres 404s on videos that were never
 * uploaded at 1080p+, and a teaser posted minutes ago during a live stream is
 * exactly the case where that bites. hq always exists.
 */
export function youtubeThumbnail(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function youtubeWatchUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

/** Privacy-enhanced embed host — no YouTube cookie until the user hits play. */
export function youtubeEmbedUrl(
  youtubeId: string,
  opts: { autoplay?: boolean } = {},
): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    ...(opts.autoplay ? { autoplay: "1" } : {}),
  });
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?${params.toString()}`;
}

function resolveTrailers(raw: RawLeagueLanding, locale: string): Trailer[] {
  return (raw.trailers ?? [])
    .filter((t) => t.youtubeId)
    .map((t) => ({
      title: resolveLocale(t.title, locale) ?? "",
      youtubeId: t.youtubeId as string,
      kind: (t.kind ?? "trailer") as TrailerKind,
      thumbnailUrl: t.thumbnail?.asset?.url,
    }));
}

function resolveMechanics(raw: RawLeagueLanding, locale: string): Mechanic[] {
  return (raw.mechanics ?? [])
    .map((m) => ({
      title: resolveLocale(m.title, locale) ?? "",
      summary: resolveLocale(m.summary, locale) ?? "",
      bullets: (m.bullets ?? [])
        .map((b) => resolveLocale(b, locale))
        .filter((b): b is string => Boolean(b)),
      image: m.image,
    }))
    .filter((m) => m.title && m.summary);
}

function resolveHighlights(raw: RawLeagueLanding, locale: string): Highlight[] {
  return (raw.highlights ?? [])
    .map((h) => ({
      label: resolveLocale(h.label, locale) ?? "",
      value: resolveLocale(h.value, locale) ?? "",
    }))
    .filter((h) => h.label && h.value);
}

function resolveFaq(raw: RawLeagueLanding, locale: string): FaqItem[] {
  return (raw.faq ?? [])
    .map((f) => ({
      question: resolveLocale(f.question, locale) ?? "",
      answer: resolveLocale(f.answer, locale) ?? "",
    }))
    .filter((f) => f.question && f.answer);
}

/**
 * Fetch and locale-resolve one league landing. Returns null when the slug does
 * not exist or the document is still a draft (the GROQ filter enforces that).
 */
export async function getLeagueLanding(
  slug: string,
  locale: string,
): Promise<LeagueLanding | null> {
  const raw = await sanityFetch<RawLeagueLanding | null>({
    query: leagueLandingBySlugQuery,
    qParams: { slug },
    // Tagged by _type so the Sanity webhook at /api/revalidate busts this the
    // instant you hit Publish in the Studio — see revalidateTag(body._type).
    tags: ["leagueLanding"],
  });

  if (!raw?.name) return null;

  return {
    id: raw._id,
    updatedAt: raw._updatedAt,
    name: raw.name,
    slug: raw.slug,
    gameVersion: raw.gameVersion,
    version: raw.version,
    tagline: resolveLocale(raw.tagline, locale),
    intro: resolveLocale(raw.intro, locale),
    supabaseLeagueName: raw.supabaseLeagueName,
    startsAt: raw.startsAt,
    revealAt: raw.revealAt,
    patchNotesAt: raw.patchNotesAt,
    accentColor: raw.accentColor || DEFAULT_ACCENT,
    keyArt: raw.keyArt,
    logo: raw.logo,
    trailers: resolveTrailers(raw, locale),
    mechanics: resolveMechanics(raw, locale),
    highlights: resolveHighlights(raw, locale),
    officialUrl: raw.officialUrl,
    patchNotesUrl: raw.patchNotesUrl,
    faq: resolveFaq(raw, locale),
    seoTitle: resolveLocale(raw.seoTitle, locale),
    seoDescription: resolveLocale(raw.seoDescription, locale),
    ogImage: raw.ogImage,
    status: getLeagueStatus(raw.startsAt),
  };
}

/**
 * Cards for /leagues, ordered the way a visitor actually cares about them:
 * what has not started yet (soonest first), then what is already running
 * (most recent first). A plain date sort would bury next week's league under
 * every past one, or vice-versa, depending on direction.
 */
export async function getLeagueLandingIndex(
  locale: string,
): Promise<LeagueLandingSummary[]> {
  let rows: RawLeagueLandingSummary[] = [];
  try {
    rows =
      (await sanityFetch<RawLeagueLandingSummary[]>({
        query: leagueLandingIndexQuery,
        qParams: {},
        tags: ["leagueLanding"],
      })) ?? [];
  } catch {
    return [];
  }

  const now = Date.now();
  const summaries: LeagueLandingSummary[] = rows
    .filter((r) => r?.name && r?.slug)
    .map((r) => ({
      id: r._id,
      name: r.name,
      slug: r.slug,
      gameVersion: r.gameVersion,
      version: r.version,
      tagline: resolveLocale(r.tagline, locale),
      startsAt: r.startsAt,
      accentColor: r.accentColor || DEFAULT_ACCENT,
      keyArt: r.keyArt,
      status: getLeagueStatus(r.startsAt, now),
    }));

  const rank = (s: LeagueLandingSummary) =>
    s.status === "tba" ? 0 : s.status === "upcoming" ? 1 : 2;

  return summaries.sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    const at = a.startsAt ? new Date(a.startsAt).getTime() : 0;
    const bt = b.startsAt ? new Date(b.startsAt).getTime() : 0;
    // Upcoming: soonest first. Already live: most recent first.
    return a.status === "upcoming" ? at - bt : bt - at;
  });
}

/** Published slugs, for generateStaticParams and the sitemap. */
export async function getLeagueLandingSlugs(): Promise<LeagueLandingSlug[]> {
  try {
    const rows = await sanityFetch<LeagueLandingSlug[]>({
      query: leagueLandingSlugsQuery,
      qParams: {},
      tags: ["leagueLanding"],
    });
    return rows ?? [];
  } catch {
    // A Sanity hiccup at build time should not fail the whole build — the page
    // is dynamic anyway, so an empty list just means nothing is prerendered.
    return [];
  }
}
