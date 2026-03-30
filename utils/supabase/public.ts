import { createClient } from "@supabase/supabase-js";

// This client DOES NOT read cookies, so it can be safely called during
// Next.js Static Generation (SSG) in generateStaticParams or forced-static routes.
// Supabase-js natively ignores cookies and performs anonymous requests.
export const createPublicClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
