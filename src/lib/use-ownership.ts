"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useUser } from "./use-user";

// Returns the set of course IDs the current user owns.
// Returns null while loading.
export function useOwnedCourseIds(): Set<number> | null {
  const { user, loading: userLoading } = useUser();
  const [ids, setIds] = useState<Set<number> | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setIds(new Set());
      return;
    }
    let active = true;

    const load = async () => {
      const { data } = await supabase
        .from("user_courses")
        .select("course_id")
        .eq("user_id", user.id);
      if (!active) return;
      setIds(new Set((data ?? []).map((r) => r.course_id as number)));
    };
    load();

    // Realtime: pick up newly granted courses
    const channel = supabase
      .channel(`user_courses:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_courses",
          filter: `user_id=eq.${user.id}`,
        },
        load
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user, userLoading]);

  return ids;
}

// Convenience for a single course
export function useIsCourseOwned(courseId: number): {
  owned: boolean;
  loading: boolean;
} {
  const ids = useOwnedCourseIds();
  if (ids === null) return { owned: false, loading: true };
  return { owned: ids.has(courseId), loading: false };
}
