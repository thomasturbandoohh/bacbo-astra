import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  status: "pendente" | "aprovado" | "bloqueado" | "recusado";
  session_id: string | null;
};

type Ctx = {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);
const SID_KEY = "astra_sid";
const ADMIN_EMAIL = "adminbacboastra@gmail.com";

function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const claimed = useRef<string | null>(null);

  const load = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null);
      setIsAdmin(false);
      setReady(true);
      return;
    }
    const uid = s.user.id;
    const isMasterAdmin = isSuperAdminEmail(s.user.email);

    // Single-device logic: Only enforced for regular members.
    // adminbacboastra@gmail.com has unrestricted multi-device access without termination.
    if (!isMasterAdmin && claimed.current !== uid) {
      let sid = localStorage.getItem(SID_KEY);
      if (!sid) {
        sid = crypto.randomUUID();
        localStorage.setItem(SID_KEY, sid);
      }
      await supabase.rpc("claim_session", { _sid: sid });
      claimed.current = uid;
    }

    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,email,status,session_id").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle(),
    ]);

    const resolvedAdmin = isMasterAdmin || !!r;
    const resolvedProfile = (p as Profile) ?? {
      id: uid,
      full_name: s.user.user_metadata?.["full_name"] || (isMasterAdmin ? "Administrador" : "Membro"),
      email: s.user.email || "",
      status: isMasterAdmin ? "aprovado" : "pendente",
      session_id: null,
    };

    // If master admin, guarantee approved status immediately
    if (isMasterAdmin && resolvedProfile.status !== "aprovado") {
      resolvedProfile.status = "aprovado";
    }

    setProfile(resolvedProfile);
    setIsAdmin(resolvedAdmin);
    setReady(true);
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(SID_KEY);
    claimed.current = null;
    await supabase.auth.signOut();
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setTimeout(() => void load(s), 0);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void load(data.session);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  // Poll: check device session. For adminbacboastra@gmail.com, multi-device is unrestricted.
  useEffect(() => {
    if (!session) return;
    const isMasterAdmin = isSuperAdminEmail(session.user.email);

    const id = setInterval(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,email,status,session_id")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!data) return;

      // Regular members: kick this device if another one signed in
      if (!isMasterAdmin && !isAdmin) {
        const local = localStorage.getItem(SID_KEY);
        if (data.session_id && local && data.session_id !== local) {
          toast.error("A sua conta foi aberta noutro dispositivo. Sessão terminada.");
          await signOut();
          return;
        }
      }

      setProfile((prev) => {
        const prof = (data as Profile) ?? prev;
        if (isMasterAdmin) prof.status = "aprovado";
        return prof;
      });
    }, 8000);

    return () => clearInterval(id);
  }, [session, isAdmin, signOut]);

  const refresh = useCallback(() => load(session), [load, session]);

  return <AuthCtx.Provider value={{ ready, session, profile, isAdmin, refresh, signOut }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
}

export function resetDeviceSession() {
  localStorage.setItem(SID_KEY, crypto.randomUUID());
}
