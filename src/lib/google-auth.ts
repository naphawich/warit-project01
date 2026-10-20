"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

// Only allow same-site relative paths as the post-login destination, so a
// crafted ?next= can't bounce users to another site.
function safeNext(next: string): string {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

// Redirects the browser to Google. After consent, Supabase sends the user back
// to `next` with the session in the URL, which the Supabase client picks up on
// load (detectSessionInUrl). The redirect target must be listed under
// Authentication → URL Configuration → Redirect URLs in Supabase.
export async function signInWithGoogle(next: string) {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}${safeNext(next)}` },
  });
}

// Whether the Google provider is switched on in Supabase. Lets the button stay
// in its "coming soon" state until the dashboard is configured, instead of
// sending users to Supabase's raw "provider is not enabled" error.
export function useGoogleAuthEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((s: { external?: { google?: boolean } } | null) => {
        if (active) setEnabled(Boolean(s?.external?.google));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return enabled;
}

// Supabase reports OAuth failures (e.g. the user cancelled on Google's screen)
// as error/error_description in the query string or hash of the return URL.
export function readOAuthError(): string | null {
  const error =
    new URLSearchParams(window.location.search).get("error") ??
    new URLSearchParams(window.location.hash.slice(1)).get("error");
  if (!error) return null;
  return error === "access_denied"
    ? "ยกเลิกการเข้าสู่ระบบด้วย Google แล้ว"
    : "เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
}
