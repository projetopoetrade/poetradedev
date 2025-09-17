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
const isProtectedRoute = protectedRoutes.some((route) => pathname.endsWith(route));

// 4. Se for uma rota protegida E o usuário NÃO estiver logado...
if (isProtectedRoute && !user) {
  // Clona a URL original para manter o idioma e outros parâmetros.
  const redirectUrl = request.nextUrl.clone();

  // Define o novo caminho para a página de login.
  // O prefixo de idioma (ex: /pt) será mantido.
  redirectUrl.pathname = '/auth/login';
  console.log('redirectUrl', redirectUrl);

  // Adiciona o pathname original que o usuário tentou acessar como callback.
  redirectUrl.searchParams.set('callbackUrl', pathname);

  // Redireciona o usuário para a página de login com o callback.
  return NextResponse.redirect(redirectUrl);
}

// --- FIM DA LÓGICA DE PROTEÇÃO ---
  // Se a rota não for protegida ou o usuário estiver logado,
  // apenas retorna a `response` original para continuar o fluxo.
  return response;
}