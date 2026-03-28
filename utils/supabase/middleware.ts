// @/utils/supabase/middleware.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/orders', '/admin', '/profile'];

export async function updateSession(request: NextRequest, response: NextResponse) {
  const { pathname } = request.nextUrl;

  // Verifica se é rota protegida antes de criar o cliente Supabase
  const isProtectedRoute = protectedRoutes.some((route) => {
    const regex = new RegExp(`^(/[^/]+)?${route}(/|$)`);
    return regex.test(pathname);
  });

  // Rotas públicas: não precisa de auth check, retorna direto
  if (!isProtectedRoute) {
    return response;
  }

  // Só cria cliente e verifica sessão para rotas protegidas
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}