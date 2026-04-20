import 'server-only';

/**
 * Shared helper to resolve the base URL of the Path of Trade content engine.
 *
 * Preference order:
 *   1. `ENGINE_API_URL` — the engine root, e.g. `https://api.pathoftrade.net/api`
 *   2. `ENGINE_PRICES_URL` — legacy pointer to the `ninja` subpath. Stripped
 *      back to the engine root for backwards compatibility.
 *
 * Returns `null` when the engine is not configured, which lets callers fall
 * back to hitting upstream sources directly (poe.ninja) or to a lightweight
 * no-data render.
 */
export function getEngineApiBase(): string | null {
  const explicit = process.env.ENGINE_API_URL?.trim().replace(/\/$/, '');
  if (explicit) return explicit;

  const legacy = process.env.ENGINE_PRICES_URL?.trim().replace(/\/$/, '');
  if (legacy) return legacy.replace(/\/ninja$/, '');

  return null;
}
