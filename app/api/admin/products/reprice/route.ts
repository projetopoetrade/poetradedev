import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient, isAdmin } from "@/utils/supabase/admin";
import { getCxDivineValues } from "@/lib/pricing/cx-exchange";
import { getNinjaDivineValues } from "@/lib/pricing/ninja-exchange";

/**
 * Recalcula o preço em USD do catálogo de uma liga a partir do valor em divine.
 *
 *   price = price_divine * leagues.divine_usd * (1 + leagues.price_markup)
 *
 * O valor em divine vem de uma cascata de fontes:
 *
 *   1. Currency Exchange oficial da GGG, casando por `products.metadata_id`.
 *      Fonte primária: chave estável, traz volume e banda de razão.
 *   2. poe.ninja, casando por nome. Cobre o que o CX in-game não aceita
 *      (Scouting Reports, Catalysts, Veiled Scarab, orbes Zana...).
 *   3. Nada: a linha fica de fora e você define o preço à mão. O
 *      `price_locked` garante que o recálculo não a atropele depois.
 *
 * `price_divine` é gravado em TODA linha resolvida — inclusive nas travadas,
 * porque é dado de mercado e serve para comparar a etiqueta manual com a
 * referência. Já o `price` só é reescrito onde `price_locked = false`.
 *
 * Aceita sessão de admin ou `Bearer CRON_SECRET`.
 */

// Preço em USD com 6 casas de propósito: currency barata (Scroll of Wisdom vale
// ~0,04 chaos) some se arredondar a 2 ou 4. Formatação é problema da UI.
const USD_DECIMALS = 6;

function roundUsd(value: number): number {
  const factor = 10 ** USD_DECIMALS;
  return Math.round(value * factor) / factor;
}

/**
 * Menor pedido possível, em unidades, para que a compra valha ao menos 1 divine.
 * Divine e tudo acima ficam em 1; um Chaos Orb a 0,0088 divine vira ~114.
 */
function minQuantityFor(divineValue: number): number {
  return Math.max(1, Math.ceil(1 / divineValue));
}

async function authorize(req: NextRequest): Promise<string | null> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return null;

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return "Unauthorized";
  if (!isAdmin(user.id)) return "Forbidden";
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const denied = await authorize(req);
    if (denied) {
      return NextResponse.json({ error: denied }, { status: denied === "Forbidden" ? 403 : 401 });
    }

    const { league, gameVersion, hours = 6, dryRun = false } = await req.json();
    if (!league || typeof league !== "string") {
      return NextResponse.json({ error: "league is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // `name` não é único entre jogos: "Standard" existe em PoE 1 e PoE 2. Sem
    // gameVersion a consulta traria duas linhas, então exigimos desambiguação
    // em vez de reprecificar a liga errada.
    let leagueQuery = admin
      .from("leagues")
      .select("name, gameVersion, divine_usd, price_markup, poe_ninja_name")
      .eq("name", league);
    if (gameVersion) leagueQuery = leagueQuery.eq("gameVersion", gameVersion);

    const { data: leagueRows, error: leagueError } = await leagueQuery;
    if (leagueError) throw leagueError;
    if (!leagueRows || leagueRows.length === 0) {
      return NextResponse.json({ error: `League not found: ${league}` }, { status: 404 });
    }
    if (leagueRows.length > 1) {
      return NextResponse.json(
        {
          error: `League "${league}" exists in more than one game — pass gameVersion`,
          candidates: leagueRows.map((l) => l.gameVersion),
        },
        { status: 409 },
      );
    }

    const leagueRow = leagueRows[0];
    if (leagueRow.divine_usd == null) {
      return NextResponse.json(
        { error: `League "${league}" has no divine_usd set — define the divine anchor first` },
        { status: 422 },
      );
    }

    const factor = leagueRow.divine_usd * (1 + (leagueRow.price_markup ?? 0));

    // As duas fontes são independentes; uma falhar não pode derrubar a outra.
    const [cx, ninja] = await Promise.all([
      getCxDivineValues(leagueRow.name, hours).catch(() => null),
      getNinjaDivineValues(leagueRow.poe_ninja_name || leagueRow.name).catch(() => null),
    ]);

    if (!cx?.values.size && !ninja?.values.size) {
      return NextResponse.json(
        { error: `No price data for "${league}" from either the Currency Exchange or poe.ninja` },
        { status: 422 },
      );
    }

    const { data: products, error: productsError } = await admin
      .from("products")
      .select("id, name, metadata_id, price, price_divine, price_locked")
      .eq("league", league)
      .eq("gameVersion", leagueRow.gameVersion);

    if (productsError) throw productsError;

    type Update = {
      id: number;
      price_divine: number;
      price_source: string;
      min_quantity: number;
      price?: number;
    };
    const updates: Update[] = [];
    const unmatched: string[] = [];
    const bySource = { cx: 0, ninja: 0 };
    let lockedSkipped = 0;

    for (const product of products || []) {
      const fromCx = product.metadata_id ? cx?.values.get(product.metadata_id) : undefined;
      const divineValue = fromCx ?? ninja?.values.get(product.name);
      const source = fromCx != null ? "cx" : "ninja";

      if (divineValue == null || !Number.isFinite(divineValue) || divineValue <= 0) {
        unmatched.push(product.name);
        continue;
      }

      bySource[source as "cx" | "ninja"] += 1;
      const update: Update = {
        id: product.id,
        price_divine: divineValue,
        price_source: source,
        // Atualizado mesmo em linha travada: a trava é de PREÇO, não de política
        // de pedido — o mínimo deve seguir o valor de mercado do item.
        min_quantity: minQuantityFor(divineValue),
      };

      if (product.price_locked) {
        lockedSkipped += 1;
        update.price_source = "manual";
      } else {
        update.price = roundUsd(divineValue * factor);
      }

      updates.push(update);
    }

    if (!dryRun) {
      // Sem RPC no projeto, então são updates individuais. O catálogo é da ordem
      // de 100 linhas por liga; em lotes de 20 isso resolve em poucas rodadas.
      const BATCH = 20;
      for (let i = 0; i < updates.length; i += BATCH) {
        const results = await Promise.all(
          updates.slice(i, i + BATCH).map(({ id, ...fields }) =>
            admin.from("products").update(fields).eq("id", id),
          ),
        );
        const failed = results.find((r) => r.error);
        if (failed?.error) throw failed.error;
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      league,
      divineUsd: leagueRow.divine_usd,
      markup: leagueRow.price_markup ?? 0,
      factor,
      sources: {
        cx: { available: cx?.values.size ?? 0, used: bySource.cx, chaosPerDivine: cx?.chaosPerDivine ?? null, hours },
        ninja: { available: ninja?.values.size ?? 0, used: bySource.ninja, chaosPerDivine: ninja?.chaosPerDivine ?? null },
      },
      productsInLeague: products?.length ?? 0,
      repriced: updates.length - lockedSkipped,
      lockedSkipped,
      unmatchedCount: unmatched.length,
      unmatched: unmatched.slice(0, 30),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[Reprice] Failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
