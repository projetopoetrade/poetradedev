"use server";

import { getEngineApiBase } from "@/lib/placeholders/engine";
import type {
  PobSummary,
  ProseResult,
  ShowcaseSection,
  SummaryActionResult,
} from "./types";

/**
 * Server actions for the `/preview/showcase` page — the demo that exercises
 * EVERY placeholder + resolver in one scrollable build guide.
 *
 * The page ships two server-side responsibilities:
 *   1. Fetch the trimmed `PobSummary` from the engine (`/api/pob/summary`).
 *   2. Generate short LLM prose paragraphs (tree / skills / gear / wrap-up).
 *      We try the engine's `/api/preview/prose` endpoint first because it
 *      caches by summary hash and reuses the engine's `LlmService` (cost
 *      logging + semaphore + retry). If that endpoint is missing (older
 *      engine deploy) or errors out, we fall through to a direct
 *      OpenRouter call with `OPENROUTER_API_KEY` and, as a last resort,
 *      a deterministic paragraph that still uses the same placeholders
 *      so the showcase always renders with tooltips — no dead air.
 *
 * Why only async functions are exported: Next.js strips non-function
 * exports from any file marked `"use server"`. Shared types therefore live
 * in `./types.ts`, imported by both this file and `page.tsx`.
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "openai/gpt-4.1-mini";
const PROSE_TIMEOUT_MS = 15_000;

const SYSTEM_PROMPT = [
  "You are writing a short section (3 to 6 sentences) of a Path of Exile build guide.",
  "Be confident, concise, technical. No headers, no lists, just flowing prose.",
  "Cite notables and keystones as {{passive:Name}}. Cite canonical uniques and skill gems as {{item:Name}}.",
  "Cite rare items or non-canonical uniques from this specific build as {{pobitem:<id>}} using the id from the summary.",
  "Cite chase items with a price as {{price:Name|divine}} when you want to mention cost.",
  "Never hardcode numbers (dps, res, hp). Use placeholders when possible. No Markdown. No quotes. No newlines other than spaces.",
].join(" ");

// ---------------------------------------------------------------------------
// Summary fetch
// ---------------------------------------------------------------------------

export async function fetchShowcaseSummary(
  code: string,
): Promise<SummaryActionResult> {
  const trimmed = code?.trim();
  if (!trimmed) return { ok: false, error: "code is required" };

  const engineBase = getEngineApiBase();
  if (!engineBase) return { ok: false, error: "ENGINE_API_URL is not set" };

  try {
    const res = await fetch(`${engineBase}/pob/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: trimmed }),
      // The snapshot ids embedded in gear[] are per-decode; the page is
      // keyed by the static PoB URL so we cache the summary for an hour.
      next: { revalidate: 60 * 60 },
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;
      return {
        ok: false,
        error: body?.message ?? body?.error ?? `HTTP ${res.status} ${res.statusText}`,
      };
    }
    return { ok: true, summary: (await res.json()) as PobSummary };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Prose generation (engine → openrouter-direct → deterministic fallback)
// ---------------------------------------------------------------------------

export async function generateProse(
  summary: PobSummary,
  section: ShowcaseSection,
): Promise<ProseResult> {
  // Tier 1 — engine endpoint (deployed prose controller with its own cache +
  // LLM cost logging). Fails open so we move onto the direct path silently.
  const viaEngine = await tryEngineProse(summary, section);
  if (viaEngine.ok) {
    return {
      text: viaEngine.text,
      source: "engine",
      model: viaEngine.model ?? null,
    };
  }

  // Tier 2 — direct OpenRouter from the site. Requires the same env var the
  // engine uses (`OPENROUTER_API_KEY`). Keeps the demo working even when
  // the engine hasn't shipped the new endpoint yet.
  const viaDirect = await tryOpenRouterDirect(summary, section);
  if (viaDirect.ok) {
    return {
      text: viaDirect.text,
      source: "openrouter-direct",
      model: OPENROUTER_MODEL,
    };
  }

  // Tier 3 — deterministic paragraph from the decoded summary. Still uses
  // the same placeholders so the page always renders tooltips, never raw
  // literal tokens or dead air.
  return {
    text: deterministicProse(summary, section),
    source: "fallback",
    model: null,
    error: viaEngine.error ?? viaDirect.error,
  };
}

// ---------------------------------------------------------------------------
// Tier 1 — engine
// ---------------------------------------------------------------------------

async function tryEngineProse(
  summary: PobSummary,
  section: ShowcaseSection,
): Promise<{ ok: true; text: string; model: string | null } | { ok: false; error: string }> {
  const engineBase = getEngineApiBase();
  if (!engineBase) return { ok: false, error: "ENGINE_API_URL is not set" };

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), PROSE_TIMEOUT_MS);
  try {
    const res = await fetch(`${engineBase}/preview/prose`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary, section }),
      signal: ac.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      return { ok: false, error: `engine prose HTTP ${res.status}` };
    }
    const data = (await res.json()) as {
      text?: string;
      model?: string;
      cached?: boolean;
    };
    if (!data.text) return { ok: false, error: "engine prose returned empty text" };
    return { ok: true, text: data.text, model: data.model ?? null };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Tier 2 — direct OpenRouter
// ---------------------------------------------------------------------------

async function tryOpenRouterDirect(
  summary: PobSummary,
  section: ShowcaseSection,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "OPENROUTER_API_KEY not set" };

  const userMessage = [
    `Write the "${section}" section.`,
    sectionInstruction(section),
    "Here is the decoded PoB summary as JSON:",
    JSON.stringify(summary),
  ].join("\n\n");

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), PROSE_TIMEOUT_MS);
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Title": "Path of Trade Showcase Preview",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: 260,
        temperature: 0.6,
      }),
      signal: ac.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `openrouter HTTP ${res.status}: ${body.slice(0, 200)}` };
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    const cleaned = cleanOutput(text);
    if (!cleaned) return { ok: false, error: "openrouter returned empty text" };
    return { ok: true, text: cleaned };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Tier 3 — deterministic fallback
// ---------------------------------------------------------------------------

/**
 * Builds a short placeholder-laced paragraph entirely from the decoded summary.
 * Guarantees the showcase always renders a visible tooltip-rich paragraph
 * even when every upstream LLM path fails.
 */
