import 'server-only';
import type { PortableTextBlock } from 'sanity';
import { parsePlaceholders, slugify, type Placeholder } from './parse';
import { fetchPrices, type PriceEntry } from './fetch-prices';
import { fetchItemRawMany, type ItemRawData } from './fetch-items';
import { fetchPobItemRawMany, type PobItemRawData } from './fetch-pob-items';
import { fetchPassiveRawMany, type PassiveRawData } from './fetch-passive';
import { fetchCurrencyNames } from './fetch-currency-names';
import { getCurrentTempLeague } from '@/app/actions';
import type { CtaGameVersion } from '@/components/currency-cta';

/**
 * Pre-resolve placeholders in a Portable Text tree.
 *
 * Server-only. The blog page runs this once per render (cached by Next.js ISR
 * + fetch revalidation) so live prices flow into the rendered HTML without
 * needing client-side JS. Placeholders the resolver doesn't understand (or
 * can't resolve) are stripped to their human-readable value so the reader
 * never sees `{{...}}` literals.
 */

interface ResolveContext {
  locale: string;
  league?: string;
  /**
   * Default game version for `{{cta:...}}` placeholders that don't carry an
   * explicit poe1/poe2 modifier. Falls back to "path-of-exile-1" when the
   * caller doesn't pass it (most preview pages); blog/[slug] should pass
   * the post's `gameVersion` so the CTA naturally aligns with the post.
   */
  gameVersion?: CtaGameVersion;
}

interface ResolveState {
  ctx: ResolveContext;
  prices: Record<string, PriceEntry>;
  items: Record<string, ItemRawData>;
  pobItems: Record<string, PobItemRawData>;
  passives: Map<string, PassiveRawData>;
}

// ---------------------------------------------------------------------------
// Public entry
// ---------------------------------------------------------------------------

