"use server";
import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Product } from "@/lib/interface";

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
  const supabase = await createClient();
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

export const getProductsWithParams = async (
  params: {
    gameVersion?: string;
    league?: string;
    difficulty?: string;
    category?: string;
    search?: string;
  }
): Promise<Product[]> => {
  const { gameVersion, league, difficulty, category, search } = params;
  const supabase = await createClient();
  
  let query = supabase.from('products').select('*');
  
  if (gameVersion) {
    query = query.eq('gameVersion', gameVersion);
  }
  
  if (league) {
    query = query.eq('league', league);
  }
  
  if (difficulty) {
    query = query.eq('difficulty', difficulty);
  }
  
  if (category) {
    query = query.eq('category', category);
  }
  
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching products with params:', error.message);
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


