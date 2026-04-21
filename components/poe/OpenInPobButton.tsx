"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

/**
 * "Open in PoB" button that invokes the Path of Building desktop app via its
 * custom protocol handler `pob://pobbin/<key>`.
 *
 * Two input modes:
 *   - `pobbUrl`  — a pobb.in URL. The key is the path segment, so we can
 *                  build the protocol URL locally without a server roundtrip.
 *                  Used by published build pages and the showcase page.
 *   - `pobCode`  — the raw Path of Building export (base64+zlib). Too long
 *                  for a protocol URL, so we POST it to `/api/tools/pob-viewer/pobbin`
 *                  which uploads to pobb.in and hands back a short key. Used
 *                  by the interactive PoB viewer where the user pastes the
 *                  full code directly.
 *
 * On success the browser navigates to `pob://pobbin/<key>`. Whether that
 * actually opens PoB depends on the user having installed the PoB-PoE/PoB
 * desktop client — there is no reliable way to detect a missing protocol
 * handler from JavaScript. If the user sees nothing happen we fall back to
 * copying the pobb.in URL to the clipboard so they can paste it into PoB's
 * "Import from URL" dialog manually.
 */
interface OpenInPobButtonProps {
  /** Pobb.in URL — `https://pobb.in/<key>`. */
  pobbUrl?: string;
  /** Raw PoB export code (base64 + zlib). Mutually exclusive with `pobbUrl`. */
  pobCode?: string;
  /**
   * Optional cache — when `pobCode` has already been uploaded, passing the
   * returned key here avoids a second upload. The component updates the
   * cache via `onKeyResolved` so parent state stays in sync.
   */
  cachedKey?: string | null;
  onKeyResolved?: (key: string) => void;
  /** Tailwind class override — defaults to the amber pill style. */
  className?: string;
  /** Optional label override. Defaults to "Open in PoB". */
  label?: string;
  /** Hide text, icon-only. */
  iconOnly?: boolean;
}

const DEFAULT_CLASSNAME =
  "inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

export function extractPobbinKey(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();
    if (!host.endsWith("pobb.in")) return null;
    // Accept both `/<key>` and `/pob/<key>`.
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;
    if (segments[0] === "pob" && segments.length >= 2) return segments[1];
    return segments[0];
  } catch {
    return null;
  }
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function OpenInPobButton({
  pobbUrl,
  pobCode,
  cachedKey,
  onKeyResolved,
  className,
  label = "Open in PoB",
  iconOnly = false,
}: OpenInPobButtonProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleClick() {
    setFeedback(null);

    // Mode 1: pobb.in URL — key is in the path, no server call needed.
    if (pobbUrl) {
      const key = extractPobbinKey(pobbUrl);
      if (!key) {
        setFeedback("URL pobb.in inválida");
        return;
      }
      // Copy the pobb.in URL to clipboard so that if the protocol handler
      // isn't installed the user can still paste it into PoB manually.
      await copyToClipboard(pobbUrl);
      window.location.href = `pob://pobbin/${key}`;
      setFeedback("Abrindo no PoB… (link copiado se precisar colar manual)");
      return;
    }

    // Mode 2: raw code — upload to pobb.in first, reuse cached key when available.
    if (!pobCode) {
      setFeedback("Nenhum código ou URL fornecido");
      return;
    }
    if (cachedKey) {
      window.location.href = `pob://pobbin/${cachedKey}`;
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tools/pob-viewer/pobbin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: pobCode.trim() }),
      });
      const json = (await res.json()) as { key?: string; error?: string };
      if (!json.key) {
        setFeedback(json.error ?? "Falha ao gerar link");
        return;
      }
      onKeyResolved?.(json.key);
      await copyToClipboard(`https://pobb.in/${json.key}`);
      window.location.href = `pob://pobbin/${json.key}`;
      setFeedback("Abrindo no PoB… (link copiado se precisar colar manual)");
    } catch (err) {
      setFeedback((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={className ?? DEFAULT_CLASSNAME}
        title="Abre no app PoB via protocolo pob:// (requer Path of Building instalado)"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <ExternalLink className="w-3 h-3" />
        )}
        {!iconOnly && <span>{loading ? "Gerando..." : label}</span>}
      </button>
      {feedback && (
        <span className="text-[9px] italic text-muted-foreground">{feedback}</span>
      )}
    </span>
  );
}
