import { createAdminClient } from "@/utils/supabase/admin";

/**
 * Revalida o carrinho contra o banco antes de cobrar.
 *
 * Existe porque as rotas de checkout confiavam no payload do cliente: o total do
 * pedido e o `unit_amount` do Stripe saíam de `item.product.price`, que vem do
 * body da requisição. Uma requisição forjada comprava um Mirror of Kalandra por
 * um centavo. Aqui o preço, o nome e o mínimo são SEMPRE relidos do banco pelo
 * `id`; o que o cliente manda serve só para dizer QUAL produto e QUANTOS.
 *
 * Também aplica o pedido mínimo (`min_quantity`), calibrado para que a menor
 * compra valha ~1 divine — sem isto o mínimo seria só enfeite de front.
 */

export type CartItemInput = {
  product?: { id?: number | string } | null;
  quantity?: number | string;
};

export type ValidatedItem = {
  product: {
    id: number;
    name: string;
    price: number;
    slug: string | null;
    min_quantity: number;
    imgUrl: string | null;
  };
  quantity: number;
  lineTotal: number;
};

export type ValidationResult =
  | { ok: true; items: ValidatedItem[]; totalAmount: number }
  | { ok: false; error: string; status: number };

export async function validateCartItems(rawItems: unknown): Promise<ValidationResult> {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { ok: false, error: "No items provided", status: 400 };
  }

  const wanted = new Map<number, number>();
  for (const raw of rawItems as CartItemInput[]) {
    const id = Number(raw?.product?.id);
    const quantity = Math.floor(Number(raw?.quantity));
    if (!Number.isInteger(id) || id <= 0) {
      return { ok: false, error: "Invalid product in cart", status: 400 };
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { ok: false, error: "Invalid quantity", status: 400 };
    }
    // Mesmo produto repetido no carrinho soma, em vez de virar duas linhas que
    // burlariam o mínimo separadamente.
    wanted.set(id, (wanted.get(id) || 0) + quantity);
  }

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("products")
    .select("id, name, price, slug, min_quantity, imgUrl, is_listed, in_stock")
    .in("id", Array.from(wanted.keys()));

  if (error) {
    console.error("[Checkout] Failed to load products:", error);
    return { ok: false, error: "Failed to validate cart", status: 500 };
  }

  const byId = new Map((rows || []).map((r) => [r.id, r]));
  const items: ValidatedItem[] = [];

  for (const [id, quantity] of Array.from(wanted.entries())) {
    const row = byId.get(id);
    if (!row) {
      return { ok: false, error: "Product not found", status: 404 };
    }
    if (!row.in_stock) {
      return { ok: false, error: `${row.name} is out of stock`, status: 409 };
    }
    if (!row.price || row.price <= 0) {
      return { ok: false, error: `${row.name} is not available for purchase`, status: 409 };
    }

    const min = Math.max(1, row.min_quantity ?? 1);
    if (quantity < min) {
      return {
        ok: false,
        error: `${row.name}: pedido mínimo de ${min.toLocaleString("pt-BR")} unidades`,
        status: 400,
      };
    }

    items.push({
      product: {
        id: row.id,
        name: row.name,
        price: row.price,
        slug: row.slug,
        min_quantity: min,
        imgUrl: row.imgUrl,
      },
      quantity,
      lineTotal: row.price * quantity,
    });
  }

  const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);
  return { ok: true, items, totalAmount };
}
