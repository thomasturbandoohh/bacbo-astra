import { useState } from "react";
import { Lock, Mail, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "./Brand";

function Field({ icon: Icon, label, ...props }: { icon: typeof Mail; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 focus-within:border-primary">
        <Icon className="size-5 shrink-0 text-muted-foreground" />
        <input {...props} className="w-full min-w-0 bg-transparent text-base outline-hidden placeholder:text-muted-foreground" />
      </span>
    </label>
  );
}

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Conta criada! Confirme o seu e-mail e aguarde a aprovação do administrador.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? (err.message === "Invalid login credentials" ? "E-mail ou senha incorretos" : err.message) : "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <Brand />
      <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-extrabold tracking-widest text-primary">
        <ShieldCheck className="size-4" /> ACESSO EXCLUSIVO
      </div>
      <p className="mt-5 text-center text-sm text-muted-foreground">Sinais em tempo real para o Bac Bo ao vivo.</p>

      <div className="mt-8 grid grid-cols-2 rounded-xl bg-card p-1">
        {(["login", "signup"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-lg py-2.5 text-sm font-extrabold tracking-wider ${mode === m ? "bg-secondary text-foreground" : "text-muted-foreground"}`}>
            {m === "login" ? "ENTRAR" : "CRIAR CONTA"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-5">
        {mode === "signup" && <Field icon={User} label="Nome do usuário" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />}
        <Field icon={Mail} label="E-mail" type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field icon={Lock} label="Senha" type="password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-4 text-base font-black tracking-widest text-primary-foreground glow-blue disabled:opacity-60">
          <ShieldCheck className="size-5" /> {busy ? "AGUARDE..." : mode === "login" ? "ENTRAR" : "CADASTRAR"}
        </button>
      </form>
      <p className="mt-6 text-center text-xs text-muted-foreground">Novas contas só têm acesso após aprovação do administrador. Apenas 1 dispositivo por conta.</p>
    </main>
  );
}
