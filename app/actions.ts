"use server";
import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { createPublicClient } from "@/utils/supabase/public";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Product, Build } from "@/lib/interface";
import { isPermanentLeague } from "@/lib/leagues";
import { unstable_cache } from "next/cache";
import { DB_TAGS, DB_CACHE_TTL } from "@/lib/cache-tags";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/auth/sign-up",
      "Email and password are required",
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/auth/sign-up", error.message);
  } else {
    return redirect(`/verify-email?email=${encodeURIComponent(email)}`);
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/auth/login", error.message);
  }

  // Force redirect to home page
  return redirect("/");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin") || "http://localhost:3000";
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return redirect("/forgot-password?error=Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?type=recovery&next=${encodeURIComponent('/auth/callback?redirect_to=/reset-password')}`,
  });

  if (error) {
    console.error("Password reset error:", error.message);
    return redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return redirect("/forgot-password?message=Check your email for a link to reset your password");
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return redirect("/reset-password?error=Password and confirm password are required");
  }

  if (password !== confirmPassword) {
    return redirect("/reset-password?error=Passwords do not match");
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return redirect("/reset-password?error=Password update failed");
  }

  return redirect("auth/login?message=Password updated successfully. Please sign in with your new password.");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("auth/login");
};

export const signWithGoogle = async () => {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");


  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?redirect_to=/`,
    },
  })
  if (data.url) {
    redirect(data.url)
  }
}

export const signWithDiscord = async () => {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");


  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: `${origin}/auth/callback?redirect_to=/`,
    }
  })
  if (data.url) {
    redirect(data.url)
  }
}

export const getProducts = async (): Promise<Product[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from('products').select('*');

  if (error) {
    console.error('Error fetching products:', error.message);
    throw new Error('Could not fetch products');
  }

  return data as Product[];
};

const getProductsByVersionAndLeagueUncached = async (
  gameVersion: string,
  league: string,
  difficulty: string
): Promise<Product[]> => {
  // Client publico (sem cookies): `unstable_cache` nao permite ler cookies
  // dentro do escopo cacheado, e o dado aqui e publico de qualquer forma.
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('gameVersion', gameVersion)
    .eq('league', league)
    .eq('difficulty', difficulty);

  if (error) {
    console.error('Error fetching filtered products:', error.message);
    throw new Error('Could not fetch filtered products');
  }

  return data as Product[];
};

export const newProduct = async (product: Product) => {
  // Import do admin client feito no topo do arquivo
  const { createAdminClient } = await import('@/utils/supabase/admin');
  const supabase = createAdminClient();

  // Verificar se já existe um produto com o mesmo nome na mesma liga
  const { data: existingProduct, error: checkError } = await supabase
    .from('products')
    .select('id, name, league')
    .eq('name', product.name)
    .eq('league', product.league)
    .eq('gameVersion', product.gameVersion)
    .eq('difficulty', product.difficulty)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(`Erro ao verificar duplicatas: ${checkError.message}`);
  }

  if (existingProduct) {
    throw new Error(`Já existe um produto com o nome "${product.name}" na liga "${product.league}" (${product.gameVersion} - ${product.difficulty})`);
  }

  const { error } = await supabase
    .from('products')
    .insert({
      name: product.name,
      category: product.category,
      slug: product.slug,
      gameVersion: product.gameVersion,
      league: product.league,
      price: product.price,
      imgUrl: product.imgUrl,
      difficulty: product.difficulty,
      alt: product.alt,
    });

  if (error) {
    throw new Error(error.message);
  }
};

const getLeaguesUncached = async (gameVersion: 'path-of-exile-1' | 'path-of-exile-2') => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .eq('gameVersion', gameVersion)
    .eq('isActive', true)
    // Sem ORDER BY o Postgres devolve em ordem arbitrária, e quem consome
    // `leagues[0]` acaba pegando uma liga diferente a cada regeneração de
    // página. Ordenar por id decrescente coloca a liga criada por último —
    // a mais nova — em primeiro, que é o padrão desejado em toda virada.
    .order('id', { ascending: false })

  if (error) {
    console.error('Error fetching leagues:', error.message);
    throw new Error('Could not fetch leagues');
  }

  return data;
};

/**
 * Returns the current temp league name for the given game version, or null
 * when the leagues table only has permanent variants (e.g., between leagues).
 * Backed by `getLeagues` so a fresh active row picked up by the admin
 * dashboard automatically becomes the new default.
 */
export const getCurrentTempLeague = async (
  gameVersion: 'path-of-exile-1' | 'path-of-exile-2',
): Promise<string | null> => {
  try {
    const leagues = await getLeagues(gameVersion);
    const temp = (leagues ?? []).find(
      (l: { name?: string }) => l?.name && !isPermanentLeague(l.name),
    );
    return temp?.name ?? null;
  } catch {
    return null;
  }
};

const getAllActiveLeaguesUncached = async (): Promise<{ name: string; gameVersion: string }[]> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('leagues')
    .select('name, gameVersion')
    .eq('isActive', true);

  if (error) {
    console.error('Error fetching all leagues:', error.message);
    return [];
  }
  return data || [];
};

const getLeagueBySlugFromSupabaseUncached = async (
  leagueSlug: string,
  gameVersion: string
): Promise<{ name: string; gameVersion: string } | null> => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('leagues')
    .select('name, gameVersion')
    .eq('gameVersion', gameVersion)
    .eq('isActive', true);

  const league = (data || []).find(
    (l) => l.name.toLowerCase().replace(/\s+/g, '-') === leagueSlug
  );
  return league || null;
};

const getProductsWithParamsUncached = async (
  params: {
    gameVersion?: string;
    league?: string;
    difficulty?: string;
    category?: string;
    search?: string;
    slug?: string;
    urlSlug?: string;
    isListed?: boolean;
    orderByPrice?: 'asc' | 'desc';
  }
): Promise<Product[]> => {
  const { gameVersion, league, difficulty, category, search, slug, urlSlug, isListed, orderByPrice } = params;
  const supabase = createPublicClient();

  let query = supabase.from('products').select('*');

  if (isListed !== undefined) query = query.eq('is_listed', isListed);
  if (gameVersion) query = query.eq('gameVersion', gameVersion);
  if (league) query = query.eq('league', league);
  if (difficulty) query = query.eq('difficulty', difficulty);
  if (category) query = query.ilike('category', category);
  // url_slug é o slug canônico curto (sem liga) usado na URL/sitemap
  if (urlSlug) query = query.eq('url_slug', urlSlug);
  // slug embute a liga; chave compartilhada com Sanity/histórico de preço
  if (slug) query = query.eq('slug', slug);
  if (search && typeof search === 'string') query = query.ilike('name', `%${search.replace(/\s+/g, '%')}%`);
  if (orderByPrice) query = query.order('price', { ascending: orderByPrice === 'asc' });

  const { data, error } = await query;

  if (error) {
    console.error('[getProductsWithParams] Error:', error.message);
    throw new Error('Could not fetch products');
  }

  return data as Product[];
};

const getDifficultiesUncached = async (gameVersion: 'path-of-exile-1' | 'path-of-exile-2') => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('difficulties')
    .select('*')
    .eq('gameVersion', gameVersion);

  if (error) {
    console.error('Error fetching difficulties:', error.message);
    throw new Error('Could not fetch difficulties');
  }

  return data;
};

// --- Builds ---

const getBuildsUncached = async (params: {
  gameVersion?: string;
  league?: string;
  leagueSlug?: string;
  class?: string;
  ascendancy?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ builds: Build[]; total: number }> => {
  const { gameVersion, league, leagueSlug, class: poeClass, ascendancy, tags, search, page = 1, limit = 12 } = params;
  // Client publico (sem cookies): ler cookies aqui tornava dinamica toda pagina
  // que chama esta funcao, matando o ISR de /builds. Dado e publico
  // (is_published = true), entao a leitura anonima e a correta.
  const supabase = createPublicClient();

  let query = supabase
    .from('builds')
    .select('*', { count: 'exact' })
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (gameVersion) query = query.eq('game_version', gameVersion);
  if (league) query = query.eq('league', league);
  // leagueSlug converte "keepers-of-the-flame" → ilike "keepers of the flame"
  if (leagueSlug) query = query.ilike('league', leagueSlug.replace(/-/g, ' '));
  if (poeClass) query = query.eq('class', poeClass);
  if (ascendancy) query = query.eq('ascendancy', ascendancy);
  if (tags && tags.length > 0) query = query.overlaps('tags', tags);
  if (search) query = query.ilike('title', `%${search}%`);

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('[getBuilds] Error:', error.message);
    throw new Error('Could not fetch builds');
  }

  return { builds: (data as Build[]) || [], total: count || 0 };
};

const getDistinctBuildLeaguesUncached = async (): Promise<string[]> => {
  // Client publico (sem cookies): ler cookies aqui tornava dinamica toda pagina
  // que chama esta funcao, matando o ISR de /builds. Dado e publico
  // (is_published = true), entao a leitura anonima e a correta.
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('builds')
    .select('league')
    .eq('is_published', true)
    .not('league', 'is', null);

  if (!data) return [];
  return Array.from(new Set(data.map((b) => b.league).filter(Boolean) as string[])).sort();
};

const getBuildBySlugUncached = async (slug: string): Promise<Build | null> => {
  // Client publico (sem cookies): ler cookies aqui tornava dinamica toda pagina
  // que chama esta funcao, matando o ISR de /builds. Dado e publico
  // (is_published = true), entao a leitura anonima e a correta.
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('builds')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error) return null;
  return data as Build;
};

export const getBuildsAdmin = async (): Promise<Build[]> => {
  const { createAdminClient } = await import('@/utils/supabase/admin');
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('builds')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getBuildsAdmin] Error:', error.message);
    throw new Error('Could not fetch builds');
  }

  return (data as Build[]) || [];
};

const getPublishedBuildSlugsUncached = async (): Promise<string[]> => {
  // Uses admin client (no cookies) — safe for generateStaticParams / build-time calls
  const { createAdminClient } = await import('@/utils/supabase/admin');
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('builds')
    .select('slug')
    .eq('is_published', true);

  return (data || []).map((b) => b.slug);
};

const getPublishedLeagueSlugsFromBuildsUncached = async (): Promise<string[]> => {
  // Uses admin client — safe for generateStaticParams / build-time calls
  const { createAdminClient } = await import('@/utils/supabase/admin');
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('builds')
    .select('league')
    .eq('is_published', true)
    .not('league', 'is', null);

  // The `league` field stores display names (e.g. "Keepers of the Flame").
  // Slugify them so generateStaticParams returns valid URL segments.
  const slugify = (name: string) =>
    name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const allLeagues = (data || []).map((b) => b.league).filter(Boolean) as string[];
  const uniqueSlugs = Array.from(new Set(allLeagues.map(slugify)));
  return uniqueSlugs;
};

const getRelatedBuildsUncached = async (
  currentSlug: string,
  limit: number = 3,
  options?: { class?: string; ascendancy?: string }
): Promise<Build[]> => {
  // Client publico (sem cookies): `unstable_cache` nao permite ler cookies
  // dentro do escopo cacheado, e o dado aqui e publico de qualquer forma.
  const supabase = createPublicClient();
  let query = supabase
    .from('builds')
    .select('*')
    .eq('is_published', true)
    .neq('slug', currentSlug)
    .order('created_at', { ascending: false })
    .limit(limit * 2);

  if (options?.ascendancy) query = query.eq('ascendancy', options.ascendancy);
  else if (options?.class) query = query.eq('class', options.class);

  const { data } = await query;
  const builds = (data as Build[]) || [];
  return builds.slice(0, limit);
};

export const getRandomBuilds = async (params: {
  gameVersion?: string;
  league?: string;
  class?: string;
  ascendancy?: string;
  tags?: string[];
  onlyLeagueStarters?: boolean;
  difficulty?: string;
  budget?: string;
}): Promise<Build[]> => {
  const {
    gameVersion,
    league,
    class: poeClass,
    ascendancy,
    tags,
    onlyLeagueStarters,
    difficulty,
    budget,
  } = params;
  const supabase = await createClient();

  let query = supabase
    .from('builds')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (gameVersion) query = query.eq('game_version', gameVersion);
  if (league) query = query.eq('league', league);
  if (poeClass) query = query.eq('class', poeClass);
  if (ascendancy) query = query.eq('ascendancy', ascendancy);
  if (difficulty) query = query.eq('difficulty', difficulty);
  if (budget) query = query.eq('budget', budget);

  let filterTags = tags || [];
  if (onlyLeagueStarters && !filterTags.includes('league-starter')) {
    filterTags = [...filterTags, 'league-starter'];
  }

  if (filterTags.length > 0) {
    query = query.contains('tags', filterTags);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[getRandomBuilds] Error:', error.message);
    throw new Error('Could not fetch random builds');
  }

  return (data as Build[]) || [];
};


// --- Orders ---

export const getUserOrders = async (): Promise<import('@/types').Order[]> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (data as import('@/types').Order[]) || [];
};

export const getOrderById = async (id: string): Promise<import('@/types').Order | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) return null;
  return data as import('@/types').Order;
};

// ─── Data Cache (Supabase) ────────────────────────────────────────────────────
//
// Antes daqui, nenhuma leitura do Supabase era cacheada: `supabase-js` usa fetch
// sem `next.revalidate`, então o único frescor vinha do `revalidate = 300` de
// página. Isso significava que cada passada de bot numa página vencida gerava
// uma regeneração — e uma ISR Write. Com ~2k caminhos (388 produtos × 2 locales
// + rotas /games), era isso que estourava a cota da Vercel.
//
// Agora a invalidação é por evento: as rotas admin em `/api/admin/*` chamam
// `revalidateTag(DB_TAGS.*)` depois de cada mutação, e o TTL em `DB_CACHE_TTL`
// é só a rede de segurança para escritas feitas fora do Next.
//
// Os wrappers exportados são `async` de propósito: este arquivo é `"use server"`,
// e o compilador só aceita exportar funções async declaradas — o valor devolvido
// por `unstable_cache()` é uma call expression e seria rejeitado.

const getProductsByVersionAndLeagueCached = unstable_cache(
  getProductsByVersionAndLeagueUncached,
  ["products-by-version-and-league"],
  { tags: [DB_TAGS.products], revalidate: DB_CACHE_TTL.products },
);
export const getProductsByVersionAndLeague = async (
  ...args: Parameters<typeof getProductsByVersionAndLeagueUncached>
) => getProductsByVersionAndLeagueCached(...args);

const getProductsWithParamsCached = unstable_cache(
  getProductsWithParamsUncached,
  ["products-with-params"],
  { tags: [DB_TAGS.products], revalidate: DB_CACHE_TTL.products },
);
export const getProductsWithParams = async (
  ...args: Parameters<typeof getProductsWithParamsUncached>
) => getProductsWithParamsCached(...args);

const getLeaguesCached = unstable_cache(
  getLeaguesUncached,
  ["leagues"],
  { tags: [DB_TAGS.leagues], revalidate: DB_CACHE_TTL.leagues },
);
export const getLeagues = async (
  ...args: Parameters<typeof getLeaguesUncached>
) => getLeaguesCached(...args);

const getAllActiveLeaguesCached = unstable_cache(
  getAllActiveLeaguesUncached,
  ["all-active-leagues"],
  { tags: [DB_TAGS.leagues], revalidate: DB_CACHE_TTL.leagues },
);
export const getAllActiveLeagues = async (
  ...args: Parameters<typeof getAllActiveLeaguesUncached>
) => getAllActiveLeaguesCached(...args);

const getLeagueBySlugFromSupabaseCached = unstable_cache(
  getLeagueBySlugFromSupabaseUncached,
  ["league-by-slug"],
  { tags: [DB_TAGS.leagues], revalidate: DB_CACHE_TTL.leagues },
);
export const getLeagueBySlugFromSupabase = async (
  ...args: Parameters<typeof getLeagueBySlugFromSupabaseUncached>
) => getLeagueBySlugFromSupabaseCached(...args);

// `difficulties` é reescrita junto com as ligas na virada, então compartilha a
// tag — despublicar/criar liga já joga fora as duas leituras de uma vez.
const getDifficultiesCached = unstable_cache(
  getDifficultiesUncached,
  ["difficulties"],
  { tags: [DB_TAGS.leagues], revalidate: DB_CACHE_TTL.leagues },
);
export const getDifficulties = async (
  ...args: Parameters<typeof getDifficultiesUncached>
) => getDifficultiesCached(...args);

const getBuildsCached = unstable_cache(
  getBuildsUncached,
  ["builds"],
  { tags: [DB_TAGS.builds], revalidate: DB_CACHE_TTL.builds },
);
export const getBuilds = async (
  ...args: Parameters<typeof getBuildsUncached>
) => getBuildsCached(...args);

const getDistinctBuildLeaguesCached = unstable_cache(
  getDistinctBuildLeaguesUncached,
  ["distinct-build-leagues"],
  { tags: [DB_TAGS.builds], revalidate: DB_CACHE_TTL.builds },
);
export const getDistinctBuildLeagues = async (
  ...args: Parameters<typeof getDistinctBuildLeaguesUncached>
) => getDistinctBuildLeaguesCached(...args);

const getBuildBySlugCached = unstable_cache(
  getBuildBySlugUncached,
  ["build-by-slug"],
  { tags: [DB_TAGS.builds], revalidate: DB_CACHE_TTL.builds },
);
export const getBuildBySlug = async (
  ...args: Parameters<typeof getBuildBySlugUncached>
) => getBuildBySlugCached(...args);

const getPublishedBuildSlugsCached = unstable_cache(
  getPublishedBuildSlugsUncached,
  ["published-build-slugs"],
  { tags: [DB_TAGS.builds], revalidate: DB_CACHE_TTL.builds },
);
export const getPublishedBuildSlugs = async (
  ...args: Parameters<typeof getPublishedBuildSlugsUncached>
) => getPublishedBuildSlugsCached(...args);

const getPublishedLeagueSlugsFromBuildsCached = unstable_cache(
  getPublishedLeagueSlugsFromBuildsUncached,
  ["published-league-slugs-from-builds"],
  { tags: [DB_TAGS.builds], revalidate: DB_CACHE_TTL.builds },
);
export const getPublishedLeagueSlugsFromBuilds = async (
  ...args: Parameters<typeof getPublishedLeagueSlugsFromBuildsUncached>
) => getPublishedLeagueSlugsFromBuildsCached(...args);

const getRelatedBuildsCached = unstable_cache(
  getRelatedBuildsUncached,
  ["related-builds"],
  { tags: [DB_TAGS.builds], revalidate: DB_CACHE_TTL.builds },
);
export const getRelatedBuilds = async (
  ...args: Parameters<typeof getRelatedBuildsUncached>
) => getRelatedBuildsCached(...args);
