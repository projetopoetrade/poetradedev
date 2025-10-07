import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function PATCH(req: Request) {
  try {
    const { 
      orderId, 
      status, 
      payment_status, 
      paymentIntent, 
      payment_data,
      stripe_session_id 
    } = await req.json();

    console.log('Received order update request:', {
      orderId,
      status,
      payment_status,
      hasPaymentIntent: !!paymentIntent,
      hasPaymentData: !!payment_data,
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

    // At least one field is required
    if (!status && !payment_status && !paymentIntent && !payment_data && !stripe_session_id) {
      console.error('No update fields provided');
      return NextResponse.json(
        { error: 'At least one update field is required' },
        { status: 400 }
      );
    }

    // Use admin client porque esta rota é chamada pela webhook (sem autenticação de usuário)
    const supabase = createAdminClient();

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
    
    // Handle Stripe payment intent
    if (paymentIntent) {
      updateData.payment_intent = paymentIntent;
    }

    // Handle PIX payment data
    if (payment_data) {
      updateData.payment_data = payment_data;
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
