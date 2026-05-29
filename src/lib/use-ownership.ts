"use client";

import { useAuth } from "./auth-context";

// Returns the set of course IDs the current user owns, or null while loading.
export function useOwnedCourseIds(): Set<number> | null {
  const { ownedCourseIds, loading } = useAuth();
  if (loading) return null;
  return ownedCourseIds;
}

// Convenience for a single course
export function useIsCourseOwned(courseId: number): {
  owned: boolean;
  loading: boolean;
} {
  const { ownedCourseIds, loading } = useAuth();
  if (loading) return { owned: false, loading: true };
  return { owned: ownedCourseIds.has(courseId), loading: false };
}
