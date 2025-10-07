# Como Adicionar a Coluna `paid_at` ao Supabase

## 🚨 Problema Identificado

A coluna `paid_at` não existe na tabela `orders` do Supabase, por isso os valores não estão sendo salvos.

## ✅ Solução

Execute a migration SQL criada em `supabase/migrations/20241007000000_add_paid_at_to_orders.sql` no seu banco de dados.

## 📝 Como Aplicar

### Opção 1: Supabase Dashboard (Recomendado para testes)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral esquerdo)
4. Clique em **New Query**
5. Cole o seguinte SQL:

```sql
-- Adicionar coluna paid_at à tabela orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Adicionar índice para consultas por paid_at
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders(paid_at);

-- Adicionar comentário para documentação
COMMENT ON COLUMN orders.paid_at IS 'Data e hora em que o pagamento foi confirmado (ISO 8601)';
```

6. Clique em **Run** (ou pressione `Ctrl+Enter`)
7. Verifique se a mensagem de sucesso aparece

### Opção 2: Supabase CLI (Recomendado para produção)

Se você está usando Supabase CLI para migrations:

```bash
# Certificar que está linkado ao projeto
npx supabase link

# Aplicar a migration
npx supabase db push
```

### Opção 3: Copiar o SQL da Migration

Copie o conteúdo de `supabase/migrations/20241007000000_add_paid_at_to_orders.sql` e execute diretamente no SQL Editor do Supabase.

## 🧪 Verificar se Funcionou

Após executar a migration, verifique se a coluna foi criada:

```sql
-- Verificar colunas da tabela orders
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
```

Você deve ver a coluna `paid_at` com tipo `timestamp with time zone`.

## 📊 Logs Adicionados

Os seguintes logs foram adicionados para debug:

### No Webhook (`app/api/webhooks/abacatepay/route.ts`):
- `🕐 Generating paid_at timestamp`
- `📦 Payment data prepared`
- `🔄 Calling updateOrder with paid_at`

### Na API de Update (`app/api/orders/update/route.ts`):
- `📝 Updating order with` (JSON completo)
- `🕐 paid_at value being sent to Supabase`
- `🕐 paid_at type`
- `📊 Supabase update result` (incluindo `paid_at_in_result`)

## 🔍 Como Debugar

1. Faça um pagamento PIX de teste
2. Verifique os logs no console do servidor
3. Procure pelos emojis acima nos logs
4. Verifique se `paid_at` está sendo:
   - Gerado no webhook ✅
   - Enviado para a API de update ✅
   - Recebido pela API de update ✅
   - Salvo no Supabase ✅

Se algum desses passos falhar, os logs detalhados irão mostrar onde está o problema.

## ⚠️ Importante

- A migration usa `ADD COLUMN IF NOT EXISTS`, então é seguro executar múltiplas vezes
- O índice `idx_orders_paid_at` melhora a performance de consultas por data de pagamento
- A coluna é opcional (`NULL` permitido) para não afetar orders antigas