export async function resolveBlocks(
  blocks: PortableTextBlock[] | null | undefined,
  ctx: ResolveContext,
): Promise<PortableTextBlock[]> {
  if (!blocks?.length) return blocks ?? [];

  // 0. Posts imported from the LLM pipeline sometimes land in Sanity as a
  //    SINGLE block containing the entire article with `\n\n` between
  //    paragraphs and `## ` markdown markers embedded. Split those into one
  //    Portable Text block per paragraph so the rest of this pipeline (and
  //    the site's `blockContentComponents`) can treat each paragraph
  //    independently — headings, prose, lists.
  const splitBlocks: any[] = [];
  for (const b of blocks) {
    for (const split of splitMarkdownBlock(b)) splitBlocks.push(split);
  }

  // 0.5. Inline currency / scarab / fragment mention enrichment: rewrite spans
  //      so "Divine Orb" → "{{item:Divine Orb}}" before placeholder
  //      collection. The downstream item-card flow then renders the same
  //      hover tooltip + icon used by hand-authored {{item:…}} placeholders.
  //      The name list comes from the engine (every StackableCurrency +
  //      MapFragment valid in temp league), falling back to a compiled-in
  //      ~30-name list if the engine is unreachable.
  const currencyNames = await fetchCurrencyNames();
  const inlineRegex = buildInlineMentionRegex(currencyNames);
  const expandedBlocks = splitBlocks.map((b) =>
    promoteInlineMentions(b, inlineRegex),
  );

  // 1. Collect every placeholder that needs a data fetch
  const priceNames = new Set<string>();
  const itemNames = new Set<string>();
  const pobItemIds = new Set<string>();
  const passiveNames = new Set<string>();
  for (const block of expandedBlocks) {
    for (const ph of collectFromBlock(block)) {
      if (ph.kind === 'price') priceNames.add(ph.value);
      if (ph.kind === 'item') {
        itemNames.add(ph.value);
        // Item cards also want the inline price sub-line
        priceNames.add(ph.value);
      }
      if (ph.kind === 'pobitem') pobItemIds.add(ph.value);
      if (ph.kind === 'passive') passiveNames.add(ph.value);
    }
  }

  // 2. Batch-fetch in parallel
  const [prices, items, pobItems, passives] = await Promise.all([
    priceNames.size
      ? fetchPrices(Array.from(priceNames), ctx.league || 'Mirage')
      : Promise.resolve({} as Record<string, PriceEntry>),
    itemNames.size
      ? fetchItemRawMany(Array.from(itemNames))
      : Promise.resolve({} as Record<string, ItemRawData>),
    pobItemIds.size
      ? fetchPobItemRawMany(Array.from(pobItemIds))
      : Promise.resolve({} as Record<string, PobItemRawData>),
    passiveNames.size
      ? fetchPassiveRawMany(Array.from(passiveNames))
      : Promise.resolve(new Map<string, PassiveRawData>()),
  ]);

  // 2.5. Block-level CTA promotion. The {{cta:...}} placeholder doesn't fit
  //      the inline-span model — it renders a full-width banner — so we
  //      convert any block whose ENTIRE trimmed text is a single cta
  //      placeholder into a custom `_type: 'poeCta'` block. The renderer
  //      registers a handler for that block type. Mixed prose containing a
  //      cta is left alone (the placeholder will fall through to the text
  //      fallback in resolvePlaceholder, which drops it silently).
  const ctaBlocksByIdx = new Map<number, Placeholder>();
  expandedBlocks.forEach((b, i) => {
    const ph = extractCtaPlaceholder(b);
    if (ph) ctaBlocksByIdx.set(i, ph);
  });
  const ctxGameVersion: CtaGameVersion = ctx.gameVersion ?? 'path-of-exile-1';
  const leagueByGameVersion = new Map<CtaGameVersion, string | null>();
  if (ctaBlocksByIdx.size > 0) {
    // Walk the CTAs and figure out which gameVersions actually appear so
    // we only fetch the leagues we need. Most posts use one; mixed posts
    // (rare but possible — a comparison piece) trigger both.
    const gvs = new Set<CtaGameVersion>();
    ctaBlocksByIdx.forEach((ph) => {
      gvs.add(parseCtaModifier(ph.modifier, ctxGameVersion).gameVersion);
    });
    const leagues = await Promise.all(
      Array.from(gvs).map(
        async (gv) => [gv, await getCurrentTempLeague(gv)] as const,
      ),
    );
    for (const [gv, name] of leagues) leagueByGameVersion.set(gv, name);
  }
  const ctaResolved = expandedBlocks.map((b, i) => {
    const ph = ctaBlocksByIdx.get(i);
    return ph ? makeCtaBlock(ph, leagueByGameVersion, ctxGameVersion) : b;
  });

  // 3. Walk the tree, transforming spans (CTA blocks pass through unchanged
  //    because transformBlock only touches `_type: 'block'`).
  const state: ResolveState = { ctx, prices, items, pobItems, passives };
  return ctaResolved.map((b) => transformBlock(promoteMarkdownHeading(b), state));
}

// ---------------------------------------------------------------------------
// CTA block promotion — converts a paragraph whose only content is a
// {{cta:variant|modifier?}} placeholder into a custom block the renderer
// picks up. Inline cta placeholders (mixed with prose) are left alone and
// fall through to the text fallback path.
// ---------------------------------------------------------------------------

function extractCtaPlaceholder(block: any): Placeholder | null {
  if (!block || typeof block !== 'object' || block._type !== 'block') return null;
  if (!Array.isArray(block.children)) return null;
  const fullText = block.children
    .filter((c: any) => c && typeof c === 'object' && typeof c.text === 'string')
    .map((c: any) => c.text)
    .join('')
    .trim();
  if (!fullText) return null;
  const placeholders = parsePlaceholders(fullText);
  if (placeholders.length !== 1) return null;
  const ph = placeholders[0];
  if (ph.kind !== 'cta') return null;
  if (ph.raw.trim() !== fullText) return null;
  return ph;
}

/**
 * Modifier tokens that select a specific game version. Accepted in any
 * position of a pipe-separated modifier list (e.g. `divine-orb|poe2` or
 * `poe2|divine-orb`) so the LLM doesn't have to remember an order.
 */
const POE1_TOKENS = new Set(['poe1', 'poe-1', 'path-of-exile-1']);
const POE2_TOKENS = new Set(['poe2', 'poe-2', 'path-of-exile-2']);

