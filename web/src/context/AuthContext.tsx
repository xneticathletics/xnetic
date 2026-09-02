import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { resetCurrentUserCache } from "../lib/api/currentUser";

export type UserRole =
  | "super_admin"
  | "club_admin"
  | "coach"
  | "parent"
  | "athlete";

// Web paneli yalnızca yönetim rollerine açık — antrenör/veli/sporcu mobil
// uygulamayı kullanmaya devam ediyor. ("Muhasebe" rolü mobil uygulamadan
// kaldırıldığı için buradan da kaldırıldı.)
export const WEB_ALLOWED_ROLES: UserRole[] = ["club_admin", "super_admin"];

type AuthState = {
  session: Session | null;
  role: UserRole | null;
  clubId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

// JWT payload'ını çözer. Supabase Auth Hook, custom_access_token_hook ile
// club_id ve role claim'lerini access token'a ekler (bkz. supabase/002_auth_claims_hook.sql
// — mobil uygulamadaki AuthContext.tsx ile birebir aynı mantık).
function decodeJwtPayload(accessToken: string): Record<string, unknown> {
  try {
    const base64 = accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const claims = useMemo(
    () => (session?.access_token ? decodeJwtPayload(session.access_token) : {}),
    [session?.access_token]
  );

  const value: AuthState = {
    session,
    role: (claims.app_role as UserRole) ?? null,
    clubId: (claims.club_id as string) ?? null,
    loading,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    signOut: async () => {
      await supabase.auth.signOut();
      resetCurrentUserCache();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalı");
  return ctx;
}
