import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

// Helper function to get appropriate order status from payment event type
function getOrderStatusFromEvent(eventType: string): string {
  switch (eventType) {
    case "payment_intent.succeeded":
      return "waiting_delivery";
    case "payment_intent.payment_failed":
      return "failed";
    case "payment_intent.canceled":
      return "canceled";
    default:
      return "processing";
  }
}

// Helper function to update an order with payment data
async function updateOrder(
  baseUrl: string,
  orderId: string,
  options: {
    status?: string;
    payment_status?: string;
    paymentIntent?: Stripe.PaymentIntent;
    stripe_session_id?: string;
  }
) {
  console.log(`Updating order ${orderId} via API`);

  // Construct the API endpoint URL
  const updateEndpoint = `${baseUrl}/api/orders/update`;

  // Build request body with only the properties that are provided
  const requestBody: any = { orderId };

  // Add overall order status if provided
  if (options.status) {
    requestBody.status = options.status;
    console.log(`Setting order status to: ${options.status}`);
  }

  // Add payment status if provided
  if (options.payment_status) {
    requestBody.payment_status = options.payment_status;
    console.log(`Setting payment status to: ${options.payment_status}`);
  }

  // Add stripe session ID if provided
  if (options.stripe_session_id) {
    requestBody.stripe_session_id = options.stripe_session_id;
    console.log(`Setting stripe session ID: ${options.stripe_session_id}`);
  }

  // Add payment intent if provided
  if (options.paymentIntent) {
    requestBody.paymentIntent = {
      id: options.paymentIntent.id,
      status: options.paymentIntent.status,
      amount: options.paymentIntent.amount,
      currency: options.paymentIntent.currency,
      customer: options.paymentIntent.customer,
      payment_method: options.paymentIntent.payment_method,
      created: options.paymentIntent.created,
      metadata: options.paymentIntent.metadata,
      receipt_email: options.paymentIntent.receipt_email,
    };
    console.log(`Including payment intent: ${options.paymentIntent.id}`);

    // If payment_status is not explicitly set but we have a paymentIntent,
    // use the payment intent status as payment_status
    if (!options.payment_status) {
      requestBody.payment_status = options.paymentIntent.status;
      console.log(
        `Setting payment status from intent: ${options.paymentIntent.status}`
      );
    }
  }

  console.log("Request payload:", JSON.stringify(requestBody));

  const response = await fetch(updateEndpoint, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  let responseData;
  try {
    responseData = await response.json();
    console.log(`API response status: ${response.status}, data:`, responseData);
  } catch (e) {
    const text = await response.text();
    console.log(`API response status: ${response.status}, text:`, text);
    responseData = { text };
  }

  if (!response.ok) {
    console.error("Failed to update order:", responseData);
    throw new Error(`Failed to update order: API returned ${response.status}`);
  }

  console.log(`Order ${orderId} successfully updated`);
  return responseData;
}

// Process payment intent events
async function handlePaymentIntent(event: Stripe.Event, baseUrl: string) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const orderId = paymentIntent.metadata?.orderId;

  if (!orderId) {
    throw new Error(
      `No order ID in payment intent metadata: ${paymentIntent.id}`
    );
  }

  console.log(
    `Processing payment intent: ${paymentIntent.id} for order: ${orderId}, event: ${event.type}`
  );

  // Get order status from the event type
  const orderStatus = getOrderStatusFromEvent(event.type);

  // Update with both status and payment status
  return await updateOrder(baseUrl, orderId, {
    status: orderStatus,
    payment_status: paymentIntent.status,
    paymentIntent: paymentIntent,
  });
}

// For status-only updates (no payment data needed)
async function updateOrderStatus(
  baseUrl: string,
  orderId: string,
  status: string
) {
  return await updateOrder(baseUrl, orderId, { status });
}

// For payment-status updates (no order status change)
async function updatePaymentStatus(
  baseUrl: string,
  orderId: string,
  paymentStatus: string
) {
  return await updateOrder(baseUrl, orderId, { payment_status: paymentStatus });
}

// Process checkout session events
async function handleCheckoutSession(event: Stripe.Event, baseUrl: string) {
  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    throw new Error(`No order ID in session metadata: ${session.id}`);
  }

  if (!session.payment_intent) {
    throw new Error(`No payment intent in session: ${session.id}`);
  }

  // Get payment intent details
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? await stripe.paymentIntents.retrieve(session.payment_intent)
      : session.payment_intent;

  console.log(
    `Processing checkout session: ${session.id} for order: ${orderId}, payment: ${paymentIntent.id}`
  );

  // For checkout sessions completed, we typically want to set to 'waiting_delivery' if the payment succeeded
  let statusOverride = null;
  if (
    event.type === "checkout.session.completed" &&
    paymentIntent.status === "succeeded"
  ) {
    statusOverride = "waiting_delivery";
  }

  const result = await updateOrder(baseUrl, orderId, {
    status: statusOverride || getOrderStatusFromEvent(paymentIntent.status),
    payment_status: paymentIntent.status,
    paymentIntent: paymentIntent,
    stripe_session_id: session.id,
  });

  if (statusOverride === "waiting_delivery") {
    try {
      const emailResponse = await fetch(`${baseUrl}/api/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      if (!emailResponse.ok) {
        console.error(
          "Failed to send confirmation email:",
          await emailResponse.text()
        );
      } else {
        console.log("Confirmation email sent successfully");
      }
    } catch (error) {
      console.error("Error sending confirmation email:", error);
    }
  }

  return result;
}

export async function POST(req: Request) {
  try {
    // Validate request method
    if (req.method !== "POST") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }

    // Validate request body
    const body = await req.text();
    if (!body) {
      return NextResponse.json(
        { error: "Empty request body" },
        { status: 400 }
      );
    }

    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log(`Webhook event received: ${event.type} (${event.id})`);

    // Get the base URL from the request for API calls
    const baseUrl = new URL(req.url).origin;

    // Handle different event types
    let result;
    switch (event.type) {
      case "payment_intent.succeeded":
        console.log("Payment succeeded event received");
        result = await handlePaymentIntent(event, baseUrl);
        break;

      case "payment_intent.payment_failed":
        console.log("Payment failed event received");
        // Log additional details about the failure
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment failure details:", {
          id: failedPaymentIntent.id,
          error: failedPaymentIntent.last_payment_error,
          status: failedPaymentIntent.status,
        });
        result = await handlePaymentIntent(event, baseUrl);
        break;

      case "payment_intent.canceled":
        console.log("Payment canceled event received");
        result = await handlePaymentIntent(event, baseUrl);
        break;

      case "checkout.session.completed":
        console.log("Checkout session completed event received");
        result = await handleCheckoutSession(event, baseUrl);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    console.log("Webhook processed successfully");
    return NextResponse.json({ received: true, processed: !!result });
  } catch (error) {
    console.error(
      "Webhook error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      {
        error: "Webhook handler failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}
