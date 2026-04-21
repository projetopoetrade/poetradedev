import 'server-only';
import type { PortableTextBlock } from 'sanity';
import { parsePlaceholders, slugify, type Placeholder } from './parse';
import { fetchPrices, type PriceEntry } from './fetch-prices';
import { fetchItemRawMany, type ItemRawData } from './fetch-items';

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
}

interface ResolveState {
  ctx: ResolveContext;
  prices: Record<string, PriceEntry>;
  items: Record<string, ItemRawData>;
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

  // 0.5. Inline currency / scarab / gem mention enrichment: rewrite spans so
  //      "Divine Orb" → "{{item:Divine Orb}}" before placeholder collection.
  //      The downstream item-card flow then renders the same hover tooltip
  //      + icon used by hand-authored {{item:…}} placeholders. Skips matches
  //      that are already inside a `{{...}}` (negative lookbehind in the
  //      regex) so author-curated tokens stay untouched.
  const expandedBlocks = splitBlocks.map((b) => promoteInlineMentions(b));

  // 1. Collect every placeholder that needs a data fetch
  const priceNames = new Set<string>();
  const itemNames = new Set<string>();
  for (const block of expandedBlocks) {
    for (const ph of collectFromBlock(block)) {
      if (ph.kind === 'price') priceNames.add(ph.value);
      if (ph.kind === 'item') {
        itemNames.add(ph.value);
        // Item cards also want the inline price sub-line
        priceNames.add(ph.value);
      }
    }
  }

  // 2. Batch-fetch in parallel
  const [prices, items] = await Promise.all([
    priceNames.size
      ? fetchPrices(Array.from(priceNames), ctx.league || 'Mirage')
      : Promise.resolve({} as Record<string, PriceEntry>),
    itemNames.size
      ? fetchItemRawMany(Array.from(itemNames))
      : Promise.resolve({} as Record<string, ItemRawData>),
  ]);

  // 3. Walk the tree, transforming spans
  const state: ResolveState = { ctx, prices, items };
  return expandedBlocks.map((b) => transformBlock(promoteMarkdownHeading(b), state));
}

// ---------------------------------------------------------------------------
// Inline mention promotion — turns bare "Divine Orb" mentions into
// `{{item:Divine Orb}}` so the downstream resolver picks them up and
// produces the same icon + hover tooltip as hand-authored placeholders.
//
// Coverage is intentionally a curated whitelist instead of "any title-case
// phrase" — we want zero false positives in prose. Names match
// case-insensitively; the resolver looks them up in the engine, which
// itself is case-insensitive.
// ---------------------------------------------------------------------------

const INLINE_ITEM_MENTIONS: string[] = [
  // Currencies — most-mentioned first
  'Mirror of Kalandra',
  'Divine Orb',
  'Exalted Orb',
  'Chaos Orb',
  'Awakened Sextant',
  'Orb of Annulment',
  'Orb of Alchemy',
  'Orb of Fusing',
  'Orb of Scouring',
  'Orb of Regret',
  'Orb of Chance',
  'Vaal Orb',
  'Regal Orb',
  'Blessed Orb',
  "Cartographer's Chisel",
  "Gemcutter's Prism",
  'Eternal Orb',
  "Jeweller's Orb",
  'Orb of Transmutation',
  'Orb of Augmentation',
  'Chromatic Orb',
  'Hinekora\u2019s Lock',
  "Hinekora's Lock",
  'Mirror Shard',
  'Exalted Shard',
  'Ancient Orb',
  'Harbinger\u2019s Orb',
  'Veiled Chaos Orb',
  // Fragments
  'Sacrifice at Dawn',
  'Sacrifice at Dusk',
  'Sacrifice at Midnight',
  'Sacrifice at Noon',
  'Mortal Grief',
  'Mortal Hope',
  'Mortal Rage',
  'Mortal Ignorance',
];

const INLINE_MENTION_REGEX = (() => {
  // Sort longest-first so "Mirror of Kalandra" wins over partial overlaps.
  const sorted = Array.from(new Set(INLINE_ITEM_MENTIONS)).sort((a, b) => b.length - a.length);
  const escaped = sorted.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  // Negative lookbehind blocks matches that already sit inside `{{kind:`
  // (so `{{item:Divine Orb}}` and `{{price:Divine Orb}}` are left alone).
  return new RegExp(`(?<!\\{\\{[a-z]+:)\\b(?:${escaped.join('|')})\\b(?![|}])`, 'gi');
})();

