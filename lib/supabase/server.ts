import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server-side Supabase client.
 * Uses the service role key — must NEVER be exposed to the browser.
 * Only import this module from server-side code (API routes, Server Components).
 */
export const supabaseServerClient = createClient(supabaseUrl, supabaseServiceRoleKey);
