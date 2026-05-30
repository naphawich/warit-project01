// Wraps authenticateRequest with an is_admin check.
import { authenticateRequest, adminClient } from "./auth-server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminAuthed = {
  user: { id: string; email: string | undefined };
  supabase: SupabaseClient;     // user-scoped client (RLS applies)
  admin: SupabaseClient;        // service-role client (RLS bypass)
};

export async function authenticateAdmin(
  req: Request
): Promise<AdminAuthed | { error: "unauthorized" | "forbidden" }> {
  const authed = await authenticateRequest(req);
  if (!authed) return { error: "unauthorized" };

  const { data: profile, error } = await authed.supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", authed.user.id)
    .single();

  if (error || !profile?.is_admin) return { error: "forbidden" };

  return {
    user: authed.user,
    supabase: authed.supabase,
    admin: adminClient(),
  };
}
