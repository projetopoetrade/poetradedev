# Configuração de Row Level Security (RLS) no Supabase

Este documento explica como configurar o Row Level Security (RLS) no Supabase para garantir a segurança dos dados sem quebrar as funcionalidades existentes.

## ⚠️ Importante

O projeto agora usa **dois tipos de clientes Supabase**:

1. **Cliente Normal** (`utils/supabase/server.ts` e `client.ts`) - Usa `ANON_KEY` e respeita RLS
2. **Cliente Admin** (`utils/supabase/admin.ts`) - Usa `SERVICE_ROLE_KEY` e **bypassa RLS**

## Variável de Ambiente Necessária

Adicione esta variável ao seu `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

> **⚠️ ATENÇÃO**: A `SERVICE_ROLE_KEY` bypassa todas as políticas RLS. NUNCA exponha esta chave no código do cliente ou em logs públicos!

Você pode encontrar esta chave em:
- Supabase Dashboard → Project Settings → API → `service_role` key (secret)

## Onde Cada Cliente é Usado

### Cliente Admin (bypassa RLS)
Usado em:
- ✅ `app/api/orders/update/route.ts` - Webhooks da Stripe
- ✅ `app/api/send-email/route.ts` - Envio de emails via webhook

### Cliente Normal (respeita RLS)
Usado em:
- ✅ `app/api/orders/route.ts` - Criar/listar orders do usuário autenticado
- ✅ `app/api/create/route.ts` - Criar checkout (usuário autenticado)
- ✅ `app/actions.ts` - Server actions (contexto de usuário)
- ✅ Todos os componentes do cliente

## Políticas RLS Recomendadas

### Tabela: `orders`

```sql
-- 1. Habilitar RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 2. Permitir que usuários vejam apenas suas próprias orders
CREATE POLICY "Users can view their own orders"
ON orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Permitir que usuários criem suas próprias orders
CREATE POLICY "Users can create their own orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Opcional: Permitir que usuários atualizem apenas suas orders pendentes
-- (Comentada porque a Stripe precisa atualizar via admin client)
-- CREATE POLICY "Users can update their pending orders"
-- ON orders
-- FOR UPDATE
-- TO authenticated
-- USING (auth.uid() = user_id AND status = 'pending')
-- WITH CHECK (auth.uid() = user_id);
```

### Tabela: `products`

```sql
-- 1. Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. Permitir leitura pública (produtos são visíveis para todos)
CREATE POLICY "Public can view products"
ON products
FOR SELECT
TO public
USING (true);

-- 3. Apenas admins podem criar/editar produtos (se você tiver sistema de roles)
-- Opção A: Se você tiver uma tabela de admins ou roles
CREATE POLICY "Admins can manage products"
ON products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Opção B: Se não tiver sistema de roles, use admin client em app/actions.ts
-- Neste caso, não crie política de INSERT/UPDATE/DELETE para produtos
```

### Tabela: `leagues`

```sql
-- 1. Habilitar RLS
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

-- 2. Permitir leitura pública
CREATE POLICY "Public can view leagues"
ON leagues
FOR SELECT
TO public
USING (true);

-- 3. Apenas admins podem gerenciar leagues (similar a products)
```

### Tabela: `currency_rates` (se existir)

```sql
-- 1. Habilitar RLS
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;

-- 2. Permitir leitura pública
CREATE POLICY "Public can view currency rates"
ON currency_rates
FOR SELECT
TO public
USING (true);

-- 3. Apenas sistema pode atualizar (use admin client)
```

## Verificação de Segurança

### ✅ O que está protegido com RLS:
- Usuários só podem ver suas próprias orders
- Usuários só podem criar orders para si mesmos
- Produtos/leagues são públicos (apenas leitura)

### ✅ O que continua funcionando sem RLS (via admin client):
- Webhooks da Stripe podem atualizar orders
- Envio de emails pode buscar detalhes das orders
- Sistema pode gerenciar produtos/leagues

## Testando RLS

### 1. Testar criação de order
```typescript
// Deve funcionar: usuário autenticado cria sua própria order
const { data, error } = await supabase
  .from('orders')
  .insert({ user_id: user.id, ...otherData });
```

### 2. Testar leitura de orders
```typescript
// Deve funcionar: usuário vê suas próprias orders
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', user.id);

// Deve FALHAR: usuário tentando ver orders de outros
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', 'outro-user-id'); // Retorna vazio ou erro
```

### 3. Testar webhook
```bash
# Simule uma chamada de webhook da Stripe
curl -X PATCH http://localhost:3000/api/orders/update \
  -H "Content-Type: application/json" \
  -d '{"orderId": "...", "status": "waiting_delivery"}'

# Deve funcionar porque usa admin client
```

## Rotas que Precisam de Atenção

### Se você criar novas rotas de API:

1. **Se a rota é chamada por usuários autenticados** → Use `createClient()` (respeita RLS)
2. **Se a rota é chamada por webhooks/sistemas externos** → Use `createAdminClient()` (bypassa RLS)

### Exemplo:
```typescript
// ✅ Rota de usuário
import { createClient } from "@/utils/supabase/server";
export async function GET(req: Request) {
  const supabase = await createClient(); // Respeita RLS
  const { data: { user } } = await supabase.auth.getUser();
  // ...
}

// ✅ Webhook externa
import { createAdminClient } from "@/utils/supabase/admin";
export async function POST(req: Request) {
  const supabase = createAdminClient(); // Bypassa RLS
  // ... atualizar dados sem contexto de usuário
}
```

## Troubleshooting

### Erro: "new row violates row-level security policy"
- Você está tentando inserir dados sem autenticação ou para outro usuário
- Verifique se `auth.uid()` está correto e corresponde ao `user_id`

### Erro: "SUPABASE_SERVICE_ROLE_KEY não está definido"
- Adicione a variável ao `.env.local`
- Reinicie o servidor de desenvolvimento

### Webhooks da Stripe falhando após ativar RLS
- Verifique se `app/api/orders/update/route.ts` está usando `createAdminClient()`
- Verifique se `app/api/send-email/route.ts` está usando `createAdminClient()`

## Próximos Passos

1. ✅ Adicione `SUPABASE_SERVICE_ROLE_KEY` ao `.env.local`
2. ✅ Execute os comandos SQL acima no Supabase SQL Editor
3. ✅ Teste criação de orders via interface
4. ✅ Teste webhook da Stripe (use Stripe CLI ou dashboard)
5. ✅ Verifique que usuários não conseguem ver orders de outros

## Segurança Adicional

### Recomendações:
1. Use HTTPS em produção (obrigatório para webhooks)
2. Configure webhook secrets da Stripe corretamente
3. Monitore logs de acesso ao Supabase
4. Revise políticas RLS regularmente
5. Nunca exponha `SERVICE_ROLE_KEY` no código do cliente
6. Use variáveis de ambiente diferentes para dev/prod

### Auditoria:
```sql
-- Ver todas as políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';

-- Ver tabelas com RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