/**
 * Parses a CTA placeholder modifier into `{ slug?, gameVersion }`.
 * Modifier supports up to two pipe-separated tokens: a game-version alias
 * (poe1/poe2 + variants) and a product slug. Unknown tokens are taken as
 * the slug. When no game-version token is present, `defaultGameVersion`
 * (from ResolveContext) wins.
 *
 * Examples (with defaultGameVersion = 'path-of-exile-1'):
 *   undefined            → { gameVersion: 'path-of-exile-1' }
 *   "poe2"               → { gameVersion: 'path-of-exile-2' }
 *   "divine-orb"         → { slug: 'divine-orb', gameVersion: 'path-of-exile-1' }
 *   "divine-orb|poe2"    → { slug: 'divine-orb', gameVersion: 'path-of-exile-2' }
 *   "poe2|divine-orb"    → { slug: 'divine-orb', gameVersion: 'path-of-exile-2' }
 */
function parseCtaModifier(
  modifier: string | undefined,
  defaultGameVersion: CtaGameVersion,
): { slug?: string; gameVersion: CtaGameVersion } {
  if (!modifier) return { gameVersion: defaultGameVersion };
  const parts = modifier
    .split('|')
    .map((p) => p.trim())
    .filter(Boolean);
  let slug: string | undefined;
  let gameVersion = defaultGameVersion;
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (POE2_TOKENS.has(lower)) gameVersion = 'path-of-exile-2';
    else if (POE1_TOKENS.has(lower)) gameVersion = 'path-of-exile-1';
    else if (slug === undefined) slug = lower;
  }
  return { slug, gameVersion };
}

function makeCtaBlock(
  ph: Placeholder,
  leagueByGameVersion: Map<CtaGameVersion, string | null>,
  defaultGameVersion: CtaGameVersion,
): any {
  const variant = ph.value.toLowerCase();
  const { slug, gameVersion } = parseCtaModifier(ph.modifier, defaultGameVersion);
  const leagueName = leagueByGameVersion.get(gameVersion) ?? null;
  const key = `cta-${Math.random().toString(36).slice(2, 8)}`;
  if (variant === 'product') {
    return {
      _type: 'poeCta',
      _key: key,
      variant: 'product',
      slug: slug ?? 'divine-orb',
      gameVersion,
      leagueName,
    };
  }
  return {
    _type: 'poeCta',
    _key: key,
    variant: 'currency',
    gameVersion,
    leagueName,
  };
}

// ---------------------------------------------------------------------------
// Inline mention promotion — turns bare "Divine Orb" mentions into
// `{{item:Divine Orb}}` so the downstream resolver picks them up and
// produces the same icon + hover tooltip as hand-authored placeholders.
//
// The name list is loaded dynamically from the engine
// (`/api/items/currencies`) so it stays in sync with the Postgres catalog —
// every Currency, scarab, and fragment valid in the active temp league
// promotes automatically. Names match case-insensitively; the resolver
// looks them up in the engine, which itself is case-insensitive.
// ---------------------------------------------------------------------------

/**
 * Builds the rewrite regex from the currency-name list. Called once per
 * `resolveBlocks` invocation so the list can be hot-swapped when the
 * engine ingests new currencies. Sorted longest-first so multi-word names
 * win over partial overlaps (e.g. "Mirror of Kalandra" before "Mirror
 * Shard").
 *
 * Negative lookbehind blocks matches that already sit inside `{{kind:`
 * (so `{{item:Divine Orb}}` and `{{price:Divine Orb}}` are left alone),
 * and the trailing negative lookahead prevents partial matches inside
 * existing placeholder modifiers.
 */
function buildInlineMentionRegex(names: readonly string[]): RegExp | null {
  if (!names.length) return null;
  const sorted = Array.from(new Set(names)).sort((a, b) => b.length - a.length);
  const escaped = sorted.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(
    `(?<!\\{\\{[a-z]+:)\\b(?:${escaped.join('|')})\\b(?![|}])`,
    'gi',
  );
}

