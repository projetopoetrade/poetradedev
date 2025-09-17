// app/api/create-ticket/route.ts
import { NextResponse, NextRequest } from 'next/server';

// Define a type for the expected request body
interface TicketRequestBody {
  email: string;
  subject: string;
  description: string;
  status?: number;
  priority?: number;
  name?: string;
}

// Define a type for the Freshdesk ticket creation payload
interface FreshdeskTicketPayload {
  email: string;
  subject: string;
  description: string;
  status: number;
  priority: number;
  name?: string;
}

// Define a basic type for the expected successful Freshdesk API response
interface FreshdeskTicketResponse {
  id: number;
  [key: string]: any;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as TicketRequestBody;
    const {
      email,
      subject,
      description,
      status,
      priority,
      name,
    } = body;

    if (!email || !subject || !description) {
      return NextResponse.json({ message: 'Missing required fields: email, subject, description.' }, { status: 400 });
    }

    const FD_ENDPOINT = process.env.NEXT_PUBLIC_FRESHDESK_DOMAIN;
    const API_KEY = process.env.FRESHDESK_API_KEY;

    if (!FD_ENDPOINT || !API_KEY) {
      console.error('Freshdesk domain or API key is not configured.');
      return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
    }

    const URL = `https://${FD_ENDPOINT}.freshdesk.com/api/v2/tickets`;

    const ticketData: FreshdeskTicketPayload = {
      email,
      subject,
      description,
      status: status || 2, // Default to Open
      priority: priority || 1, // Default to Low
      name: name,
    };

    const freshdeskResponse = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(API_KEY + ':X').toString('base64')}`,
      },
      body: JSON.stringify(ticketData),
    });

    const responseData = await freshdeskResponse.json();

    if (!freshdeskResponse.ok) {
      console.error('Freshdesk API Error:', responseData);
      console.error('Freshdesk Response Status:', freshdeskResponse.status);
      const requestId = freshdeskResponse.headers.get('x-request-id');
      console.error("X-Request-Id:", requestId);
      return NextResponse.json({
        message: 'Error creating ticket in Freshdesk.',
        details: responseData.errors || responseData.description || 'Unknown error',
        requestId: requestId,
      }, { status: freshdeskResponse.status });
    }

    console.log('Freshdesk Response Body:', responseData);
    console.log("Response Status : " + freshdeskResponse.status);
    if (freshdeskResponse.status === 201) {
      console.log("Location Header : " + freshdeskResponse.headers.get('location'));
    }

    return NextResponse.json(responseData as FreshdeskTicketResponse, { status: 201 });

  } catch (error: any) {
    console.error('Error in create-ticket API route:', error);
    return NextResponse.json({ message: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}