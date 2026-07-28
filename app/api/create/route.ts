import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { validateCartItems } from "@/lib/checkout/validate-items";
import { getExchangeRates, toMinorUnits } from "@/lib/pricing/exchange-rates";
import { ZodError } from "zod";
import {
  checkoutSchema,
  sanitizeCheckoutData,
} from "@/lib/validations/checkout";

// Instanciado sob demanda — ver comentário em `api/checkout/verify/route.ts`.
// `throw` no escopo de módulo quebra o build inteiro, não só esta rota.
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
  }
  return new Stripe(key, { apiVersion: "2025-04-30.basil" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, currency, characterName, observations } = body;

    console.log('Received checkout request:', {
      items,
      currency,
      characterName
    });

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }

    // Security: Validate character name and observations with Zod
    const validationResult = checkoutSchema.safeParse({
      characterName,
      observations,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return NextResponse.json(
        {
          error: firstError.message,
          field: firstError.path[0],
        },
        { status: 400 }
      );
    }

    // Security: Sanitize validated data
    const sanitizedData = sanitizeCheckoutData(validationResult.data);

    // Get authenticated user
    const supabaseServer = await createClient();
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Security: o carrinho é revalidado contra o banco DEPOIS da autenticação —
    // preço, nome e pedido mínimo vêm de lá, nunca do payload, que antes definia
    // o `unit_amount` cobrado pelo Stripe.
    const validated = await validateCartItems(items);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: validated.status });
    }
    const { items: validatedItems, totalAmount } = validated;

    // Preços no banco são em USD. O `unit_amount` do Stripe é cobrado NA moeda
    // passada em `currency` — antes mandávamos o número em dólar com
    // `currency: 'brl'`, ou seja, cobrávamos R$0,51 onde o preço era US$0,51,
    // cerca de um quinto do devido.
    const { rates } = await getExchangeRates();
    const currencyCode = String(currency || 'USD').toUpperCase();
    const rate = rates[currencyCode as keyof typeof rates];
    if (!rate) {
      return NextResponse.json(
        { error: `Unsupported currency: ${currencyCode}` },
        { status: 400 }
      );
    }
    const totalInCurrency = Number((totalAmount * rate).toFixed(2));

    // Create order in database with sanitized data
    const { data: order, error: orderError } = await supabaseServer
      .from('orders')
      .insert({
        character_name: sanitizedData.characterName,
        status: 'processing',
        email: user.email,
        items: validatedItems,
        // Na mesma moeda gravada em `currency` logo abaixo — antes o total ia em
        // USD com a moeda escolhida ao lado, o que tornava o pedido ilegível.
        total_amount: totalInCurrency,
        currency: currency.toLowerCase(),
        user_id: user.id,
        observations: sanitizedData.observations || null,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Create Stripe checkout session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: validatedItems.map((item) => ({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: item.product.name,
          },
          unit_amount: toMinorUnits(item.product.price, rate),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/cart`,
      metadata: {
        orderId: order.id,
        characterName: sanitizedData.characterName,
        userId: user.id,
        observations: sanitizedData.observations || '',
      },
      payment_intent_data: {
        metadata: {
          orderId: order.id,
          characterName: sanitizedData.characterName,
          userId: user.id,
          observations: sanitizedData.observations || '',
        },
        receipt_email: user.email,
        description: `Order for ${sanitizedData.characterName}`,
      },
    });

    console.log('Stripe session created:', {
      id: session.id,
      url: session.url,
      currency: currency.toLowerCase(),
      amount: totalInCurrency,
      amountUsd: totalAmount
    });


    return NextResponse.json({ id: session.id });
  } catch (error) {
    console.error('Stripe session creation error:', error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map(e => ({ field: e.path[0], message: e.message }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error creating checkout session' },
      { status: 500 }
    );
  }
}