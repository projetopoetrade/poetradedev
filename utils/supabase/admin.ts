import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Verifica se um userId é o administrador do sistema.
 * Configure ADMIN_USER_ID no .env.local com o UUID do seu usuário Supabase.
 */
export function isAdmin(userId: string): boolean {
  const adminId = process.env.ADMIN_USER_ID;
  if (!adminId) return false;
  return userId === adminId;
}

/**
 * Cria um cliente Supabase com privilégios administrativos usando a SERVICE_ROLE_KEY
 * 
 * ATENÇÃO: Este cliente bypassa Row Level Security (RLS)!
 * 
 * Use este cliente APENAS em:
 * - Webhooks externas (ex: Stripe) onde não há usuário autenticado
 * - Operações administrativas do servidor que precisam de acesso total
 * - APIs internas que não têm contexto de usuário
 * 
 * NUNCA use este cliente em:
 * - Código do cliente (browser)
 * - Operações baseadas em ações do usuário onde RLS deve ser aplicado
 * - Rotas de API que retornam dados diretamente para usuários
 */
export const createAdminClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não está definido");
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não está definido. " +
      "Esta chave é necessária para operações administrativas que bypassam RLS."
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