function deterministicProse(
  summary: PobSummary,
  section: ShowcaseSection,
): string {
  const gear = summary.gear ?? [];
  const keystones = summary.tree?.keystones ?? [];
  const notables = summary.tree?.notablesAllocated ?? [];
  const supports = summary.supports ?? [];
  const mainSkill = summary.mainSkill || null;
  const chaseUnique = gear.find(
    (g) => g.isUnique && g.name && g.canonical,
  );
  const nonCanonicalUnique = gear.find(
    (g) => g.isUnique && !!g.id,
  );
  const defining = chaseUnique ?? nonCanonicalUnique;
  const rare = gear.find((g) => !g.isUnique && !!g.id);

  switch (section) {
    case "tree": {
      const k1 = keystones[0] ? `{{passive:${keystones[0]}}}` : null;
      const k2 = keystones[1] ? `{{passive:${keystones[1]}}}` : null;
      const n1 = notables[0] ? `{{passive:${notables[0]}}}` : null;
      const n2 = notables[1] ? `{{passive:${notables[1]}}}` : null;
      const core: string[] = [];
      if (k1 && k2) core.push(`The tree commits to ${k1} and ${k2}`);
      else if (k1) core.push(`The tree commits to ${k1}`);
      else core.push(`The tree is built around dense clusters of wheel passives`);
      if (n1 && n2) core.push(`, passing through ${n1} and ${n2}`);
      else if (n1) core.push(`, passing through ${n1}`);
      core.push(` to fuel the build's identity.`);
      if (defining)
        core.push(
          ` The allocation also anchors around ${
            defining.canonical ? `{{item:${defining.name}}}` : `{{pobitem:${defining.id}}}`
          } so every extra point returns damage or defence.`,
        );
      return core.join("");
    }
    case "skills": {
      const skillToken = mainSkill ? `{{item:${mainSkill}}}` : null;
      const supportTokens = supports
        .slice(0, 4)
        .map((s) => `{{item:${s}}}`)
        .join(", ");
      const parts: string[] = [];
      if (skillToken) {
        parts.push(`The main damage skill is ${skillToken}`);
        if (supportTokens) {
          parts.push(`, linked with ${supportTokens} in the primary 6-link.`);
        } else {
          parts.push(` in the primary 6-link.`);
        }
        parts.push(
          ` The setup leans into the skill's core scaling while the supports push it into endgame-viable numbers.`,
        );
      } else {
        parts.push(
          `The skill setup pairs the main damage gem with its highest-multiplier supports, trading reliability for clear speed once the 6-link is assembled.`,
        );
      }
      return parts.join("");
    }
    case "gear": {
      const parts: string[] = [];
      if (chaseUnique) {
        parts.push(
          `Gearing centres on {{item:${chaseUnique.name}}}, a chase unique that opens up the rest of the build.`,
        );
      } else if (defining) {
        parts.push(
          `A defining piece (${`{{pobitem:${defining.id}}}`}) pushes the rest of the slots toward specific rolls.`,
        );
      } else {
        parts.push(
          "Gearing leans on well-rolled rares across every slot, with each piece chosen for a single load-bearing mod.",
        );
      }
      if (rare) {
        parts.push(
          ` Rare-slot shopping follows the same template as ${`{{pobitem:${rare.id}}}`}, stacking life, resists and an offensive suffix on each base.`,
        );
      }
      return parts.join("");
    }
    case "wrapup": {
      const parts: string[] = [];
      if (mainSkill) parts.push(`{{item:${mainSkill}}} carries the damage profile`);
      else parts.push(`The main skill carries the damage profile`);
      if (notables[0]) parts.push(`, with {{passive:${notables[0]}}} doing the heavy lifting on the tree`);
      parts.push(`. `);
      if (chaseUnique)
        parts.push(
          `Budget for {{price:${chaseUnique.name}|divine}} when shopping for the defining unique, and every other slot falls into place as league progress advances.`,
        );
      else if (defining)
        parts.push(
          `The defining piece in this build (${`{{pobitem:${defining.id}}}`}) is the build-enabler — once it's equipped, the rest slots in.`,
        );
      else
        parts.push(
          `Scaling is smooth once the core rares are assembled and the 6-link is hit.`,
        );
      parts.push(
        ` Overall this is a confident end-game build with clear upgrade paths.`,
      );
      return parts.join("");
    }
    default:
      return "";
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sectionInstruction(section: ShowcaseSection): string {
  switch (section) {
    case "tree":
      return [
        "Focus on the build's passive tree identity: its keystones and the most",
        "thematically important notables (damage vs defence vs utility).",
        "Every notable or keystone you mention MUST be wrapped in {{passive:Name}} exactly as it appears in summary.tree.",
      ].join(" ");
    case "gear":
      return [
        "Focus on the build's gear strategy: which uniques define it and which",
        "slots look for specific rare rolls. Cite canonical uniques like",
        "{{item:Mageblood}} when present. When referring to a specific rare or",
        "corrupted/enchanted unique piece from the summary, cite its exact",
        "{{pobitem:id}} from summary.gear[].id.",
      ].join(" ");
    case "skills":
      return [
        "Focus on the build's main skill setup. Cite the main skill as",
        "{{item:<mainSkill>}}. Cite each support gem from summary.supports as",
        "{{item:<support name>}} (use the support's full name, including",
        "'Awakened' and 'Support' words when present).",
      ].join(" ");
    case "wrapup":
      return [
        "Write a closing paragraph (4-6 sentences) summarising the feel of the",
        "build: main skill ({{item:...}}), one or two defining passives",
        "({{passive:...}}), one chase unique citing its price",
        "({{price:Name|divine}}), and a final verdict. Confident tone, end on a strong note.",
      ].join(" ");
    default:
      return "";
  }
}

function cleanOutput(raw: string): string {
  if (!raw) return "";
  let text = raw.trim();
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim();
  }
  text = text.replace(/^#{1,6}\s+\S.*$/gm, "").trim();
  text = text.replace(/\s*\n+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
  return text;
}
