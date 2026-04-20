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

  // 1. Collect every placeholder that needs a data fetch
  const priceNames = new Set<string>();
  const itemNames = new Set<string>();
  for (const block of blocks) {
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
  return blocks.map((b) => transformBlock(promoteMarkdownHeading(b), state));
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
  // Don't override a style that's already a heading / blockquote
  if (block.style && block.style !== 'normal' && block.style !== '') return block;

  // Concatenate leading span text so we can test "does this block START with ##"
  // without requiring all text to live in the first span.
  const firstSpanIndex = block.children.findIndex(
    (c: any) => c?._type === 'span' && typeof c.text === 'string',
  );
  if (firstSpanIndex < 0) return block;

  const fullLeading = (block.children as any[])
    .filter((c) => c?._type === 'span' && typeof c.text === 'string')
    .map((c) => c.text)
    .join('');

  const m = fullLeading.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
  if (!m) return block;

  const level = Math.min(m[1].length, 4);
  const stripRe = /^\s*#{1,6}\s+/;

  // Strip the `## ` prefix from the first span only — subsequent spans keep
  // any marks they had (links, strong, etc.).
  const newChildren = (block.children as any[]).map((c, idx) => {
    if (idx !== firstSpanIndex) return c;
    if (c?._type !== 'span' || typeof c.text !== 'string') return c;
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
  return {
    type: 'item',
    text: data.name || ph.value,
    rawText: data.rawText,
    iconUrl: data.iconUrl ?? null,
  };
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
