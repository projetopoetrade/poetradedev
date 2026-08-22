import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { DB_TAG_VALUES, isDbTag } from "@/lib/cache-tags";

// Sanity types whose publish/unpublish events should bust the sitemap cache.
// Products in the sitemap come from Supabase, so a Sanity product publish does
// not invalidate the sitemap from this handler.
const SITEMAP_TYPES = new Set(["post", "leagueLanding"]);

const bustSitemapIfNeeded = (type: string) => {
  if (SITEMAP_TYPES.has(type)) revalidatePath("/sitemap.xml");
};

export async function POST(req: NextRequest) {
  try {
    // Caminho interno (scripts de catálogo, jobs fora do Next). Sem
    // `REVALIDATE_SECRET` configurado no ambiente, ele simplesmente não existe.
    //
    // Antes o fallback era a string literal "your-secret-key" — e o botão do
    // painel admin mandava exatamente esse valor a partir do browser, via
    // `NEXT_PUBLIC_REVALIDATE_SECRET` (nunca definida). Na prática o endpoint
    // era público: dava para invalidar o site em loop e queimar a cota de ISR
    // Write. O painel agora usa server action; aqui o default morreu.
    const authHeader = req.headers.get("authorization");
    const internalSecret = process.env.REVALIDATE_SECRET;

    if (authHeader?.startsWith("Bearer ") && !internalSecret) {
      console.error("[revalidate] REVALIDATE_SECRET não configurado; caminho interno desabilitado");
      return new Response("Internal revalidation is not configured", { status: 503 });
    }

    if (internalSecret && authHeader === `Bearer ${internalSecret}`) {
      // Internal request - parse JSON directly
      const body = await req.json();

      // Caminho novo: `{ tags: ["db-products"] }`. Existe para quem escreve no
      // Supabase por fora do Next — o job de preço do poetrade-content, um
      // UPDATE manual — poder derrubar o Data Cache sem inventar um `_type`
      // falso. Só aceita as tags conhecidas: `revalidateTag` com string
      // arbitrária falha em silêncio e a chamada pareceria ter funcionado.
      if (Array.isArray(body?.tags)) {
        const accepted = body.tags.filter(
          (tag: unknown): tag is string => typeof tag === "string" && isDbTag(tag),
        );
        const rejected = body.tags.filter((tag: unknown) => !accepted.includes(tag as string));

        if (accepted.length === 0) {
          return NextResponse.json(
            { error: "No known tags", known: DB_TAG_VALUES, rejected },
            { status: 400 },
          );
        }

        for (const tag of accepted) revalidateTag(tag);

        // Produto novo/despublicado muda a lista de URLs, não só o conteúdo.
        if (accepted.includes("db-products")) revalidatePath("/sitemap.xml");

        return NextResponse.json({
          status: 200,
          revalidated: true,
          tags: accepted,
          rejected,
          now: Date.now(),
        });
      }

      if (!body?._type) {
        return new Response("Bad Request: _type or tags is required", { status: 400 });
      }

      revalidateTag(body._type);
      bustSitemapIfNeeded(body._type);
      return NextResponse.json({
        status: 200,
        revalidated: true,
        sitemapRevalidated: SITEMAP_TYPES.has(body._type),
        now: Date.now(),
        body,
      });
    }

    // Sanity webhook request - validate signature.
    //
    // Lia `NEXT_PUBLIC_SANITY_HOOK_SECRET`, que não existe em lugar nenhum — nem
    // nas env vars da Vercel, nem no `.env.local`. Com o segredo `undefined` o
    // `parseBody` nunca valida e a rota devolvia 401 para todo webhook do
    // Sanity: `revalidateTag(_type)` por publicação simplesmente não acontecia.
    // Passou despercebido enquanto tudo tinha `revalidate = 300`.
    //
    // O nome correto é `SANITY_HOOK_SECRET` — é o que já existe nos dois lados e
    // o que `/api/webhooks/sanity-product` sempre usou. Segredo de webhook não
    // pode ser `NEXT_PUBLIC_` de qualquer forma: isso o publicaria no bundle.
    const sanitySecret = process.env.SANITY_HOOK_SECRET;

    if (!sanitySecret) {
      console.error("[revalidate] SANITY_HOOK_SECRET não configurado");
      return new Response("Webhook secret is not configured", { status: 503 });
    }

    const { body, isValidSignature } = await parseBody<{
      _type: string;
      slug?: string | undefined;
    }>(req, sanitySecret);

    if (!isValidSignature) {
      return new Response("Invalid Signature", { status: 401 });
    }

    if (!body?._type) {
      return new Response("Bad Request", { status: 400 });
    }

    revalidateTag(body._type);
    bustSitemapIfNeeded(body._type);
    return NextResponse.json({
      status: 200,
      revalidated: true,
      sitemapRevalidated: SITEMAP_TYPES.has(body._type),
      now: Date.now(),
      body,
    });
  } catch (error: any) {
    console.error(error);
    return new Response(error.message, { status: 500 });
  }
}