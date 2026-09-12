import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// IMPORTANT: this client uses the service role key and bypasses Row Level
// Security entirely. Only import this file from server-only code (API
// route handlers, Server Components that never expose it to the client).
// Never import this from a "use client" file.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
