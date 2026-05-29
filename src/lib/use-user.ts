"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, type Profile } from "./supabase";

type State = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
};

export function useUser(): State & { refresh: () => Promise<void> } {
  const [state, setState] = useState<State>({
    user: null,
    profile: null,
    loading: true,
  });

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return (data as Profile) ?? null;
  };

  const refresh = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setState({ user: null, profile: null, loading: false });
      return;
    }
    const profile = await fetchProfile(user.id);
    setState({ user, profile, loading: false });
  };

  useEffect(() => {
    let active = true;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      if (!session?.user) {
        setState({ user: null, profile: null, loading: false });
        return;
      }
      const profile = await fetchProfile(session.user.id);
      if (!active) return;
      setState({ user: session.user, profile, loading: false });
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!active) return;
        if (!session?.user) {
          setState({ user: null, profile: null, loading: false });
          return;
        }
        const profile = await fetchProfile(session.user.id);
        if (!active) return;
        setState({ user: session.user, profile, loading: false });
      }
    );

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { ...state, refresh };
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
