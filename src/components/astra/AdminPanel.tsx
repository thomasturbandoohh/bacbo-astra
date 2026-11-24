import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Ban, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sendTelegramTest } from "@/lib/astra.functions";
import { renderTemplate } from "@/lib/signal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import type { Profile } from "@/hooks/useAuth";

const inp = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-hidden focus:border-primary";
const card = "rounded-2xl border border-border bg-card p-4";
const btn = "rounded-xl px-4 py-2.5 text-sm font-black";

export function AdminPanel() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-5">
      <header className="flex items-center gap-3">
        <Link to="/" className="flex size-10 items-center justify-center rounded-xl border border-border bg-card" aria-label="Voltar"><ArrowLeft className="size-4" /></Link>
        <h1 className="text-xl font-black">PAINEL <span className="text-destructive">ADM</span></h1>
      </header>
      <Tabs defaultValue="users" className="mt-5">
        <TabsList className="flex h-auto w-full flex-wrap">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="robot">API & Robô</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
          <TabsTrigger value="notices">Avisos</TabsTrigger>
          <TabsTrigger value="support">Suporte</TabsTrigger>
        </TabsList>
        <TabsContent value="users"><Users /></TabsContent>
        <TabsContent value="robot"><Robot /></TabsContent>
        <TabsContent value="telegram"><Telegram /></TabsContent>
        <TabsContent value="notices"><Notices /></TabsContent>
        <TabsContent value="support"><Support /></TabsContent>
      </Tabs>
    </main>
  );
}

const statusCls: Record<Profile["status"], string> = {
  pendente: "bg-primary/15 text-primary",
  aprovado: "bg-success/15 text-success",
  bloqueado: "bg-destructive/15 text-destructive",
  recusado: "bg-muted text-muted-foreground",
};

