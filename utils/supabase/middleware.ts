// @/utils/supabase/middleware.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest, response: NextResponse) {
  // O cliente Supabase é criado como antes
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Verificamos a sessão e obtemos os dados do usuário
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- INÍCIO DA LÓGICA DE PROTEÇÃO DE ROTAS ---

// 1. Defina as rotas que você quer proteger (sem o prefixo de idioma).
// A lógica vai funcionar para qualquer idioma (ex: /pt/dashboard, /en/dashboard)
const protectedRoutes = ['/orders', '/admin', '/profile'];

// 2. Obtenha o pathname da requisição. Ele já virá com o idioma, ex: "/pt/dashboard"
const { pathname } = request.nextUrl;

// 3. Verifique se o pathname atual corresponde a uma rota protegida.
// Usamos .some() e .endsWith() para ignorar o prefixo de idioma.
const isProtectedRoute = protectedRoutes.some((route) => {
  // Cria uma regex dinâmica. Ex para /admin: converte para /\/admin(\/|$)/
  const regex = new RegExp(`^(/[^/]+)?${route}(/|$)`);
  return regex.test(pathname);
});

// 4. Se for uma rota protegida E o usuário NÃO estiver logado...
if (isProtectedRoute && !user) {
  // ... sua lógica de redirect (mantida igual) ...
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/auth/login';
  redirectUrl.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(redirectUrl);
}

// --- FIM DA LÓGICA DE PROTEÇÃO ---
  // Se a rota não for protegida ou o usuário estiver logado,
  // apenas retorna a `response` original para continuar o fluxo.
  return response;
}