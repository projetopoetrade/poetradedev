// middleware.ts

import createMiddleware from 'next-intl/middleware';
import {type NextRequest} from 'next/server';
import {routing} from '@/i18n/routing';
import {updateSession} from '@/utils/supabase/middleware';

const handleI18nRouting = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Este código SÓ será executado para as rotas que NÃO SÃO de API.
  const response = handleI18nRouting(request);
  return await updateSession(request, response);
}

export const config = {
  // Este matcher garante que o middleware NUNCA execute para suas rotas de API.
  matcher: [
    /*
     * Corresponde a todos os caminhos de requisição, exceto aqueles que começam com:
     * - /api/ -> IGNORA TODAS AS ROTAS DE API (incluindo o webhook)
     * - /_next/static -> Arquivos estáticos
     * - /_next/image -> Otimização de imagem
     * - qualquer arquivo com uma extensão (ex: favicon.ico)
     */
    '/((?!api/|_next/static|_next/image|.*\\..*).*)'
  ],
};  