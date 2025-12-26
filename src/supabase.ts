import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function getSupabase(env: Env): SupabaseClient {
	return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}
