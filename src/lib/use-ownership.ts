"use client";

import { useAuth } from "./auth-context";

// Returns the set of owned course IDs, or null while the data tier is still
// loading. Logged-out users get an empty set (not null).
export function useOwnedCourseIds(): Set<number> | null {
  const { ownedCourseIds, authLoading, entitlementsLoading, user } = useAuth();
  if (authLoading) return null;
  if (!user) return new Set();
  if (entitlementsLoading) return null;
  return ownedCourseIds;
}

export function useIsCourseOwned(courseId: number): {
  owned: boolean;
  loading: boolean;
} {
  const ids = useOwnedCourseIds();
  if (ids === null) return { owned: false, loading: true };
  return { owned: ids.has(courseId), loading: false };
}
