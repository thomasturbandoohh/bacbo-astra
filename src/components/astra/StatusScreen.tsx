import { Clock, Ban, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Brand } from "./Brand";

export function StatusScreen() {
  const { profile, signOut } = useAuth();
  const pending = profile?.status === "pendente" || !profile;
  const Icon = pending ? Clock : Ban;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <Brand />
      <div className={`mt-10 flex size-20 items-center justify-center rounded-full border-2 ${pending ? "border-primary text-primary glow-blue" : "border-destructive text-destructive glow-red"}`}>
        <Icon className="size-9" />
      </div>
      <h2 className="mt-6 text-2xl font-black">{pending ? "AGUARDANDO APROVAÇÃO" : profile?.status === "bloqueado" ? "ACESSO BLOQUEADO" : "ACESSO RECUSADO"}</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        {pending ? "A sua conta foi criada. Assim que o administrador aprovar, os sinais serão libertados automaticamente." : "Entre em contacto com o suporte para mais informações."}
      </p>
      <button onClick={() => void signOut()} className="mt-8 inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-bold">
        <LogOut className="size-4" /> Sair
      </button>
    </main>
  );
}
