import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// IMPORTANT: this client uses the service role key and bypasses Row Level
// Security entirely. Only import this file from server-only code (API
// route handlers, Server Components that never expose it to the client).
// Never import this from a "use client" file.
//
// Deliberately untyped (no <Database> generic): the strict generic can
// make certain chained .select()/.eq() queries collapse to `never` at
// build time depending on exact select-string shape, which breaks the
// production build. This client is only used server-side for a handful
// of simple, well-understood queries, so trading compile-time column
// checking for a build that reliably passes is the right call here.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
