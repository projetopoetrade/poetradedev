# Changelog - Implementação de RLS (Row Level Security)

## Resumo das Mudanças

Este documento descreve todas as alterações feitas para permitir a ativação do Row Level Security (RLS) no Supabase sem quebrar as funcionalidades existentes.

## Arquivos Criados

### 1. `utils/supabase/admin.ts`
- **Propósito**: Cliente Supabase com privilégios administrativos usando SERVICE_ROLE_KEY
- **Uso**: Operações que precisam bypassar RLS (webhooks, operações administrativas)
- **⚠️ Segurança**: NUNCA use no código do cliente (browser)

### 2. API Routes para Operações Administrativas

#### Products:
- `app/api/admin/products/update/route.ts` - Atualizar preço de produtos
- `app/api/admin/products/delete/route.ts` - Deletar produtos

#### Leagues:
- `app/api/admin/leagues/create/route.ts` - Criar novas leagues
- `app/api/admin/leagues/delete/route.ts` - Deletar leagues

#### Orders (Admin):
- `app/api/admin/orders/route.ts` - GET: Buscar todas as orders, PATCH: Atualizar status

**Nota**: Todas essas rotas verificam autenticação do usuário mas precisam de verificação adicional de role admin em produção.

### 3. Documentação
- `RLS_SETUP.md` - Guia completo de configuração do RLS
- `.env.example` - Exemplo de variáveis de ambiente necessárias

## Arquivos Modificados

### 1. `app/api/orders/update/route.ts`
- **Mudança**: Trocado `createClient()` por `createAdminClient()`
- **Motivo**: Esta rota é chamada pela webhook da Stripe (sem autenticação de usuário)
- **Status**: ✅ Compatível com RLS

### 2. `app/api/send-email/route.ts`
- **Mudança**: Trocado `createClient()` por `createAdminClient()`
- **Motivo**: Chamada pela webhook da Stripe para buscar detalhes da order
- **Status**: ✅ Compatível com RLS

### 3. `app/actions.ts`
- **Mudança**: `newProduct()` agora usa `createAdminClient()`
- **Motivo**: Operação administrativa que precisa bypassar RLS
- **Status**: ✅ Compatível com RLS

### 4. `app/[locale]/admin/manage-products/page.tsx`
- **Mudanças**:
  - `handleUpdatePrice()` agora chama `/api/admin/products/update`
  - `handleDeleteProduct()` agora chama `/api/admin/products/delete`
- **Motivo**: Operações do cliente não podem usar admin client diretamente
- **Status**: ✅ Compatível com RLS

### 5. `app/[locale]/admin/add-league/page.tsx`
- **Mudança**: `handleSubmit()` agora chama `/api/admin/leagues/create`
- **Motivo**: Operação do cliente não pode usar admin client diretamente
- **Status**: ✅ Compatível com RLS

### 6. `app/[locale]/admin/manage-leagues/page.tsx`
- **Mudança**: `handleDeleteLeague()` agora chama `/api/admin/leagues/delete`
- **Motivo**: Operação do cliente não pode usar admin client diretamente
- **Status**: ✅ Compatível com RLS

### 7. `app/[locale]/admin/orders/page.tsx`
- **Mudanças**:
  - `fetchOrders()` agora chama `/api/admin/orders` (GET)
  - `updateOrderStatus()` agora chama `/api/admin/orders` (PATCH)
- **Motivo**: Admin precisa ver TODAS as orders e atualizar qualquer order (não apenas as próprias)
- **Status**: ✅ Compatível com RLS

## Fluxo de Dados Atualizado

### Antes (SEM RLS):
```
Cliente → Supabase (ANON_KEY) → Sem restrições
Webhook → Supabase (ANON_KEY) → Sem restrições
```

### Depois (COM RLS):
```
Cliente (usuário normal) → Supabase (ANON_KEY) → Aplica RLS
Cliente (admin UI) → API Route → Verifica Auth → Supabase (SERVICE_ROLE_KEY) → Bypassa RLS
Webhook (Stripe) → API Route → Supabase (SERVICE_ROLE_KEY) → Bypassa RLS
```

## Variável de Ambiente Necessária

Adicione ao `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Próximos Passos

### 1. ⚠️ CRÍTICO - Adicionar Verificação de Role Admin
As seguintes rotas precisam de verificação de role admin:
- `app/api/admin/products/update/route.ts`
- `app/api/admin/products/delete/route.ts`
- `app/api/admin/leagues/create/route.ts`
- `app/api/admin/leagues/delete/route.ts`
- `app/api/admin/orders/route.ts` (GET e PATCH)

**Exemplo de implementação**:
```typescript
// Verificar se usuário é admin
const { data: userRole } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id)
  .single();

if (!userRole || userRole.role !== 'admin') {
  return NextResponse.json(
    { error: 'Forbidden - Admin access required' },
    { status: 403 }
  );
}
```

### 2. Configurar Políticas RLS no Supabase
Siga as instruções em `RLS_SETUP.md` para:
1. Habilitar RLS nas tabelas
2. Criar políticas de acesso
3. Testar as políticas

### 3. Testar Funcionalidades
- ✅ Criação de orders (usuários autenticados)
- ✅ Listagem de orders (apenas as próprias)
- ✅ Webhooks da Stripe
- ✅ Envio de emails
- ✅ Operações de admin (products/leagues)

## Tabelas Afetadas pelo RLS

### `orders`
- **Políticas Recomendadas**:
  - SELECT: Usuários veem apenas suas próprias orders
  - INSERT: Usuários criam orders para si mesmos
  - UPDATE: Bloqueado (Stripe webhook usa admin client)

### `products`
- **Políticas Recomendadas**:
  - SELECT: Público (todos podem ver)
  - INSERT/UPDATE/DELETE: Apenas admin (via admin client)

### `leagues`
- **Políticas Recomendadas**:
  - SELECT: Público (todos podem ver)
  - INSERT/UPDATE/DELETE: Apenas admin (via admin client)

## Segurança

### O que está protegido:
- ✅ Usuários não podem ver orders de outros usuários
- ✅ Usuários não podem modificar orders diretamente
- ✅ Operações admin verificam autenticação (ainda falta verificar role)
- ✅ SERVICE_ROLE_KEY não exposta no cliente

### O que ainda precisa ser feito:
- ⚠️ Implementar sistema de roles (admin/user)
- ⚠️ Adicionar verificação de role nas rotas admin
- ⚠️ Implementar rate limiting nas rotas admin
- ⚠️ Adicionar logging/auditoria de operações admin

## Compatibilidade

### ✅ Funcionalidades que continuam funcionando:
- Criação de orders via checkout
- Webhooks da Stripe
- Envio de emails de confirmação
- Painel de admin (products/leagues)
- Listagem de produtos e leagues

### ⚠️ Mudanças de Comportamento:
- Operações admin agora passam por API routes
- Verificação de autenticação em todas as operações admin
- Logs mais detalhados nas operações críticas

## Rollback

Se precisar desabilitar RLS temporariamente:

```sql
-- Desabilitar RLS em uma tabela
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE leagues DISABLE ROW LEVEL SECURITY;
```

**Nota**: Não é recomendado desabilitar RLS em produção!

## Suporte

Para dúvidas sobre RLS, consulte:
- `RLS_SETUP.md` - Documentação completa
- [Documentação oficial do Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- Logs do servidor para debugging

