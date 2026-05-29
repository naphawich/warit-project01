// Server helper: authenticate a request using the Authorization: Bearer header
// and return a Supabase client that's scoped to that user (RLS applies).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !anonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or _PUBLISHABLE_KEY");
}

export type AuthedRequest = {
  user: { id: string; email: string | undefined };
  supabase: SupabaseClient;
};

export async function authenticateRequest(
  req: Request
): Promise<AuthedRequest | null> {
  const header = req.headers.get("authorization");
  const token = header?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  // Per-request client so the Authorization header is sent on every query
  const supabase = createClient(url!, anonKey!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return {
    user: { id: data.user.id, email: data.user.email },
    supabase,
  };
}

// Service-role client (bypasses RLS). Use ONLY in webhook / server-only paths.
export function adminClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(url!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
