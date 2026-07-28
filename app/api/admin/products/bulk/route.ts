import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient, isAdmin } from "@/utils/supabase/admin";

/**
 * Liga/desliga `is_listed` e `in_stock` para o catálogo inteiro de uma liga.
 *
 * Existe porque a virada de liga cria os produtos pelo clone
 * (`/api/admin/leagues/clone`) e pelo sync do poe.ninja
 * (`/api/admin/sync-ninja`) — e os dois nascem com `is_listed: false`. Até aqui
 * a única forma de publicar o catálogo era rodar UPDATE à mão no Supabase.
 *
 * `onlyPriced` é a trava de segurança: por padrão só publica o que tem preço,
 * para não jogar no ar uma liga inteira a $0.
 *
 * Exemplo:
 *   POST /api/admin/products/bulk  { "league": "Allflame", "is_listed": true }
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { league, gameVersion, is_listed, in_stock, onlyPriced = true } = await req.json();

    if (!league || typeof league !== "string") {
      return NextResponse.json({ error: "league is required" }, { status: 400 });
    }
    if (is_listed === undefined && in_stock === undefined) {
      return NextResponse.json(
        { error: "Nothing to do — pass is_listed and/or in_stock" },
        { status: 400 },
      );
    }

    const updatePayload: Record<string, boolean> = {};
    if (is_listed !== undefined) updatePayload.is_listed = Boolean(is_listed);
    if (in_stock !== undefined) updatePayload.in_stock = Boolean(in_stock);

    const admin = createAdminClient();
    let query = admin.from("products").update(updatePayload).eq("league", league);

    // "Standard" existe em PoE 1 e PoE 2. Sem gameVersion isto publicaria os
    // dois catálogos de uma vez.
    if (gameVersion) query = query.eq("gameVersion", gameVersion);

    // Publicar a $0 é pior que não publicar: o produto aparece na listagem e
    // quebra a confiança na loja. Só vale ao DESpublicar, aí o preço não importa.
    const publishing = updatePayload.is_listed === true || updatePayload.in_stock === true;
    if (onlyPriced && publishing) {
      query = query.gt("price", 0);
    }

    const { data, error } = await query.select("id");
    if (error) throw error;

    return NextResponse.json({
      success: true,
      league,
      applied: updatePayload,
      onlyPriced: onlyPriced && publishing,
      affected: data?.length ?? 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[Products/bulk] Failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
