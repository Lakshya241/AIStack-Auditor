import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser-side Supabase client.
 * Uses the public anon key — safe to expose in the browser.
 */
export const supabaseBrowserClient = createClient(supabaseUrl, supabaseAnonKey);
