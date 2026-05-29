"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, type Profile } from "./supabase";

type AuthState = {
  user: User | null;
  profile: Profile | null;
  ownedCourseIds: Set<number>;
  loading: boolean;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

async function fetchUserData(userId: string): Promise<{
  profile: Profile | null;
  ownedCourseIds: Set<number>;
}> {
  // Parallel fetch — one round-trip instead of two sequential calls
  const [profileResult, entitlementsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("user_courses").select("course_id").eq("user_id", userId),
  ]);
  return {
    profile: (profileResult.data as Profile) ?? null,
    ownedCourseIds: new Set(
      (entitlementsResult.data ?? []).map((r) => r.course_id as number)
    ),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ownedCourseIds, setOwnedCourseIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const userIdRef = useRef<string | null>(null);

  const loadFor = useCallback(async (nextUser: User | null) => {
    if (!nextUser) {
      setUser(null);
      setProfile(null);
      setOwnedCourseIds(new Set());
      userIdRef.current = null;
      setLoading(false);
      return;
    }
    setUser(nextUser);
    userIdRef.current = nextUser.id;
    const { profile: p, ownedCourseIds: ids } = await fetchUserData(
      nextUser.id
    );
    // Guard against race: only commit if user hasn't changed during fetch
    if (userIdRef.current !== nextUser.id) return;
    setProfile(p);
    setOwnedCourseIds(ids);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) return;
    const { profile: p, ownedCourseIds: ids } = await fetchUserData(uid);
    if (userIdRef.current !== uid) return;
    setProfile(p);
    setOwnedCourseIds(ids);
  }, []);

  useEffect(() => {
    let active = true;

    // Initial session check
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      await loadFor(session?.user ?? null);
    })();

    // Auth state changes (login/logout/token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!active) return;
        await loadFor(session?.user ?? null);
      }
    );

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadFor]);

  // Realtime: pick up new entitlements (e.g. after webhook grants a course)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`entitlements:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_courses",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newCourseId = (payload.new as { course_id: number }).course_id;
          setOwnedCourseIds((prev) => {
            if (prev.has(newCourseId)) return prev;
            const next = new Set(prev);
            next.add(newCourseId);
            return next;
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const value = useMemo<AuthState>(
    () => ({ user, profile, ownedCourseIds, loading, refresh }),
    [user, profile, ownedCourseIds, loading, refresh]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Fallback for components rendered outside provider (e.g. (auth) routes).
// Returns the same shape with safe defaults so callers don't crash.
const FALLBACK: AuthState = {
  user: null,
  profile: null,
  ownedCourseIds: new Set(),
  loading: false,
  refresh: async () => {},
};

export function useAuth(): AuthState {
  return useContext(Ctx) ?? FALLBACK;
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
