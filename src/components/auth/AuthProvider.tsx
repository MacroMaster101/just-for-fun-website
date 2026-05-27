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

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  onlineUserIds: Set<string>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  onlineUserIds: new Set(),
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
      if (!userId || seededFor === userId) return;
      seededFor = userId;
      fetch("/api/profile", { cache: "no-store" }).catch(() => {
        // Reset so we'll retry on the next auth state change.
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
    };
  }, []);

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
    () => ({ user, session, loading, onlineUserIds, signOut }),
    [user, session, loading, onlineUserIds, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
