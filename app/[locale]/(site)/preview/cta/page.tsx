import type { PortableTextBlock } from "sanity";
import { BlockContentRenderer } from "@/components/portable-text/blockContentComponents";
import { resolveBlocks } from "@/lib/placeholders/resolve-blocks";

/**
 * `/preview/cta` — sandbox for the `{{cta:currency}}` placeholder.
 *
 * Demonstrates the full pipeline (resolveBlocks → BlockContentRenderer)
 * against a fixed mock post that exercises:
 *   1. `{{cta:currency}}` standalone in its own paragraph → renders the
 *      block-level banner.
 *   2. `{{cta:currency}}` embedded inside prose → silently dropped so the
 *      sentence reads cleanly.
 *   3. `{{cta:product|divine-orb}}` → MVP renders as the currency banner;
 *      single-product layout is a TODO.
 *
 * Not indexed; force-dynamic so each reload reflects current league data.
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SAMPLE_MARKDOWN = `# Sample build guide

This is a draft post showing how the cta placeholder behaves in a
real prose context. Below the next paragraph the standalone CTA should
expand into a banner.

## Cost & League Pacing (PoE 1 — context default)

The full Mageblood version sits north of 600 divines. Budget tier runs
around 30 divines using a tactical Stygian + capped resists.

{{cta:currency}}

## Endgame Notes

You will hit a wall around T16 boss content without juice. Switch to
juice farming or settle for T15 mapping for now.

This sentence has {{cta:currency}} embedded inline — it should be
silently dropped, leaving clean prose.

## Single-product variant (PoE 1)

{{cta:product|divine-orb}}

The product variant focuses on a single CTA + a sub-link to the full
catalog.

## Override to PoE 2

The same post can mix games via the \`|poe2\` modifier. Below should
render the PoE 2 lineup (Divine / Exalted / Mirror) regardless of the
context default:

{{cta:currency|poe2}}

And a single-product PoE 2 CTA:

{{cta:product|exalted-orb|poe2}}
`;

export default async function CtaPreviewPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const lang = locale === "pt-br" ? "pt-br" : "en";

  const body: PortableTextBlock[] = [
    {
      _type: "block",
      _key: "cta-preview-body",
      style: "normal",
      markDefs: [],
      children: [
        {
          _type: "span",
          _key: "cta-preview-s",
          text: SAMPLE_MARKDOWN,
          marks: [],
        },
      ],
    } as PortableTextBlock,
  ];
  const resolved = await resolveBlocks(body, { locale: lang });

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <article className="mx-auto max-w-3xl px-6 py-16 space-y-10">
        <header className="space-y-2 border-b border-neutral-800 pb-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400/80">
            cta placeholder · preview · draft
          </p>
          <h1 className="text-3xl font-bold leading-tight">
            Sample build guide
          </h1>
          <p className="text-sm text-neutral-400">
            Demonstrates the{" "}
            <code className="font-mono bg-neutral-900 px-1.5 py-0.5 rounded text-amber-300">
              {"{{cta:currency}}"}
            </code>{" "}
            placeholder. Standalone usage renders the block-level banner;
            embedded-in-prose usage is silently dropped.
          </p>
        </header>

        <div className="prose prose-invert prose-lg max-w-none">
          <BlockContentRenderer value={resolved} />
        </div>
      </article>
    </main>
  );
}
