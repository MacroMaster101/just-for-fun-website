"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

/** Minimal profile shape shared app-wide (name + avatar live in the DB,
 * not in Supabase auth metadata, so any avatar/name edit must flow through
 * here for the header/menu to update without a full page refresh). */
export interface AuthProfile {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  onlineUserIds: Set<string>;
  profile: AuthProfile | null;
  /** Re-fetch the current user's profile (call after editing name/avatar). */
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  onlineUserIds: new Set(),
  profile: null,
  refreshProfile: async () => {},
  signOut: async () => {},
});

type PresenceMeta = {
  user_id?: unknown;
};

type PresenceState = Record<string, PresenceMeta[]>;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  // Fetch (or re-fetch) the current user's profile. /api/profile GET is an
  // idempotent upsert, so this both seeds the row and returns the latest
  // name/avatar. Exposed via context so the modal can refresh the header
  // pill + dropdown immediately after an avatar/name change.
  const refreshProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (!res.ok) return;
      const { profile } = await res.json();
      if (profile) {
        setProfile({
          id: profile.id,
          name: profile.name ?? null,
          avatarUrl: profile.avatarUrl ?? null,
        });
      }
    } catch {
      // Non-fatal — components fall back to auth metadata.
    }
  }, []);

  useEffect(() => {
    const client = supabase();
    let mounted = true;

    // Seed the user's Profile row server-side the first time we observe
    // them logged in. This is what feeds the public Crew Wall — without
    // it, members who never open their profile modal would be invisible.
    // /api/profile GET is idempotent (upsert), so calling more than once
    // is harmless. Cheap network ping, fire-and-forget.
    let seededFor: string | null = null;
    const seedProfile = (userId: string | null) => {
      if (!userId) {
        seededFor = null;
        setProfile(null);
        return;
      }
      if (seededFor === userId) return;
      seededFor = userId;
      // Seeds the row AND populates the shared profile (name/avatar).
      refreshProfile().catch(() => {
        seededFor = null;
      });
    };

    client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      seedProfile(data.session?.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
      seedProfile(newSession?.user?.id ?? null);
    });

    // Let any component request a profile refresh by dispatching this event
    // (the ProfileModal fires it after saving name/avatar).
    const onProfileUpdated = () => {
      void refreshProfile();
    };
    window.addEventListener("profile-updated", onProfileUpdated);

    // bfcache guard: whenever the page is restored from the back/forward
    // cache, React state is frozen at whatever it was when the user
    // navigated away — this includes a stuck LoadingScreen or a stale
    // OAuth "PLEASE WAIT..." modal. Force a fresh navigation so the whole
    // tree re-mounts and Supabase picks up any new session cookies.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("profile-updated", onProfileUpdated);
    };
  }, [refreshProfile]);

  useEffect(() => {
    const client = supabase();
    const channel = user?.id
      ? client.channel("crew-wall-presence", {
          config: { presence: { key: user.id } },
        })
      : client.channel("crew-wall-presence");

    const syncPresence = () => {
      const state = channel.presenceState() as PresenceState;
      const ids = new Set<string>();

      for (const [presenceKey, presences] of Object.entries(state)) {
        if (presenceKey) ids.add(presenceKey);
        for (const presence of presences) {
          if (typeof presence.user_id === "string" && presence.user_id) {
            ids.add(presence.user_id);
          }
        }
      }

      setOnlineUserIds(ids);
    };

    channel
      .on("presence", { event: "sync" }, syncPresence)
      .on("presence", { event: "join" }, syncPresence)
      .on("presence", { event: "leave" }, syncPresence)
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        if (user?.id) {
          void channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
        syncPresence();
      });

    const refreshPresence = () => {
      if (document.visibilityState !== "visible" || !user?.id) return;
      void channel.track({
        user_id: user.id,
        online_at: new Date().toISOString(),
      });
    };

    document.addEventListener("visibilitychange", refreshPresence);

    return () => {
      document.removeEventListener("visibilitychange", refreshPresence);
      if (user?.id) void channel.untrack();
      void client.removeChannel(channel);
    };
  }, [user?.id]);

  const signOut = useCallback(async () => {
    await supabase().auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      onlineUserIds,
      profile,
      refreshProfile,
      signOut,
    }),
    [user, session, loading, onlineUserIds, profile, refreshProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
