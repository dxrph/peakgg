import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const __g = globalThis as any;
const AuthContext: React.Context<AuthContextType | undefined> =
  __g.__peakgg_AuthContext ??
  (__g.__peakgg_AuthContext = createContext<AuthContextType | undefined>(undefined));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
  };

  // Detect Supabase refresh-token errors and purge corrupted local session
  const isRefreshTokenError = (err: any) => {
    const msg = (err?.message || err?.error_description || err?.name || "").toString().toLowerCase();
    const code = (err?.code || err?.error || "").toString().toLowerCase();
    return (
      msg.includes("refresh_token_not_found") ||
      msg.includes("invalid refresh token") ||
      msg.includes("refresh token not found") ||
      msg.includes("refresh token already used") ||
      code === "refresh_token_not_found" ||
      code === "invalid_grant"
    );
  };

  const handleInvalidRefresh = async () => {
    const wasSignedIn = Boolean((window as any).__peakgg_was_signed_in);
    try {
      // Local-only sign out: clears the corrupted token from storage without
      // hitting the network (which would fail again with the bad token).
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // ignore
    }
    setSession(null);
    setUser(null);
    setProfile(null);
    (window as any).__peakgg_was_signed_in = false;
    if (wasSignedIn && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login?expired=1";
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const wasSignedIn = Boolean((window as any).__peakgg_was_signed_in);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          (window as any).__peakgg_was_signed_in = true;
          setTimeout(() => fetchProfile(session.user.id), 500);
        } else {
          setProfile(null);
          // Supabase emits SIGNED_OUT when a refresh fails with an invalid token,
          // and TOKEN_REFRESHED with a null session when the refresh chain is broken.
          if (
            wasSignedIn &&
            (_event === "TOKEN_REFRESHED" || _event === "SIGNED_OUT")
          ) {
            (window as any).__peakgg_was_signed_in = false;
            if (!window.location.pathname.startsWith("/login")) {
              window.location.href = "/login?expired=1";
            }
          }
        }
        setLoading(false);
      }
    );

    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error && isRefreshTokenError(error)) {
          handleInvalidRefresh().finally(() => setLoading(false));
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          (window as any).__peakgg_was_signed_in = true;
          fetchProfile(session.user.id);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (isRefreshTokenError(err)) {
          handleInvalidRefresh().finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });

    // Global safety net: catch refresh errors thrown by background auto-refresh
    const onUnhandled = (e: PromiseRejectionEvent) => {
      if (isRefreshTokenError(e.reason)) {
        e.preventDefault();
        handleInvalidRefresh();
      }
    };
    window.addEventListener("unhandledrejection", onUnhandled);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("unhandledrejection", onUnhandled);
    };
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: username },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const signInWithGoogle = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/dashboard",
      });
      if (result.error) return { error: result.error };
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
