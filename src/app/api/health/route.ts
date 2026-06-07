// Lightweight health check for uptime monitors (UptimeRobot, Better Stack…).
// Verifies the app is up and the database is reachable. Does NOT touch secrets
// or user data, so it's safe to poll publicly.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  let db: "ok" | "down" = "down";
  if (url && key) {
    try {
      const supabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      // Cheap reachability probe: a HEAD-style count on a public table.
      const { error } = await supabase
        .from("courses")
        .select("id", { count: "exact", head: true })
        .limit(1);
      db = error ? "down" : "ok";
    } catch {
      db = "down";
    }
  }

  const healthy = db === "ok";
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      db,
      latency_ms: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
