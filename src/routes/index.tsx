import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { AuthScreen } from "@/components/astra/AuthScreen";
import { StatusScreen } from "@/components/astra/StatusScreen";
import { Dashboard } from "@/components/astra/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BAC BO ASTRA — Sinais em tempo real" },
      { name: "description", content: "Sinais de Bac Bo ao vivo com radar em tempo real e histórico de assertividade." },
      { property: "og:title", content: "BAC BO ASTRA" },
      { property: "og:description", content: "Sinais de Bac Bo ao vivo com radar em tempo real." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { ready, session, profile, isAdmin } = useAuth();
  if (!ready) return <div className="flex min-h-screen items-center justify-center text-sm font-bold text-muted-foreground">A carregar...</div>;
  if (!session) return <AuthScreen />;
  if (!isAdmin && profile?.status !== "aprovado") return <StatusScreen />;
  return <Dashboard />;
}
