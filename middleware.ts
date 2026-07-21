// middleware.ts

import createMiddleware from 'next-intl/middleware';
import {type NextRequest} from 'next/server';
import {routing} from '@/i18n/routing';
import {updateSession} from '@/utils/supabase/middleware';

const handleI18nRouting = createMiddleware(routing);

// Constante de módulo: dentro da função a regex era recompilada a cada request.
const PRODUCT_SLUG_PATH =
  /^(\/(?:pt-br\/)?(?:games\/[^/]+\/)?products\/)([^/]+)(\/.*)?$/i;

export async function middleware(request: NextRequest) {
  // Redirect uppercase product slugs to lowercase (308 Permanent Redirect)
  const productMatch = request.nextUrl.pathname.match(PRODUCT_SLUG_PATH);
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

  // Não injetar headers de request aqui. O `x-pathname` existia para o layout
  // raiz ler via `headers()` e decidir admin vs site — acoplamento que tornava
  // todas as rotas dinâmicas. A distinção agora é estrutural (route groups).

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