// middleware.ts

import createMiddleware from 'next-intl/middleware';
import {type NextRequest} from 'next/server';
import {routing} from '@/i18n/routing';
import {updateSession} from '@/utils/supabase/middleware';

const handleI18nRouting = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Redirect uppercase product slugs to lowercase (308 Permanent Redirect)
  const productMatch = request.nextUrl.pathname.match(
    /^(\/(?:pt-br\/)?(?:games\/[^/]+\/)?products\/)([^/]+)(\/.*)?$/i
  );
  if (productMatch) {
    const [, prefix, slug, rest = ''] = productMatch;
    if (slug !== slug.toLowerCase()) {
      const url = request.nextUrl.clone();
      url.pathname = prefix + slug.toLowerCase() + rest;
      return Response.redirect(url, 308);
    }
  }

  // Este código SÓ será executado para as rotas que NÃO SÃO de API.
  const response = handleI18nRouting(request);
  
  // Add pathname to headers for layout detection
  response.headers.set('x-pathname', request.nextUrl.pathname);
  
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