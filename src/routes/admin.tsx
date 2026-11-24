import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthScreen } from "@/components/astra/AuthScreen";
import { AdminSetup } from "@/components/astra/AdminSetup";
import { AdminPanel } from "@/components/astra/AdminPanel";

const ADMIN_EMAILS = ["adminbacboastra@gmail.com", "thomasturbandoohh@gmail.com"];

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel ADM — BAC BO ASTRA" },
      { name: "description", content: "Área restrita de administração." },
      { property: "og:title", content: "Painel ADM — BAC BO ASTRA" },
      { property: "og:description", content: "Área restrita de administração." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { ready, session, isAdmin, refresh } = useAuth();
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);

  const userEmail = session?.user?.email?.toLowerCase().trim();
  const isMasterAdmin = !!userEmail && ADMIN_EMAILS.includes(userEmail);

  useEffect(() => {
    void supabase.rpc("admin_exists").then(({ data }) => setHasAdmin(!!data));
  }, []);

  if (!ready || (hasAdmin === null && !isMasterAdmin)) {
    return <div className="flex min-h-screen items-center justify-center text-sm font-bold text-muted-foreground">A carregar...</div>;
  }

  // Master admin bypasses all setup screens and goes straight in
  if (isMasterAdmin) {
    return <AdminPanel />;
  }

  if (!hasAdmin && !session) {
    return <AdminSetup onDone={() => { setHasAdmin(true); void refresh(); }} />;
  }

  if (!session) return <AuthScreen />;

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-xl font-black">ACESSO RESTRITO</p>
        <p className="text-sm text-muted-foreground">Esta área é exclusiva para administradores da plataforma.</p>
        <Link to="/" className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">Voltar</Link>
      </main>
    );
  }

  return <AdminPanel />;
}
