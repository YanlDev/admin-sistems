import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // En el navegador, las variables de entorno se exponen directamente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables. Check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set in .env.local'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
