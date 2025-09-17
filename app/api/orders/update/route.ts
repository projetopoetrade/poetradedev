import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function PATCH(req: Request) {
  try {
    const { orderId, status, payment_status, paymentIntent, stripe_session_id } = await req.json();

    console.log('Received order update request:', {
      orderId,
      status,
      payment_status,
      hasPaymentIntent: !!paymentIntent,
      stripe_session_id
    });

    // Validate required fields
    if (!orderId) {
      console.error('Missing orderId in request');
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // At least one of status, payment_status, paymentIntent or stripe_session_id is required
    if (!status && !payment_status && !paymentIntent && !stripe_session_id) {
      console.error('No update fields provided');
      return NextResponse.json(
        { error: 'At least one of status, payment_status, paymentIntent, or stripe_session_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // First check if order exists
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .single();

    if (fetchError || !existingOrder) {
      console.error('Order not found:', { orderId, error: fetchError });
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('Found existing order:', existingOrder);

    // Build the update object based on what was provided
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Only add fields that were provided
    if (status) {
      updateData.status = status;
    }
    
    if (payment_status) {
      updateData.payment_status = payment_status;
    }
    
    if (paymentIntent) {
      updateData.payment_intent = paymentIntent;
    }

    if (stripe_session_id) {
      updateData.stripe_session_id = stripe_session_id;
    }

    console.log('Updating order with:', updateData);

    // Update the order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    console.log('Successfully updated order:', updatedOrder);
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error in orders PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 