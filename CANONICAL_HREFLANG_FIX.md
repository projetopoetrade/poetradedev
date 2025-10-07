# Correção dos Problemas de Canonical e Hreflang

## Problemas Identificados

1. **URLs inconsistentes**: O site tinha URLs hardcoded com `https://pathoftrade.net` (sem www) em diversos lugares, enquanto o canonical estava configurado com `https://www.pathoftrade.net` (com www).

2. **Canonical mal configurado**: O canonical não estava sendo gerado corretamente para o locale padrão (en).

3. **Structured Data com URLs hardcoded**: Os dados estruturados (schema.org) tinham URLs fixas que não correspondiam à URL base configurada.

## Correções Implementadas

### 1. Função `buildCanonical()` (lib/utils.ts)
- Adicionada remoção de trailing slashes para URLs canônicos
- Mantém trailing slash apenas para a raiz "/"
- Garante URLs absolutas consistentes

### 2. Layout Principal (app/[locale]/layout.tsx)
- Corrigida a lógica de geração de canonical
- Para locale "en": usa "/" 
- Para outros locales: usa "/{locale}"
- Garante consistência entre canonical e hreflang

### 3. URLs Hardcoded Corrigidas

#### app/[locale]/page.tsx
- Substituídas URLs fixas por `process.env.NEXT_PUBLIC_SITE_URL`
- Atualizado structured data para usar variável de ambiente

#### app/[locale]/(site)/products/page.tsx
- Corrigida a geração da URL base para catálogo
- Corrigidas URLs de produtos individuais no structured data
- URLs agora respeitam o locale correto

#### app/[locale]/(site)/products/[name]/page.tsx
- Corrigida URL do produto no structured data
- Corrigida URL da organização vendedora
- URLs agora incluem o locale quando necessário

## Melhores Práticas Implementadas

### 1. Consistência de URLs
- **Sempre use** `process.env.NEXT_PUBLIC_SITE_URL` para URLs absolutas
- **Nunca hardcode** URLs completas no código
- Garanta que todas as URLs (canonical, hreflang, og:url, structured data) usem a mesma base

### 2. Gerenciamento de Locales
```typescript
// Para gerar paths corretos baseados no locale
const path = locale === 'en' ? '/rota' : `/${locale}/rota`;
```

### 3. URLs Canônicos
- Use a função `buildCanonical()` para gerar URLs canônicos
- Nunca inclua query params no canonical (a menos que sejam essenciais)
- Remova trailing slashes (exceto para raiz)

### 4. Hreflang
- Sempre forneça todas as versões de locale
- Inclua x-default apontando para o locale padrão
- Garanta que os caminhos sejam consistentes com a estrutura de rotas

## Como Configurar Corretamente

### 1. Variável de Ambiente
Certifique-se de que `NEXT_PUBLIC_SITE_URL` está definida corretamente:

```env
NEXT_PUBLIC_SITE_URL=https://www.pathoftrade.net
```

**Importante**: 
- Decida se vai usar `www` ou não
- Use SEMPRE a mesma convenção em todo o site
- Não coloque trailing slash no final

### 2. Verificação no Google Search Console
Após o deploy, verifique:
1. **Inspeção de URL**: Verifique se o canonical está correto
2. **Cobertura de Índice**: Verifique se não há conflitos de canonical
3. **Internacionalização**: Verifique se os hreflang estão corretos

### 3. Teste Local
Para testar localmente, execute:

```bash
# View page source e procure por:
<link rel="canonical" href="..." />
<link rel="alternate" hreflang="..." href="..." />

# Certifique-se de que:
# 1. Todas as URLs usam a mesma base (com ou sem www)
# 2. O canonical não tem trailing slash (exceto raiz)
# 3. Todos os hreflang apontam para URLs válidas
```

## Problemas Comuns e Como Evitá-los

### ❌ Errado
```typescript
const url = "https://pathoftrade.net/products";
```

### ✅ Correto
```typescript
const url = `${process.env.NEXT_PUBLIC_SITE_URL}/products`;
```

### ❌ Errado (canonical com trailing slash)
```
https://www.pathoftrade.net/products/
```

### ✅ Correto
```
https://www.pathoftrade.net/products
```

### ❌ Errado (www inconsistente)
```html
<link rel="canonical" href="https://www.pathoftrade.net/products" />
<!-- Mas no structured data: -->
"url": "https://pathoftrade.net/products"
```

### ✅ Correto (sempre consistente)
```html
<link rel="canonical" href="https://www.pathoftrade.net/products" />
<!-- E no structured data: -->
"url": "https://www.pathoftrade.net/products"
```

## Impacto SEO

Essas correções vão:
- ✅ Eliminar confusão de canonicalização para o Google
- ✅ Melhorar a indexação correta das páginas
- ✅ Garantir que o link juice seja consolidado na URL correta
- ✅ Evitar conteúdo duplicado
- ✅ Melhorar a experiência de internacionalização

## Próximos Passos

1. **Deploy das alterações**
2. **Aguarde 24-48h** para o Google reprocessar
3. **Verifique no Search Console** se os warnings desapareceram
4. **Solicite reindexação** de páginas importantes
5. **Configure redirect 301** de `pathoftrade.net` para `www.pathoftrade.net` (ou vice-versa) no servidor/CDN se ainda não estiver configurado

## Redirect 301 Recomendado

Para garantir que sempre use www (ou não-www), configure no seu servidor/CDN:

### Vercel (vercel.json)
```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "pathoftrade.net"
        }
      ],
      "destination": "https://www.pathoftrade.net/:path*",
      "permanent": true
    }
  ]
}
```

Isso garante que qualquer acesso sem www seja redirecionado para www automaticamente.
