import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { EmailTemplate } from '@/components/email-template';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order details from Supabase
    const cookieStore = await cookies();
    const supabase = await createClient();
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only send email for completed orders
    if (order.status !== 'waiting_delivery') {
      return NextResponse.json(
        { error: 'Order is not ready for delivery' },
        { status: 400 }
      );
    }
    // Send confirmation email
    try {
      await resend.emails.send({
        from: 'admin@pathoftrade.net',
        to: order.email,
        subject: `Order Confirmation - #${order.id}`,
        react: EmailTemplate({ order }) as React.ReactElement,
      });

      return NextResponse.json({ 
        success: true,
        message: 'Order confirmation email sent'
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 