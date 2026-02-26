"use server";
import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Product, Build } from "@/lib/interface";

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

  // Add log to help diagnose performance
  console.log("Connecting to Google OAuth...");

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

  // Add log to help diagnose performance
  console.log("Connecting to Discord OAuth...");

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

export const getProductsByVersionAndLeague = async (
  gameVersion: string,
  league: string,
  difficulty: string
): Promise<Product[]> => {
  const supabase = await createClient();
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

export const getLeagues = async (gameVersion: 'path-of-exile-1' | 'path-of-exile-2') => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('leagues')
    .select('*')
    .eq('gameVersion', gameVersion)
    .eq('isActive', true)

  if (error) {
    console.error('Error fetching leagues:', error.message);
    throw new Error('Could not fetch leagues');
  }

  return data;
};

export const getAllActiveLeagues = async (): Promise<{ name: string; gameVersion: string }[]> => {
  const supabase = await createClient();
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

export const getLeagueBySlugFromSupabase = async (
  leagueSlug: string,
  gameVersion: string
): Promise<{ name: string; gameVersion: string } | null> => {
  const supabase = await createClient();
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

export const getProductsWithParams = async (
  params: {
    gameVersion?: string;
    league?: string;
    difficulty?: string;
    category?: string;
    search?: string;
    isListed?: boolean;
    orderByPrice?: 'asc' | 'desc';
  }
): Promise<Product[]> => {
  const { gameVersion, league, difficulty, category, search, isListed, orderByPrice } = params;
  const supabase = await createClient();

  let query = supabase.from('products').select('*');

  if (isListed !== undefined) query = query.eq('is_listed', isListed);
  if (gameVersion) query = query.eq('gameVersion', gameVersion);
  if (league) query = query.eq('league', league);
  if (difficulty) query = query.eq('difficulty', difficulty);
  if (category) query = query.ilike('category', category);
  if (search) query = query.ilike('name', `%${search}%`);
  if (orderByPrice) query = query.order('price', { ascending: orderByPrice === 'asc' });

  const { data, error } = await query;

  if (error) {
    console.error('[getProductsWithParams] Error:', error.message);
    throw new Error('Could not fetch products');
  }

  return data as Product[];
};

export const getDifficulties = async (gameVersion: 'path-of-exile-1' | 'path-of-exile-2') => {
  const supabase = await createClient();
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

export const getBuilds = async (params: {
  gameVersion?: string;
  league?: string;
  class?: string;
  ascendancy?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ builds: Build[]; total: number }> => {
  const { gameVersion, league, class: poeClass, ascendancy, tags, search, page = 1, limit = 12 } = params;
  const supabase = await createClient();

  let query = supabase
    .from('builds')
    .select('*', { count: 'exact' })
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (gameVersion) query = query.eq('game_version', gameVersion);
  if (league) query = query.eq('league', league);
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

export const getBuildBySlug = async (slug: string): Promise<Build | null> => {
  const supabase = await createClient();
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

export const getPublishedBuildSlugs = async (): Promise<string[]> => {
  // Uses admin client (no cookies) — safe for generateStaticParams / build-time calls
  const { createAdminClient } = await import('@/utils/supabase/admin');
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('builds')
    .select('slug')
    .eq('is_published', true);

  return (data || []).map((b) => b.slug);
};

export const getRelatedBuilds = async (
  currentSlug: string,
  limit: number = 3,
  options?: { class?: string; ascendancy?: string }
): Promise<Build[]> => {
  const supabase = await createClient();
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


