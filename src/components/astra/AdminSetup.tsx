import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { setupAdmin } from "@/lib/astra.functions";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "./Brand";

export function AdminSetup({ onDone }: { onDone: () => void }) {
  const run = useServerFn(setupAdmin);
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.password !== f.confirm) { toast.error("As senhas não coincidem"); return; }
    setBusy(true);
    const r = await run({ data: { name: f.name, email: f.email, password: f.password } }).catch((err: Error) => ({ ok: false, error: err.message }));
    if (!r.ok) {
      setBusy(false);
      toast.error(r.error ?? "Erro");
      return;
    }
    await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
    toast.success("Administrador configurado!");
    onDone();
  }
  const inp = "w-full rounded-xl border border-border bg-card px-4 py-3.5 text-base outline-hidden focus:border-primary";
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Brand />
      <h2 className="mt-8 text-center text-xl font-black">PRIMEIRO ACESSO DO ADM</h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">Defina agora os dados e a senha do administrador.</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input className={inp} placeholder="Nome" required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className={inp} type="email" placeholder="E-mail do ADM" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input className={inp} type="password" placeholder="Nova senha (mín. 8)" required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <input className={inp} type="password" placeholder="Confirmar senha" required minLength={8} value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} />
        <button disabled={busy} className="w-full rounded-xl bg-brand py-4 font-black tracking-widest text-primary-foreground glow-blue disabled:opacity-60">DEFINIR SENHA E ENTRAR</button>
      </form>
    </main>
  );
}
