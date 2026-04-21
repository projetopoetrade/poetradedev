"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Client-side UI for the PoB preview. Accepts a raw PoB code or pobb.in /
 * pastebin URL, sends it to either the summary or decode endpoint on the
 * engine, and shows the pretty-printed JSON plus a rough token estimate.
 *
 * The engine endpoints are @Public, so we can hit them directly from the
 * browser — the server component resolves `ENGINE_API_URL` and passes the
 * full URL in as a prop, keeping the var off the client bundle.
 */

interface Props {
  /** Full URL of the trimmed LLM summary endpoint. */
  summaryUrl: string;
  /** Full URL of the full decode endpoint. */
  decodeUrl: string;
}

type ViewMode = "summary" | "decode";

interface DecodeState {
  status: "idle" | "loading" | "error" | "ready";
  data: unknown;
  error: string | null;
  mode: ViewMode | null;
}

const INITIAL_STATE: DecodeState = {
  status: "idle",
  data: null,
  error: null,
  mode: null,
};

/** Rough 4-chars-per-token heuristic — fine for an at-a-glance budget gauge. */
function estimateTokens(data: unknown): number {
  if (data == null) return 0;
  return Math.ceil(JSON.stringify(data).length / 4);
}

export function PobPreviewClient({ summaryUrl, decodeUrl }: Props) {
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<ViewMode>("summary");
  const [state, setState] = useState<DecodeState>(INITIAL_STATE);

  const handleDecode = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setState({
        status: "error",
        data: null,
        error: "Paste a PoB code or pobb.in / pastebin URL first.",
        mode: null,
      });
      return;
    }
    setState({ status: "loading", data: null, error: null, mode });
    const url = mode === "summary" ? summaryUrl : decodeUrl;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      if (!res.ok) {
        // Engine returns `{ message, statusCode }` via BadRequestException.
        const body = (await res.json().catch(() => null)) as
          | { message?: string; error?: string }
          | null;
        const message =
          body?.message ?? body?.error ?? `HTTP ${res.status} ${res.statusText}`;
        setState({ status: "error", data: null, error: message, mode });
        return;
      }
      const data = (await res.json()) as unknown;
      setState({ status: "ready", data, error: null, mode });
    } catch (err) {
      setState({
        status: "error",
        data: null,
        error: (err as Error).message,
        mode,
      });
    }
  }, [code, decodeUrl, mode, summaryUrl]);

  const tokenEstimate = useMemo(
    () => (state.status === "ready" ? estimateTokens(state.data) : 0),
    [state],
  );

  return (
    <div className="space-y-6">
      {/* Input + controls */}
      <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        <label htmlFor="pob-code" className="block text-xs uppercase tracking-wider text-neutral-500">
          PoB code or URL
        </label>
        <textarea
          id="pob-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste PoB code or URL (pobb.in/XXXX, pastebin.com/XXXX)..."
          className="block w-full min-h-[160px] resize-y rounded-md border border-neutral-800 bg-black px-3 py-2 font-mono text-xs text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
          spellCheck={false}
        />
        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400">
          <span className="uppercase tracking-wider text-neutral-500">
            View mode
          </span>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="pob-mode"
              value="summary"
              checked={mode === "summary"}
              onChange={() => setMode("summary")}
            />
            <span>LLM summary</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="pob-mode"
              value="decode"
              checked={mode === "decode"}
              onChange={() => setMode("decode")}
            />
            <span>Full decode</span>
          </label>
          <button
            type="button"
            onClick={handleDecode}
            disabled={state.status === "loading"}
            className="ml-auto rounded-md border border-neutral-700 bg-neutral-900 px-4 py-1.5 text-xs font-medium text-neutral-100 hover:bg-neutral-800 disabled:opacity-60"
          >
            {state.status === "loading" ? "Decoding…" : "Decode"}
          </button>
        </div>
      </div>

      {/* Error */}
      {state.status === "error" && state.error && (
        <div className="rounded-lg border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
          {state.error}
        </div>
      )}

      {/* Result */}
      {state.status === "ready" && state.data != null && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-400">
            <span>
              Result (
              <span className="font-mono text-neutral-200">
                {state.mode === "summary" ? "summary" : "full decode"}
              </span>
              )
            </span>
            <span>
              Token estimate:{" "}
              <span className="font-mono text-neutral-200">
                ~{tokenEstimate.toLocaleString("en-US")}
              </span>
            </span>
          </div>
          <pre className="max-h-[640px] overflow-auto rounded-lg border border-neutral-800 bg-black p-4 font-mono text-xs text-neutral-200">
            {JSON.stringify(state.data, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
