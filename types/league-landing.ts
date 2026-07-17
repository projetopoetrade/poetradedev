// Types for the `leagueLanding` Sanity document.
//
// Two layers on purpose:
//   Raw*      — exactly what GROQ returns, with both locales still present.
//   (resolved) — what components consume, after resolveLocale() collapses
//                localeString/localeText down to a single string.
// Components never see a LocaleString, so they can never forget the fallback.

export type GameVersion = "path-of-exile-1" | "path-of-exile-2";

export type TrailerKind = "teaser" | "trailer" | "gameplay" | "mechanic" | "vod";

/** Derived from `startsAt` alone — never stored, so it can never go stale. */
export type LeagueStatus = "tba" | "upcoming" | "live";

export interface LocaleField {
  en?: string;
  ptBr?: string;
}

export interface SanityImageRef {
  alt?: string;
  asset?: {
    _id: string;
    url: string;
    metadata?: {
      lqip?: string;
      dimensions?: { width: number; height: number };
    };
  };
}

// ─── Raw (straight from GROQ) ─────────────────────────────────────────────────

export interface RawTrailer {
  title?: LocaleField;
  youtubeId?: string;
  kind?: TrailerKind;
  thumbnail?: SanityImageRef;
}

export type MechanicCategory = "league" | "endgame" | "balance";

export interface SanityFileRef {
  asset?: {
    _id: string;
    url: string;
  };
}

export type ImagePosition = "left" | "center" | "right";

export interface RawMechanic {
  title?: LocaleField;
  summary?: LocaleField;
  category?: MechanicCategory;
  bullets?: LocaleField[];
  image?: SanityImageRef;
  video?: SanityFileRef;
  imagePosition?: ImagePosition;
}

export interface RawHighlight {
  label?: LocaleField;
  value?: LocaleField;
}

export interface RawFaqItem {
  question?: LocaleField;
  answer?: LocaleField;
}

export interface RawLeagueLanding {
  _id: string;
  _updatedAt: string;
  name: string;
  slug: string;
  gameVersion: GameVersion;
  version?: string;
  tagline?: LocaleField;
  intro?: LocaleField;
  supabaseLeagueName?: string;
  startsAt?: string;
  revealAt?: string;
  patchNotesAt?: string;
  accentColor?: string;
  keyArt?: SanityImageRef;
  logo?: SanityImageRef;
  trailers?: RawTrailer[];
  mechanics?: RawMechanic[];
  highlights?: RawHighlight[];
  officialUrl?: string;
  patchNotesUrl?: string;
  faq?: RawFaqItem[];
  seoTitle?: LocaleField;
  seoDescription?: LocaleField;
  ogImage?: SanityImageRef;
}

// ─── Resolved (what the page and components consume) ──────────────────────────

export interface Trailer {
  title: string;
  youtubeId: string;
  kind: TrailerKind;
  thumbnailUrl?: string;
}

export interface Mechanic {
  title: string;
  summary: string;
  category: MechanicCategory;
  bullets: string[];
  image?: SanityImageRef;
  videoUrl?: string;
  imagePosition?: ImagePosition;
}

export interface Highlight {
  label: string;
  value: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface LeagueLanding {
  id: string;
  updatedAt: string;
  name: string;
  slug: string;
  gameVersion: GameVersion;
  version?: string;
  tagline?: string;
  intro?: string;
  supabaseLeagueName?: string;
  /** ISO 8601 UTC. Absent = the start instant has not been announced yet. */
  startsAt?: string;
  revealAt?: string;
  patchNotesAt?: string;
  accentColor?: string;
  keyArt?: SanityImageRef;
  logo?: SanityImageRef;
  trailers: Trailer[];
  mechanics: Mechanic[];
  highlights: Highlight[];
  officialUrl?: string;
  patchNotesUrl?: string;
  faq: FaqItem[];
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: SanityImageRef;
  status: LeagueStatus;
}

export interface LeagueLandingSlug {
  slug: string;
  gameVersion: GameVersion;
  startsAt?: string;
  _updatedAt: string;
}

/** Raw index row, both locales still inline. */
export interface RawLeagueLandingSummary {
  _id: string;
  name: string;
  slug: string;
  gameVersion: GameVersion;
  version?: string;
  tagline?: LocaleField;
  startsAt?: string;
  accentColor?: string;
  keyArt?: SanityImageRef;
}

/** One card on /leagues. */
export interface LeagueLandingSummary {
  id: string;
  name: string;
  slug: string;
  gameVersion: GameVersion;
  version?: string;
  tagline?: string;
  startsAt?: string;
  accentColor: string;
  keyArt?: SanityImageRef;
  status: LeagueStatus;
}
