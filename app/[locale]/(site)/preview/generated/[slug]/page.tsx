import Link from "next/link";
import type { PortableTextBlock } from "sanity";
import { BlockContentRenderer } from "@/components/portable-text/blockContentComponents";
import { getEngineApiBase } from "@/lib/placeholders/engine";
import { resolveBlocks } from "@/lib/placeholders/resolve-blocks";

/**
 * `/preview/generated/[slug]` — renders a just-generated post from the engine
 * using the SAME Portable Text pipeline real blog posts go through:
 *
 *   engine `/content/posts/:slug` → wrap-in-block → `resolveBlocks` (reads
 *   engine items/passives/prices/pob-snapshots) → `BlockContentRenderer`
 *
 * The goal is to let authors + the E2E script validate generated content
 * without publishing it to Sanity first. The `{{item:…}}` / `{{passive:…}}`
 * / `{{pobitem:…}}` / `{{price:…}}` placeholders resolve with live tooltips
 * and icons, identical to what a reader sees on `/blog/<slug>` after the
 * post is imported.
 *
 * Not indexed; `dynamic: force-dynamic` so each reload re-resolves
 * placeholders (fresh prices, fresh ninja snapshots). Dropdown switches
 * between EN and PT-BR so reviewers can eyeball both variants.
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}

interface EngineSection {
  sectionId: string;
  title?: string | { "pt-br"?: string; en?: string };
  contentEn?: string;
  contentPt?: string;
}

interface EnginePost {
  slug: string;
  title?: { "pt-br"?: string; en?: string };
  sections?: EngineSection[];
  content?: { "pt-br"?: string; en?: string };
  meta?: {
    description?: { "pt-br"?: string; en?: string };
    primaryKeyword?: string;
  };
  template?: string;
  briefing?: { league?: string; pobUrl?: string };
  generatedAt?: string;
  error?: string;
}

export default async function GeneratedPostPreviewPage({
  params,
  searchParams,
}: PageProps) {
  const { locale, slug } = await params;
  const { lang: qsLang } = await searchParams;
  const lang: "en" | "pt-br" =
    qsLang === "pt-br" || locale === "pt-br" ? "pt-br" : "en";

  const engineBase = getEngineApiBase();
  if (!engineBase) return <EngineMissing />;

  // Cache-bust — the whole point of this preview is to see the latest
  // generation output; caching would just hide pipeline changes.
  const res = await fetch(`${engineBase}/content/posts/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (!res.ok) return <PostNotFound slug={slug} status={res.status} />;
  const post = (await res.json()) as EnginePost;
  if (post.error) return <PostNotFound slug={slug} message={post.error} />;

  const title = lang === "pt-br" ? post.title?.["pt-br"] : post.title?.en;
  const metaDescription =
    lang === "pt-br"
      ? post.meta?.description?.["pt-br"]
      : post.meta?.description?.en;

  // The engine either emits a concatenated markdown string in
  // `post.content[lang]` OR per-section bodies in `post.sections[].contentEn/contentPt`.
  // Join the sections when the top-level `content` field is missing so old
  // post snapshots still render cleanly.
  const rawMarkdown = buildMarkdown(post, lang);

  // Wrap the full markdown body in a single Portable Text block. The
  // resolver's `splitMarkdownBlock` step splits on blank lines + promotes
  // `## ` headings — so we get proper h2/h3/p structure for free without a
  // client-side markdown parser.
  const body: PortableTextBlock[] = [
    {
      _type: "block",
      _key: "generated-body",
      style: "normal",
      markDefs: [],
      children: [
        { _type: "span", _key: "generated-body-s", text: rawMarkdown, marks: [] },
      ],
    } as PortableTextBlock,
  ];

  const resolved = await resolveBlocks(body, {
    locale: lang === "pt-br" ? "pt-br" : "en",
    league: "Mirage",
  });

  const otherLang = lang === "pt-br" ? "en" : "pt-br";
  const otherLangLabel = otherLang === "pt-br" ? "Ver em PT-BR" : "View in English";

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <article className="mx-auto max-w-3xl px-6 py-16 space-y-10">
        {/* Preview banner — reinforce this is a draft so nobody thinks it's
            a published post on pathoftrade.net/blog/<slug>. */}
        <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-xs text-amber-200 space-y-1">
          <div className="font-semibold tracking-wide uppercase">
            Generated Post Preview · Draft
          </div>
          <div className="text-amber-300/80">
            Engine output for <code className="font-mono">{slug}</code>. Not
            indexed. Placeholders resolved live against the engine (items,
            passives, prices, PoB snapshots) using the same pipeline a
            published post runs through.
          </div>
          <div className="flex gap-4 pt-1 text-[11px]">
            {post.briefing?.league && (
              <span>
                League: <code className="text-amber-100">{post.briefing.league}</code>
              </span>
            )}
            {post.template && (
              <span>
                Template: <code className="text-amber-100">{post.template}</code>
              </span>
            )}
            {post.generatedAt && (
              <span>
                Generated: <code className="text-amber-100">{new Date(post.generatedAt).toLocaleString()}</code>
              </span>
            )}
            <Link
              href={`?lang=${otherLang}`}
              className="ml-auto underline underline-offset-2 hover:text-amber-100"
            >
              {otherLangLabel}
            </Link>
          </div>
        </div>

        {/* Header — matches the blog post layout tone */}
        <header className="space-y-3 border-b border-neutral-800 pb-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            {title || slug}
          </h1>
          {metaDescription && (
            <p className="text-base text-neutral-400">{metaDescription}</p>
          )}
        </header>

        {/* Body — resolved placeholders, identical to production blog */}
        <div className="prose prose-invert prose-lg max-w-none">
          <BlockContentRenderer value={resolved} />
        </div>

        {/* Footer — generation log + return links */}
        <footer className="space-y-2 border-t border-neutral-800 pt-6 text-xs text-neutral-500">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              href={`/api/tools/pob-viewer`}
              className="text-neutral-400 hover:text-neutral-200 underline underline-offset-2"
            >
              Back to tools
            </Link>
            {post.briefing?.pobUrl && (
              <>
                <span>·</span>
                <Link
                  href={`/${locale}/tools/pob-viewer?pob=${encodeURIComponent(post.briefing.pobUrl)}`}
                  className="text-neutral-400 hover:text-neutral-200 underline underline-offset-2"
                >
                  View build in PoB Viewer
                </Link>
              </>
            )}
            <span>·</span>
            <a
              href={`${engineBase}/content/posts/${encodeURIComponent(slug)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-200 underline underline-offset-2"
            >
              Raw JSON
            </a>
            <a
              href={`${engineBase}/content/posts/${encodeURIComponent(slug)}/log`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-200 underline underline-offset-2"
            >
              Generation log
            </a>
          </div>
        </footer>
      </article>
    </main>
  );
}

/**
 * Picks the best markdown body for a language: top-level `content[lang]`
 * wins when populated (the generation pipeline emits this as the
 * "canonical" body), otherwise falls back to joining section bodies
 * with blank-line breaks so the resolver's block-splitter still works.
 */
function buildMarkdown(post: EnginePost, lang: "en" | "pt-br"): string {
  const direct = post.content?.[lang];
  if (direct && direct.trim().length > 0) return direct;

  const sections = Array.isArray(post.sections) ? post.sections : [];
  if (sections.length === 0) return "_No content generated yet._";

  const parts: string[] = [];
  for (const s of sections) {
    const title =
      typeof s.title === "string"
        ? s.title
        : (lang === "pt-br" ? s.title?.["pt-br"] : s.title?.en) ?? null;
    if (title) parts.push(`## ${title}`);
    const body = lang === "pt-br" ? s.contentPt : s.contentEn;
    if (body) parts.push(body);
  }
  return parts.join("\n\n").trim();
}

function EngineMissing() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-4">
        <h1 className="text-2xl font-semibold">Generated post preview</h1>
        <div className="rounded-lg border border-amber-900 bg-amber-950/30 p-4 text-sm text-amber-200">
          Engine not configured. Set <code>ENGINE_API_URL</code> to a running
          content engine.
        </div>
      </div>
    </main>
  );
}

function PostNotFound({
  slug,
  status,
  message,
}: {
  slug: string;
  status?: number;
  message?: string;
}) {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-4">
        <h1 className="text-2xl font-semibold">Post not found</h1>
        <div className="rounded-lg border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
          Engine doesn&apos;t have a generated post with slug{" "}
          <code className="font-mono">{slug}</code>
          {status ? ` (HTTP ${status})` : ""}
          {message ? `: ${message}` : "."}
        </div>
        <p className="text-sm text-neutral-400">
          Run <code>python scripts/e2e_pipeline_test.py</code> or generate via
          the dashboard, then come back to this URL.
        </p>
      </div>
    </main>
  );
}
