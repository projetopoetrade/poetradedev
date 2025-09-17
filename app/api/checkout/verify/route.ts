import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
});

// Define an interface for our response data to allow for optional fields
interface SessionResponseData {
  id: string;
  status: string;
  payment_status: string;
  customer_email: string;
  amount_total: number;
  currency: string;
  created: number;
  metadata: Record<string, string>;
  line_items: Array<{
    description: string;
    quantity: number;
    amount_total: number;
    product_name: string;
  }>;
  order: any;
  customer_details?: Stripe.Checkout.Session.CustomerDetails;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve detailed session information with expanded objects
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: [
        'customer', 
        'payment_intent',
        'line_items.data.price.product'
      ]
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Try to get additional order information from the database
    let orderDetails = null;
    if (session.metadata?.orderId) {
      const supabase = await createClient();
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', session.metadata.orderId)
        .single();
      
      if (order) {
        orderDetails = order;
      }
    }

    // Try to get payment status safely 
    const paymentIntent = session.payment_intent && typeof session.payment_intent !== 'string' 
      ? session.payment_intent 
      : null;
    
    const paymentStatus = paymentIntent?.status || session.status;

    // Format line items safely with optional chaining
    const lineItems = session.line_items?.data.map(item => {
      return {
        description: item.description || '',
        quantity: item.quantity || 0,
        amount_total: item.amount_total || 0,
        // Avoid accessing nested properties that might not exist
        product_name: item.description || 'Product',
      };
    }) || [];

    // Create a safe response object with only properties we know exist
    const responseData: SessionResponseData = {
      id: session.id,
      status: session.status || 'unknown',
      payment_status: paymentStatus || 'unknown',
      customer_email: session.customer_email || '',
      amount_total: session.amount_total || 0,
      currency: session.currency || 'USD',
      created: session.created,
      metadata: session.metadata || {},
      line_items: lineItems,
      order: orderDetails,
    };

    // Add customer_details if available
    if (session.customer_details) {
      responseData.customer_details = session.customer_details;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error verifying session' },
      { status: 500 }
    );
  }
} 