function promoteInlineMentions(block: any, regex: RegExp | null): any {
  if (!regex) return block;
  if (!block || typeof block !== 'object' || block._type !== 'block') return block;
  if (!Array.isArray(block.children)) return block;
  const newChildren = block.children.map((c: any) => {
    if (!c || typeof c !== 'object' || c._type !== 'span') return c;
    if (typeof c.text !== 'string' || !c.text) return c;
    // Skip spans that already carry marks — they came from Sanity with intent
    // (link, strong, etc.) and we shouldn't rewrite their text.
    if (Array.isArray(c.marks) && c.marks.length > 0) return c;
    if (!regex.test(c.text)) {
      regex.lastIndex = 0;
      return c;
    }
    regex.lastIndex = 0;
    const rewritten = c.text.replace(regex, (m: string) => `{{item:${m}}}`);
    return { ...c, text: rewritten };
  });
  return { ...block, children: newChildren };
}

/**
 * Takes a Portable Text block that contains a newline-joined markdown
 * article and returns one block per paragraph. Headings (`^#{1,6}\s+`) get
 * `style: hN`, list bullets (`^[*-] ` / `^\d+\. `) get `style: normal` but
 * preserve the leading marker so the existing list fallback in
 * `blockContentComponents.renderInlineMarkdown` can still style them. All
 * other paragraphs remain `style: normal`. Blocks that don't have a single
 * text-carrying child or have no newlines are returned unchanged.
 */
function splitMarkdownBlock(block: any): any[] {
  if (!block || typeof block !== 'object' || block._type !== 'block') return [block];
  if (!Array.isArray(block.children)) return [block];
  // Only split unstyled / normal blocks — a pre-formatted `h2` / `blockquote`
  // is already structured, leave it alone.
  const styleNormalish = !block.style || block.style === 'normal' || block.style === '';
  if (!styleNormalish) return [block];

  const textChildren = block.children.filter(
    (c: any) => c && typeof c === 'object' && typeof c.text === 'string',
  );
  // If a block already has multiple children or marks we can't safely split
  // without losing the mark spans; leave such blocks alone.
  if (textChildren.length !== 1) return [block];
  const span = textChildren[0];
  if (Array.isArray(span.marks) && span.marks.length > 0) return [block];
  const text: string = span.text;
  if (!text.includes('\n')) return [block];

  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length <= 1) return [block];

  const baseKey = block._key ?? 'md';
  return paragraphs.map((para, i) => {
    const headingMatch = para.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 4);
      return {
        _type: 'block',
        _key: `${baseKey}-${i}-h`,
        style: `h${level}`,
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: `${baseKey}-${i}-hs`,
            text: headingMatch[2],
            marks: [],
          },
        ],
      };
    }
    return {
      _type: 'block',
      _key: `${baseKey}-${i}`,
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: `${baseKey}-${i}-s`,
          text: para,
          marks: [],
        },
      ],
    };
  });
}

// ---------------------------------------------------------------------------
// Markdown heading promotion
// ---------------------------------------------------------------------------

/**
 * LLM-generated / imported posts frequently land in Sanity as plain-text
 * Portable Text spans where lines still begin with `## `. The site's
 * `processNormalBlock` has a fallback regex that catches those when
 * `block.style === "normal"`, but we've seen posts where `style` is absent
 * or a custom value — in those cases the handler never fires and readers
 * see the literal `##` markers inline.
 *
 * This promotion runs at the resolver layer before placeholder expansion:
 * any `_type: "block"` whose combined span text matches `^#{1,6}\s+…` gets
 * its `style` rewritten to the matching `h1`–`h4` and the prefix stripped
 * from the first span. Downstream the blockContentComponents `block.hN`
 * handlers pick it up correctly regardless of the source `style`.
 */