function promoteInlineMentions(block: any): any {
  if (!block || typeof block !== 'object' || block._type !== 'block') return block;
  if (!Array.isArray(block.children)) return block;
  const newChildren = block.children.map((c: any) => {
    if (!c || typeof c !== 'object' || c._type !== 'span') return c;
    if (typeof c.text !== 'string' || !c.text) return c;
    // Skip spans that already carry marks — they came from Sanity with intent
    // (link, strong, etc.) and we shouldn't rewrite their text.
    if (Array.isArray(c.marks) && c.marks.length > 0) return c;
    if (!INLINE_MENTION_REGEX.test(c.text)) {
      INLINE_MENTION_REGEX.lastIndex = 0;
      return c;
    }
    INLINE_MENTION_REGEX.lastIndex = 0;
    const rewritten = c.text.replace(INLINE_MENTION_REGEX, (m: string) => `{{item:${m}}}`);
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
    } else if (resolved.type === 'iconLink') {
      // Currency-style chip — icon inline + linked name, no hover tooltip.
      const chipKey = `phchip-${span._key ?? 'auto'}-${keyCounter++}`;
      markDefs.push({
        _key: chipKey,
        _type: 'iconLink',
        href: resolved.href,
        iconUrl: resolved.iconUrl,
        name: resolved.text,
      });
      out.push(
        makeSpan(
          resolved.text,
          [...originalMarks.filter((m) => m !== 'link'), chipKey],
          nextKey(),
        ),
      );
    } else {
      // Inline item reference — renders via the `poeItem` mark handler,
      // which mounts the PoeItemBlogCard tooltip.
      const itemKey = `phitem-${span._key ?? 'auto'}-${keyCounter++}`;
      markDefs.push({
        _key: itemKey,
        _type: 'poeItem',
        rawText: resolved.rawText,
        iconUrl: resolved.iconUrl,
        itemName: resolved.text,
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
  | { type: 'iconLink'; text: string; href: string; iconUrl: string | null }
  | { type: 'item'; text: string; rawText: string; iconUrl: string | null };

function resolvePlaceholder(ph: Placeholder, state: ResolveState): ResolvedFragment {
  switch (ph.kind) {
    case 'price':
      return resolvePrice(ph, state);
    case 'link':
      return resolveLink(ph, state);
    case 'item':
      return resolveItem(ph, state);
    case 'patch': {
      // Single-value placeholder e.g. {{patch:3.28}} — emit the value literally
      return { type: 'text', text: ph.value };
    }
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

function resolveItem(ph: Placeholder, state: ResolveState): ResolvedFragment {
  const data = state.items[ph.value.toLowerCase()];
  if (!data || !data.rawText) {
    // Engine knows nothing — try a linked chip so the reader still lands on
    // the product page (no stat block, but still enriched).
    return resolveLink({ ...ph, modifier: ph.modifier ?? 'product' }, state);
  }

  const text = data.name || ph.value;
  // Currencies don't carry useful tooltip content (just generic descriptions
  // like "Right click to use"). Render them as an icon + clickable name
  // instead of a hover tooltip — that's what readers actually want when a
  // post mentions Divine Orb in passing.
  if (isCurrencyClass(data.classId, data.rarity)) {
    const locale = state.ctx.locale || 'en';
    const localePrefix = locale && locale !== 'en' ? `/${locale}` : '';
    return {
      type: 'iconLink',
      text,
      href: `${localePrefix}/products/${slugify(text)}`,
      iconUrl: data.iconUrl ?? null,
    };
  }

  return {
    type: 'item',
    text,
    rawText: data.rawText,
    iconUrl: data.iconUrl ?? null,
  };
}

function isCurrencyClass(classId: string | null, rarity: string | null): boolean {
  const c = (classId ?? '').toLowerCase();
  if (c.includes('currency')) return true;
  // Engine returns rarity="Currency" too — extra safety.
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
