import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient, isAdmin } from "@/utils/supabase/admin";

// GET - Buscar todas as ligas (sem filtro de gameVersion)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("leagues")
      .select("id, name, gameVersion, imageUrl, description, isActive, is_published, difficulty, poe_ninja_name, league_slug, divine_usd, price_markup, updated_at")
      .order("gameVersion", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching all leagues:", error);
      return NextResponse.json({ error: "Failed to fetch leagues" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error in GET /api/admin/leagues/all:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Atualizar campos de uma liga
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // As rotas irmãs (create/delete) já exigem isAdmin; esta escrevia com apenas
    // sessão válida, o que deixava qualquer usuário logado renomear ou desativar
    // uma liga.
    if (!isAdmin(user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, ...fields } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "League ID is required" }, { status: 400 });
    }

    // Apenas campos editáveis. `divine_usd` é a âncora em USD do Divine Orb desta
    // liga e `price_markup` a margem sobre o mercado — juntos governam o preço de
    // todo o catálogo via /api/admin/products/reprice.
    const allowed = ["name", "imageUrl", "description", "isActive", "is_published", "difficulty", "poe_ninja_name", "league_slug", "gameVersion", "divine_usd", "price_markup"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in fields) updates[key] = fields[key];
    }

    // Um markup ou âncora inválidos reprecificariam o catálogo inteiro para lixo,
    // então falham aqui em vez de virar NaN mais adiante.
    for (const key of ["divine_usd", "price_markup"] as const) {
      if (!(key in updates) || updates[key] === null) continue;
      const value = Number(updates[key]);
      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json(
          { error: `${key} must be a non-negative number` },
          { status: 400 },
        );
      }
      updates[key] = value;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("leagues")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating league:", error);
      return NextResponse.json({ error: "Failed to update league" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PATCH /api/admin/leagues/all:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