function promoteMarkdownHeading(block: any): any {
  if (!block || typeof block !== 'object') return block;
  if (block._type !== 'block' || !Array.isArray(block.children)) return block;
  // Don't override an explicit heading / blockquote / quote style already set
  // by the CMS. We only touch blocks where the style is absent, empty, or the
  // default paragraph.
  const styleNormalish = !block.style || block.style === 'normal' || block.style === '';
  if (!styleNormalish) return block;

  // Find the first child that has a text property — don't require _type === 'span'
  // because some imports drop or rename the discriminator.
  const firstTextIdx = block.children.findIndex(
    (c: any) => c && typeof c === 'object' && typeof c.text === 'string',
  );
  if (firstTextIdx < 0) return block;

  const fullLeading = (block.children as any[])
    .filter((c) => c && typeof c === 'object' && typeof c.text === 'string')
    .map((c) => c.text)
    .join('');

  // Full-block heading: `## Title` is the entire text, nothing else follows.
  const m = fullLeading.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
  if (!m) return block;
  // Reject patterns where the "heading" text is actually a hashtag-like
  // sentence (e.g., "## " followed by multiple paragraphs worth of content).
  // A real heading line usually has no embedded newline.
  if (/\n/.test(fullLeading)) return block;

  const level = Math.min(m[1].length, 4);
  const stripRe = /^\s*#{1,6}\s+/;

  // Strip the `## ` prefix from the first span only — subsequent children keep
  // any marks they had (links, strong, etc.).
  const newChildren = (block.children as any[]).map((c, idx) => {
    if (idx !== firstTextIdx) return c;
    if (!c || typeof c !== 'object' || typeof c.text !== 'string') return c;
    return { ...c, text: c.text.replace(stripRe, '') };
  });

  return { ...block, style: `h${level}`, children: newChildren };
}

// ---------------------------------------------------------------------------
// Collect phase
// ---------------------------------------------------------------------------

