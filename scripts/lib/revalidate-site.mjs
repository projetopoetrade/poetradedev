/**
 * Derruba o cache do site depois de uma escrita feita FORA do Next.
 *
 * As leituras do Supabase em `app/actions.ts` são cacheadas com tag
 * (`lib/cache-tags.ts`), e as rotas admin invalidam sozinhas via `bustDbCache`.
 * Um script que fala com o Postgres direto passa por baixo disso: sem esta
 * chamada, o site só reflete a mudança quando o TTL vencer (6 h para produto).
 *
 * Precisa de `REVALIDATE_SECRET` no ambiente — o mesmo valor configurado na
 * Vercel. Sem ele o endpoint responde 503 de propósito (o default público que
 * existia ali era explorável).
 *
 * Uso:
 *   import { revalidateSite } from "./lib/revalidate-site.mjs";
 *   await revalidateSite(["db-products"]);
 */

const KNOWN_TAGS = ["db-products", "db-leagues", "db-builds"];

export async function revalidateSite(tags, { dryRun = false } = {}) {
  const unknown = tags.filter((t) => !KNOWN_TAGS.includes(t));
  if (unknown.length) {
    throw new Error(
      `Tag desconhecida: ${unknown.join(", ")}. Conhecidas: ${KNOWN_TAGS.join(", ")}`,
    );
  }

  if (dryRun) {
    console.log(`[revalidate] dry-run — invalidaria ${tags.join(", ")}`);
    return { skipped: "dry-run" };
  }

  const secret = process.env.REVALIDATE_SECRET;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net").replace(/\/+$/, "");

  // Avisa em vez de quebrar: o script já gravou no banco quando chega aqui, e
  // abortar com erro faria parecer que a escrita falhou. O pior caso é o site
  // demorar o TTL para refletir.
  if (!secret) {
    console.warn(
      "[revalidate] REVALIDATE_SECRET não definido — cache do site NÃO foi invalidado.\n" +
      `            As mudanças aparecem quando o TTL vencer, ou limpe pelo painel admin.`,
    );
    return { skipped: "no-secret" };
  }

  try {
    const res = await fetch(`${base}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ tags }),
    });

    if (!res.ok) {
      console.warn(`[revalidate] falhou: HTTP ${res.status} ${await res.text()}`);
      return { ok: false, status: res.status };
    }

    console.log(`[revalidate] ${base} invalidou ${tags.join(", ")}`);
    return { ok: true };
  } catch (error) {
    console.warn(`[revalidate] falhou: ${error.message}`);
    return { ok: false, error: error.message };
  }
}