function Users() {
  const [rows, setRows] = useState<(Profile & { created_at: string })[]>([]);
  const load = () => void supabase.from("profiles").select("*").order("created_at", { ascending: false }).then(({ data }) => setRows((data as never) ?? []));
  useEffect(load, []);
  async function set(id: string, status: Profile["status"]) {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Atualizado");
    load();
  }
  return (
    <div className="space-y-2">
      {rows.length === 0 && <p className="text-sm text-muted-foreground">Nenhum usuário.</p>}
      {rows.map((u) => (
        <div key={u.id} className={`${card} grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center`}>
          <div className="min-w-0">
            <p className="truncate font-bold">{u.full_name || "—"} <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${statusCls[u.status]}`}>{u.status}</span></p>
            <p className="truncate text-sm text-muted-foreground">{u.email}</p>
            <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString("pt-PT")}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void set(u.id, "aprovado")} className={`${btn} flex items-center gap-1 bg-success/15 text-success`}><Check className="size-4" />Aprovar</button>
            <button onClick={() => void set(u.id, "bloqueado")} className={`${btn} flex items-center gap-1 bg-destructive/15 text-destructive`}><Ban className="size-4" />Bloquear</button>
            <button onClick={() => void set(u.id, "recusado")} className={`${btn} flex items-center gap-1 bg-secondary`}><X className="size-4" />Recusar</button>
          </div>
        </div>
      ))}
    </div>
  );
}

type Settings = { robot_on: boolean; api_endpoint: string; api_key: string; telegram_bot_token: string; telegram_chat_id: string; telegram_template: string; game_link: string };

function useSettings() {
  const [s, setS] = useState<Settings | null>(null);
  useEffect(() => void supabase.from("app_settings").select("*").eq("id", 1).single().then(({ data }) => setS(data as Settings)), []);
  async function save(patch: Partial<Settings>) {
    const { error } = await supabase.from("app_settings").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) toast.error(error.message);
    else toast.success("Guardado");
  }
  return { s, setS, save };
}

function Robot() {
  const { s, setS, save } = useSettings();
  if (!s) return null;
  return (
    <div className="space-y-3">
      <div className={`${card} flex items-center justify-between`}>
        <div>
          <p className="font-black">ROBÔ DE SINAIS</p>
          <p className={`text-sm font-bold ${s.robot_on ? "text-success" : "text-destructive"}`}>{s.robot_on ? "LIGADO" : "DESLIGADO"}</p>
        </div>
        <Switch checked={s.robot_on} onCheckedChange={(v) => { setS({ ...s, robot_on: v }); void save({ robot_on: v }); }} />
      </div>
      <div className={`${card} space-y-3`}>
        <p className="font-black">API Lynxmetrics</p>
        <input className={inp} placeholder="Endpoint (https://...)" value={s.api_endpoint} onChange={(e) => setS({ ...s, api_endpoint: e.target.value })} />
        <input className={inp} type="password" placeholder="Chave da API" value={s.api_key} onChange={(e) => setS({ ...s, api_key: e.target.value })} />
        <p className="text-xs text-muted-foreground">{s.api_endpoint ? "A usar a API configurada (simulação automática se falhar)." : "Sem API: a simulação matemática automática está ativa."} A resposta deve conter player/banker/tie (ou jogador/casa/empate) em %.</p>
        <p className="pt-2 font-black">Link do jogo</p>
        <input className={inp} value={s.game_link} onChange={(e) => setS({ ...s, game_link: e.target.value })} />
        <button onClick={() => void save({ api_endpoint: s.api_endpoint.trim(), api_key: s.api_key.trim(), game_link: s.game_link.trim() })} className={`${btn} bg-primary text-primary-foreground`}>Guardar</button>
      </div>
    </div>
  );
}

function Telegram() {
  const { s, setS, save } = useSettings();
  const test = useServerFn(sendTelegramTest);
  if (!s) return null;
  const preview = renderTemplate(s.telegram_template, { entrada: "CASA 🔴", tempo: 15, link: s.game_link });
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className={`${card} space-y-3`}>
        <input className={inp} type="password" placeholder="Bot Token" value={s.telegram_bot_token} onChange={(e) => setS({ ...s, telegram_bot_token: e.target.value })} />
        <input className={inp} placeholder="Chat ID" value={s.telegram_chat_id} onChange={(e) => setS({ ...s, telegram_chat_id: e.target.value })} />
        <textarea className={`${inp} min-h-48 font-mono`} value={s.telegram_template} onChange={(e) => setS({ ...s, telegram_template: e.target.value })} />
        <p className="text-xs text-muted-foreground">Variáveis: {"{entrada}"} {"{tempo}"} {"{link}"}</p>
        <div className="flex gap-2">
          <button onClick={() => void save({ telegram_bot_token: s.telegram_bot_token.trim(), telegram_chat_id: s.telegram_chat_id.trim(), telegram_template: s.telegram_template })} className={`${btn} bg-primary text-primary-foreground`}>Guardar</button>
          <button onClick={async () => { const r = await test(); if (r.ok) toast.success("Mensagem enviada!"); else toast.error(r.error ?? "Erro"); }} className={`${btn} bg-secondary`}>Enviar teste</button>
        </div>
      </div>
      <div className={card}>
        <p className="mb-2 text-xs font-black text-muted-foreground">PREVIEW AO VIVO</p>
        <div className="rounded-2xl rounded-tl-sm bg-secondary p-4 text-sm whitespace-pre-wrap">{preview}</div>
      </div>
    </div>
  );
}

function Notices() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [items, setItems] = useState<{ id: string; title: string; body: string; created_at: string }[]>([]);
  const load = () => void supabase.from("announcements").select("*").order("created_at", { ascending: false }).then(({ data }) => setItems(data ?? []));
  useEffect(load, []);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("announcements").insert({ title: title.trim(), body: body.trim() });
    if (error) { toast.error(error.message); return; }
    toast.success("Aviso enviado a todos");
    setTitle(""); setBody(""); load();
  }
  return (
    <div className="space-y-3">
      <form onSubmit={send} className={`${card} space-y-3`}>
        <input className={inp} placeholder="Título" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className={`${inp} min-h-28`} placeholder="Mensagem" required maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} />
        <button className={`${btn} bg-primary text-primary-foreground`}>🔔 Enviar aviso</button>
      </form>
      {items.map((i) => (
        <div key={i.id} className={`${card} flex items-start justify-between gap-3`}>
          <div className="min-w-0"><p className="font-bold">{i.title}</p><p className="text-sm text-muted-foreground whitespace-pre-wrap">{i.body}</p></div>
          <button onClick={async () => { await supabase.from("announcements").delete().eq("id", i.id); load(); }} className="shrink-0 text-xs font-bold text-destructive">Apagar</button>
        </div>
      ))}
    </div>
  );
}

function Support() {
  const [items, setItems] = useState<{ id: string; user_id: string; message: string; admin_reply: string | null; created_at: string }[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  async function load() {
    const { data } = await supabase.from("support_tickets").select("id,user_id,message,admin_reply,created_at").order("created_at", { ascending: false });
    setItems(data ?? []);
    const { data: p } = await supabase.from("profiles").select("id,full_name,email");
    setNames(Object.fromEntries((p ?? []).map((x) => [x.id, x.full_name || x.email])));
  }
  useEffect(() => void load(), []);
  async function reply(id: string) {
    const text = (drafts[id] ?? "").trim();
    if (!text) return;
    const { error } = await supabase.from("support_tickets").update({ admin_reply: text, replied_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Resposta enviada");
    void load();
  }
  return (
    <div className="space-y-2">
      {items.length === 0 && <p className="text-sm text-muted-foreground">Sem chamados.</p>}
      {items.map((t) => (
        <div key={t.id} className={`${card} space-y-2`}>
          <div className="flex justify-between gap-2 text-xs text-muted-foreground"><span className="truncate font-bold text-foreground">{names[t.user_id] ?? "Usuário"}</span><span className="shrink-0">{new Date(t.created_at).toLocaleString("pt-PT")}</span></div>
          <p className="text-sm">{t.message}</p>
          {t.admin_reply ? (
            <p className="rounded-xl bg-primary/10 p-3 text-sm text-primary">✔ {t.admin_reply}</p>
          ) : (
            <div className="flex gap-2">
              <input className={inp} placeholder="Responder..." value={drafts[t.id] ?? ""} onChange={(e) => setDrafts({ ...drafts, [t.id]: e.target.value })} />
              <button onClick={() => void reply(t.id)} className={`${btn} shrink-0 bg-primary text-primary-foreground`}>Enviar</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
