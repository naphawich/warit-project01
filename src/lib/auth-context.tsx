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
  // True until the initial getSession() resolves (user identity is known).
  // Once false, `user` is the source of truth (null = logged out).
  authLoading: boolean;
  // True while profile + entitlements are being fetched. Independent so
  // navbar can render the logged-in state without waiting for the data tier.
  entitlementsLoading: boolean;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

async function fetchUserData(userId: string): Promise<{
  profile: Profile | null;
  ownedCourseIds: Set<number>;
}> {
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
  const [authLoading, setAuthLoading] = useState(true);
  const [entitlementsLoading, setEntitlementsLoading] = useState(true);

  const userIdRef = useRef<string | null>(null);

  const loadFor = useCallback(async (nextUser: User | null) => {
    if (!nextUser) {
      setUser(null);
      setProfile(null);
      setOwnedCourseIds(new Set());
      userIdRef.current = null;
      setAuthLoading(false);
      setEntitlementsLoading(false);
      return;
    }

    const prevUserId = userIdRef.current;
    userIdRef.current = nextUser.id;
    setUser(nextUser);
    // Release the auth gate immediately so navbar / route guards stop showing
    // the "logged out" UI while we go fetch profile + entitlements.
    setAuthLoading(false);

    // If we're still on the same user (e.g. token refresh), keep showing
    // the cached profile/entitlements — no flicker.
    if (prevUserId === nextUser.id) return;

    setEntitlementsLoading(true);
    const { profile: p, ownedCourseIds: ids } = await fetchUserData(
      nextUser.id
    );
    // Guard against race: user may have changed during fetch
    if (userIdRef.current !== nextUser.id) return;
    setProfile(p);
    setOwnedCourseIds(ids);
    setEntitlementsLoading(false);
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

    // onAuthStateChange fires INITIAL_SESSION on subscribe, so it covers
    // both the initial load and subsequent login/logout events.
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

  // Realtime: pick up entitlements granted server-side (e.g. by the Omise webhook)
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
    () => ({
      user,
      profile,
      ownedCourseIds,
      authLoading,
      entitlementsLoading,
      refresh,
    }),
    [user, profile, ownedCourseIds, authLoading, entitlementsLoading, refresh]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Fallback for components rendered outside provider (e.g. (auth) routes).
const FALLBACK: AuthState = {
  user: null,
  profile: null,
  ownedCourseIds: new Set(),
  authLoading: false,
  entitlementsLoading: false,
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
