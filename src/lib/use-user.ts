"use client";

import { useAuth, getInitials as getInitialsFromCtx } from "./auth-context";

// Backwards-compatible shape; reads from a single shared context.
export function useUser() {
  const { user, profile, loading, refresh } = useAuth();
  return { user, profile, loading, refresh };
}

export const getInitials = getInitialsFromCtx;
