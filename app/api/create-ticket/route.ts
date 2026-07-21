// app/api/create-ticket/route.ts
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  ticketSchema,
  sanitizeTicketData,
} from "@/lib/validations/ticket";

// Cache para o access token (em memória)
let cachedAccessToken: string | null = null;
let tokenExpiryTime: number | null = null;

// Security: Rate limiting map (IP-based)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 1; // 5 requests per minute per IP

// Função para renovar o access token usando refresh token
async function getValidAccessToken(): Promise<string> {
  // Se temos um token válido em cache, retorna ele
  if (cachedAccessToken && tokenExpiryTime && Date.now() < tokenExpiryTime) {
    return cachedAccessToken;
  }

  // Se não temos refresh token, usa o access token direto das env vars
  if (!process.env.ZOHO_REFRESH_TOKEN) {
    console.warn('ZOHO_REFRESH_TOKEN não configurado. Usando ZOHO_ACCESS_TOKEN direto (pode expirar).');
    return process.env.ZOHO_ACCESS_TOKEN || '';
  }

  // Renova o token usando o refresh token
  try {
    const tokenResponse = await fetch(
      `https://accounts.zoho.com/oauth/v2/token?refresh_token=${process.env.ZOHO_REFRESH_TOKEN}&client_id=${process.env.ZOHO_CLIENT_ID}&client_secret=${process.env.ZOHO_CLIENT_SECRET}&grant_type=refresh_token`,
      { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        signal: AbortSignal.timeout(60000)
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to refresh Zoho token:', errorText);
      throw new Error('Failed to refresh Zoho token');
    }

    const tokenData = await tokenResponse.json();
    
    // Armazena o novo token em cache
    cachedAccessToken = tokenData.access_token;
    // Define expiração (geralmente 1 hora, deixamos 55min para segurança)
    tokenExpiryTime = Date.now() + 55 * 60 * 1000;
    
    return cachedAccessToken || '';
  } catch (error) {
    console.error('Error refreshing Zoho token:', error);
    // Fallback para o token das env vars
    return process.env.ZOHO_ACCESS_TOKEN || '';
  }
}

// Security: Get client IP for rate limiting
function getClientIP(request: Request): string {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const cloudflare = request.headers.get('cf-connecting-ip');
  
  return cloudflare || real || forwarded?.split(',')[0] || 'unknown';
}

// Remove entradas expiradas. Chamado no caminho da requisição em vez de por
// timer: `setInterval` no escopo de módulo mantinha a instância Fluid acordada
// e consumindo CPU faturada sem nenhuma requisição acontecendo. O mapa é por
// instância e some no reciclo, então varrer sob demanda basta.
function pruneExpired(now: number) {
  rateLimitMap.forEach((data, ip) => {
    if (now > data.resetTime) rateLimitMap.delete(ip);
  });
}

// Security: Check rate limit
function checkRateLimit(ip: string): { allowed: boolean; remainingTime?: number } {
  const now = Date.now();
  pruneExpired(now);
  const clientData = rateLimitMap.get(ip);

  if (!clientData || now > clientData.resetTime) {
    // Reset or create new entry
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
    const remainingTime = Math.ceil((clientData.resetTime - now) / 1000);
    return { allowed: false, remainingTime };
  }

  clientData.count++;
  return { allowed: true };
}

export async function POST(request: Request) {
  try {
    // Security: Rate limiting check
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: `Too many requests. Please try again in ${rateLimitResult.remainingTime} seconds.` 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.remainingTime),
          }
        }
      );
    }

    // 1. Parse and validate the request body with Zod
    const body = await request.json();
    
    // Security: Validate with Zod schema
    const validationResult = ticketSchema.safeParse(body);
    
    if (!validationResult.success) {
      // Return first validation error
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
    const sanitizedData = sanitizeTicketData(validationResult.data);
    const { email: sanitizedEmail, subject: sanitizedSubject, description: sanitizedDescription } = sanitizedData;

    // 2. Validate environment variables
    if (!process.env.ZOHO_API_URL || !process.env.ZOHO_ORG_ID || !process.env.ZOHO_DEPARTMENT_ID) {
      console.error('Missing Zoho environment variables');
      return NextResponse.json(
        { error: 'Server configuration error.' },
        { status: 500 }
      );
    }

    // 3. Obter um access token válido
    const accessToken = await getValidAccessToken();
    
    if (!accessToken) {
      console.error('Failed to obtain valid Zoho access token');
      return NextResponse.json(
        { error: 'Authentication error. Please contact support.' },
        { status: 500 }
      );
    }

    // 4. Assemble the request to the Zoho Desk API with sanitized data
    const zohoResponse = await fetch(process.env.ZOHO_API_URL, {
      method: 'POST',
      headers: {
        // Authenticate using the token we generated
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'orgId': process.env.ZOHO_ORG_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Security: Use sanitized data
        subject: sanitizedSubject,
        description: sanitizedDescription,
        email: sanitizedEmail,
        departmentId: process.env.ZOHO_DEPARTMENT_ID,
        contact: {
          email: sanitizedEmail,
        }
      }),
    });

    // 5. Parse the response from Zoho
    const zohoData = await zohoResponse.json();
    
    // If the response from Zoho is not 'OK' (e.g., auth error, etc.)
    if (!zohoResponse.ok) {
      console.error('Zoho Desk Error:', zohoData);
      
      // Se for erro de OAuth, limpa o cache e tenta novamente na próxima chamada
      if (zohoData.errorCode === 'INVALID_OAUTH') {
        cachedAccessToken = null;
        tokenExpiryTime = null;
      }
      
      // Return a generic error message to the user
      return NextResponse.json(
        { error: 'Failed to create the ticket. Please try again.' },
        { status: 500 }
      );
    }

    // 6. Send a success response back to the frontend
    return NextResponse.json(
      { success: true, ticketId: zohoData.ticketNumber },
      { status: 201 }
    );

  } catch (error) {
    console.error('Internal Server Error:', error);
    
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
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}