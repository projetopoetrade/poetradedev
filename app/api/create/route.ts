import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { ZodError } from "zod";
import {
  checkoutSchema,
  sanitizeCheckoutData,
} from "@/lib/validations/checkout";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, currency, characterName, observations } = body;

    console.log('Received checkout request:', {
      items,
      currency,
      characterName
    });

    // Security: Validate items
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

    // Calculate total amount
    const totalAmount = items.reduce((total, item) => total + (item.product.price * item.quantity), 0);

    // Create order in database with sanitized data
    const { data: order, error: orderError } = await supabaseServer
      .from('orders')
      .insert({
        character_name: sanitizedData.characterName,
        status: 'processing',
        email: user.email,
        items: items,
        total_amount: totalAmount,
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
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map((item) => ({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: item.product.name,
            description: item.product.description,
          },
          unit_amount: Math.round(item.product.price * 100), // Convert to cents
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
      amount: items.reduce((total, item) => total + (item.product.price * item.quantity), 0)
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