function collectFromBlock(block: any): Placeholder[] {
  if (!block || typeof block !== 'object') return [];
  if (block._type !== 'block' || !Array.isArray(block.children)) return [];

  const out: Placeholder[] = [];
  for (const child of block.children) {
    if (child?._type === 'span' && typeof child.text === 'string') {
      out.push(...parsePlaceholders(child.text));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Transform phase
// ---------------------------------------------------------------------------

function transformBlock(block: any, state: ResolveState): any {
  if (!block || typeof block !== 'object') return block;
  if (block._type !== 'block' || !Array.isArray(block.children)) return block;

  const newChildren: any[] = [];
  const newMarkDefs: any[] = [...(block.markDefs ?? [])];

  for (const child of block.children) {
    if (child?._type === 'span' && typeof child.text === 'string') {
      const pieces = expandSpan(child, state, newMarkDefs);
      newChildren.push(...pieces);
    } else {
      newChildren.push(child);
    }
  }

  return { ...block, markDefs: newMarkDefs, children: newChildren };
}

/**
 * Takes one Portable Text span and returns an array of spans where each
 * placeholder has been replaced (either with text or with a linked span).
 * Adds link markDefs to the supplied list as needed.
 */
function expandSpan(span: any, state: ResolveState, markDefs: any[]): any[] {
  const text: string = span.text;
  const placeholders = parsePlaceholders(text);
  if (!placeholders.length) return [span];

  const originalMarks: string[] = Array.isArray(span.marks) ? span.marks : [];
  const out: any[] = [];
  let cursor = 0;
  let keyCounter = 0;
  const nextKey = () => `ph-${span._key ?? 'auto'}-${keyCounter++}`;

  for (const ph of placeholders) {
    if (ph.index > cursor) {
      out.push(makeSpan(text.slice(cursor, ph.index), originalMarks, nextKey()));
    }

    const resolved = resolvePlaceholder(ph, state);
    if (resolved.type === 'text') {
      out.push(makeSpan(resolved.text, originalMarks, nextKey()));
    } else if (resolved.type === 'link') {
      const linkKey = `phlink-${span._key ?? 'auto'}-${keyCounter++}`;
      markDefs.push({ _key: linkKey, _type: 'link', href: resolved.href });
      out.push(
        makeSpan(
          resolved.text,
          [...originalMarks.filter((m) => m !== 'link'), linkKey],
          nextKey(),
        ),
      );
    } else {
      // Inline item reference — renders via the `poeItem` mark handler,
      // which mounts the PoeItemBlogCard tooltip. Currency markers carry
      // extra metadata so the tooltip can render the centered-icon variant
      // with a price block.
      const itemKey = `phitem-${span._key ?? 'auto'}-${keyCounter++}`;
      markDefs.push({
        _key: itemKey,
        _type: 'poeItem',
        rawText: resolved.rawText,
        iconUrl: resolved.iconUrl,
        itemName: resolved.text,
        isCurrency: resolved.isCurrency ?? false,
        isGem: resolved.isGem ?? false,
        primaryAttribute: resolved.primaryAttribute ?? null,
        isAwakened: resolved.isAwakened ?? false,
        isVaal: resolved.isVaal ?? false,
      });
      out.push(makeSpan(resolved.text, [...originalMarks, itemKey], nextKey()));
    }

    cursor = ph.index + ph.length;
  }

  if (cursor < text.length) {
    out.push(makeSpan(text.slice(cursor), originalMarks, nextKey()));
  }

  return out;
}

function makeSpan(text: string, marks: string[], key: string) {
  return { _type: 'span', _key: key, text, marks };
}

// ---------------------------------------------------------------------------
// Individual resolvers
// ---------------------------------------------------------------------------

type ResolvedFragment =
  | { type: 'text'; text: string }
  | { type: 'link'; text: string; href: string }
  | {
      type: 'item';
      text: string;
      rawText: string;
      iconUrl: string | null;
      isCurrency?: boolean;
      isGem?: boolean;
      primaryAttribute?: 'Strength' | 'Dexterity' | 'Intelligence' | null;
      isAwakened?: boolean;
      isVaal?: boolean;
    };

function resolvePlaceholder(ph: Placeholder, state: ResolveState): ResolvedFragment {
  switch (ph.kind) {
    case 'price':
      return resolvePrice(ph, state);
    case 'link':
      return resolveLink(ph, state);
    case 'item':
      return resolveItem(ph, state);
    case 'pobitem':
      return resolvePobItem(ph, state);
    case 'passive':
      return resolvePassive(ph, state);
    case 'patch': {
      // Single-value placeholder e.g. {{patch:3.28}} — emit the value literally
      return { type: 'text', text: ph.value };
    }
    case 'cta':
      // Inline `{{cta:...}}` (mixed inside prose) is intentionally dropped —
      // the banner is block-level and the standalone-block pre-pass already
      // converted any solo-paragraph occurrences. Returning empty text keeps
      // the surrounding prose flowing instead of leaking the literal token.
      return { type: 'text', text: '' };
    default:
      // Unknown kind — fall back to the human-readable value
      return { type: 'text', text: ph.value };
  }
}

function resolvePrice(ph: Placeholder, state: ResolveState): ResolvedFragment {
  const entry = state.prices[ph.value.toLowerCase()];
  if (!entry) {
    // No data — render the item name so readers aren't exposed to broken tokens
    return { type: 'text', text: ph.value };
  }

  const modifier = (ph.modifier || '').toLowerCase();
  const chaos = Math.round(entry.chaos);
  const divineFloat = entry.divine;
  const divineLabel = divineFloat >= 1
    ? `${divineFloat.toFixed(divineFloat >= 10 ? 0 : 1)} div`
    : divineFloat > 0
      ? `${(1 / divineFloat).toFixed(0)}c per div`
      : '';

  switch (modifier) {
    case 'divine':
      return { type: 'text', text: divineLabel || `${chaos.toLocaleString()}c` };
    case 'chaos':
      return { type: 'text', text: `${chaos.toLocaleString()}c` };
    case 'short':
      return { type: 'text', text: divineFloat >= 1 ? divineLabel : `${chaos.toLocaleString()}c` };
    case 'usd':
      // No USD rate available yet — fall back to chaos
      return { type: 'text', text: `${chaos.toLocaleString()}c` };
    default: {
      const primary = divineFloat >= 1 ? divineLabel : `${chaos.toLocaleString()}c`;
      const secondary = divineFloat >= 1 ? ` (${chaos.toLocaleString()}c)` : '';
      return { type: 'text', text: `${primary}${secondary}` };
    }
  }
}

/**
 * Resolves `{{pobitem:<id>}}` into the same `poeItem` mark used by canonical
 * items — re-using `PoeItemBlogCard` end-to-end. The value is a PobItem id
 * (cuid), not a name, because snapshots carry exact mod rolls that the
 * Item table can't reproduce (rare rolls, corrupted implicits, enchants).
 *
 * When the engine can't find the id (TTL expired, typo, wrong env), the
 * placeholder falls back to the literal token-less text so readers never
 * see a raw `{{...}}` string.
 */
function resolvePobItem(ph: Placeholder, state: ResolveState): ResolvedFragment {
  const data = state.pobItems[ph.value];
  if (!data || !data.rawText) {
    return { type: 'text', text: data?.name ?? ph.value };
  }
  const text = data.name || ph.value;
  return {
    type: 'item',
    text,
    rawText: data.rawText,
    iconUrl: data.iconUrl ?? null,
    isCurrency: isMinimalTooltipItem(data.classId, data.rarity),
    isGem: isGemClass(data.classId),
    primaryAttribute: null,
    isAwakened: false,
    isVaal: false,
  };
}

/**
 * Resolves `{{passive:<Name>}}` into the same `poeItem` mark used by canonical
 * items. The engine's `/api/passives/:name/raw` returns a Ctrl+C-shaped block
 * (`Rarity: <kind>\n<Name>\n--------\n<stats>`) that `parseRawPoeItem` can
 * consume directly — the stats surface as implicit-blue mod lines, which is
 * the acceptable MVP look. Kind-specific header tinting (notable orange,
 * keystone gold, etc.) can come later without changing this resolver.
 *
 * On miss (unknown name, engine down) the placeholder falls back to the
 * plain passive name so readers never see a raw `{{...}}` string.
 */
function resolvePassive(ph: Placeholder, state: ResolveState): ResolvedFragment {
  const data = state.passives.get(ph.value.toLowerCase());
  if (!data || !data.rawText) {
    return { type: 'text', text: data?.name ?? ph.value };
  }
  return {
    type: 'item',
    text: data.name || ph.value,
    rawText: data.rawText,
    iconUrl: data.iconUrl ?? null,
    isCurrency: false,
    isGem: false,
    primaryAttribute: null,
    isAwakened: false,
    isVaal: false,
  };
}

function resolveItem(ph: Placeholder, state: ResolveState): ResolvedFragment {
  const data = state.items[ph.value.toLowerCase()];
  if (!data || !data.rawText) {
    // Engine knows nothing — try a linked chip so the reader still lands on
    // the product page (no stat block, but still enriched).
    return resolveLink({ ...ph, modifier: ph.modifier ?? 'product' }, state);
  }

  const text = data.name || ph.value;
  // Items whose tooltip is just a one-liner description + icon (currencies,
  // fragments, scarabs) route to the minimal CurrencyTooltip variant. Skill
  // gems get a dedicated GemTooltip with header colour by attribute. Items
  // with rich stat blocks (uniques, rares) keep the rare-item tooltip.
  return {
    type: 'item',
    text,
    rawText: data.rawText,
    iconUrl: data.iconUrl ?? null,
    isCurrency: isMinimalTooltipItem(data.classId, data.rarity),
    isGem: isGemClass(data.classId),
    primaryAttribute: data.gemInfo?.primaryAttribute ?? null,
    isAwakened: data.gemInfo?.isAwakened ?? false,
    isVaal: data.gemInfo?.isVaal ?? false,
  };
}

function isGemClass(classId: string | null): boolean {
  const c = (classId ?? '').toLowerCase();
  return c === 'active skill gem' || c === 'support skill gem';
}

/**
 * Items whose ItemTooltip would just show a header + bare requirements.
 * Currencies, scarabs, and Sacrifice/Mortal fragments all share the same
 * "right click to use" shape, so they all route to the same minimal layout.
 */
function isMinimalTooltipItem(classId: string | null, rarity: string | null): boolean {
  const c = (classId ?? '').toLowerCase();
  if (c.includes('currency')) return true;
  if (c === 'mapfragment') return true; // scarabs + Sacrifice/Mortal fragments
  return (rarity ?? '').toLowerCase() === 'currency';
}

function resolveLink(ph: Placeholder, state: ResolveState): ResolvedFragment {
  const locale = state.ctx.locale || 'en';
  const localePrefix = locale && locale !== 'en' ? `/${locale}` : '';
  // Modifier can force a target: "product", "blog", "build". Default: product.
  const target = (ph.modifier || 'product').toLowerCase();
  const slug = slugify(ph.value);
  const href = (() => {
    switch (target) {
      case 'blog':
      case 'post':
        return `${localePrefix}/blog/${slug}`;
      case 'build':
        return `${localePrefix}/builds/${slug}`;
      case 'product':
      default:
        return `${localePrefix}/products/${slug}`;
    }
  })();
  return { type: 'link', text: ph.value, href };
}
