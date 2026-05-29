"use client";

import { useAuth, getInitials as getInitialsFromCtx } from "./auth-context";

// `loading` reflects the auth gate only (session check). Profile may still
// be fetching in the background, but `user` is already authoritative.
export function useUser() {
  const { user, profile, authLoading, refresh } = useAuth();
  return { user, profile, loading: authLoading, refresh };
}

export const getInitials = getInitialsFromCtx;
