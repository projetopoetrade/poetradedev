import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient, isAdmin } from "@/utils/supabase/admin";
import { bustDbCache } from "@/lib/revalidate-db";
import { DB_TAGS } from "@/lib/cache-tags";

export async function PATCH(req: Request) {
  try {
    // Verificar autenticação do usuário
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!isAdmin(user.id)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { productId, price, in_stock, is_listed, price_locked, is_featured, featured_order } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Build update payload — accept price and/or in_stock independently
    const updatePayload: Record<string, unknown> = {};

    if (price !== undefined) {
      if (isNaN(price) || price <= 0) {
        return NextResponse.json(
          { error: 'Valid price is required' },
          { status: 400 }
        );
      }
      updatePayload.price = price;
      // Editar o preço à mão trava a linha por padrão: sem isso o próximo
      // /api/admin/products/reprice desfaria o ajuste em silêncio. Quem quiser
      // devolver o item ao preço automático manda price_locked: false explícito.
      if (price_locked === undefined) {
        updatePayload.price_locked = true;
      }
    }

    if (price_locked !== undefined) {
      updatePayload.price_locked = Boolean(price_locked);
    }

    if (in_stock !== undefined) {
      updatePayload.in_stock = Boolean(in_stock);
    }

    if (is_listed !== undefined) {
      updatePayload.is_listed = Boolean(is_listed);
    }

    if (is_featured !== undefined) {
      updatePayload.is_featured = Boolean(is_featured);
      // Tirar do destaque zera a posição: guardar a ordem de um item que não
      // está mais na vitrine só cria buraco na numeração quando ele voltar.
      if (!is_featured) updatePayload.featured_order = null;
    }

    if (featured_order !== undefined) {
      if (featured_order === null || featured_order === "") {
        updatePayload.featured_order = null;
      } else {
        const order = Number(featured_order);
        if (!Number.isInteger(order) || order < 0) {
          return NextResponse.json(
            { error: 'featured_order must be a non-negative integer or null' },
            { status: 400 }
          );
        }
        updatePayload.featured_order = order;
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Usar admin client para atualizar produto (bypassa RLS)
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from('products')
      .update(updatePayload)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    bustDbCache(DB_TAGS.products);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in product update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
