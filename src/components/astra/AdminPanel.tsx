import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Ban, X, Trash2, Unlock, Power, Plug, Unplug, RefreshCw, Loader2, Save, Send } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { connectApi, deleteUser, disconnectApi, sendTelegramTest } from "@/lib/astra.functions";
import { renderTemplate } from "@/lib/signal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import type { Profile } from "@/hooks/useAuth";

const inp = "w-full min-w-0 rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-hidden focus:border-primary";
const card = "glass rounded-3xl p-4";
const btn = "rounded-xl px-4 py-2.5 text-sm font-black";

export function AdminPanel() {
  return (
    <main className="bg-aurora min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-5">
        <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <Link to="/" className="glass flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl" aria-label="Voltar"><ArrowLeft className="size-4" /></Link>
          <h1 className="truncate text-center text-xl font-black">🛡️ PAINEL <span className="text-destructive">ADM</span></h1>
          <span className="size-10" />
        </header>
        <Tabs defaultValue="users" className="mt-5">
          <TabsList className="glass grid h-auto w-full grid-cols-5 gap-1 rounded-2xl p-1.5">
            {tabs.map((t) => (
              <TabsTrigger key={t.v} value={t.v} className="flex min-w-0 flex-col gap-0.5 rounded-xl px-1 py-2 text-[11px] font-black data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <span className="text-lg leading-none">{t.e}</span><span className="w-full truncate">{t.l}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="users"><Users /></TabsContent>
          <TabsContent value="robot"><Robot /></TabsContent>
          <TabsContent value="telegram"><Telegram /></TabsContent>
          <TabsContent value="notices"><Notices /></TabsContent>
          <TabsContent value="support"><Support /></TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

const tabs = [
  { v: "users", e: "👥", l: "Usuários" },
  { v: "robot", e: "🤖", l: "API & Robô" },
  { v: "telegram", e: "✈️", l: "Telegram" },
  { v: "notices", e: "🔔", l: "Avisos" },
  { v: "support", e: "💬", l: "Suporte" },
];

function Section({ emoji, title, desc, children, delay = 0 }: { emoji: string; title: string; desc?: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className={`${card} space-y-3`}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/70 text-xl">{emoji}</span>
        <div className="min-w-0"><p className="truncate font-black">{title}</p>{desc && <p className="text-xs text-muted-foreground">{desc}</p>}</div>
      </div>
      {children}
    </motion.section>
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
  const del = useServerFn(deleteUser);
  const load = () => void supabase.from("profiles").select("*").order("created_at", { ascending: false }).then(({ data }) => setRows((data as never) ?? []));
  useEffect(load, []);
  async function set(id: string, status: Profile["status"]) {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Atualizado ✅");
    load();
  }
  async function remove(id: string) {
    if (!confirm("Excluir este usuário definitivamente?")) return;
    const r = await del({ data: { id } });
    if (r.ok) toast.success("Usuário excluído 🗑️"); else toast.error(r.error ?? "Erro");
    load();
  }
  const count = (st: Profile["status"]) => rows.filter((r) => r.status === st).length;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {([["⏳", "Pendentes", "pendente"], ["✅", "Aprovados", "aprovado"], ["⛔", "Bloqueados", "bloqueado"]] as const).map(([e, l, st]) => (
          <div key={st} className={`${card} min-w-0 text-center`}><div className="text-xl">{e}</div><div className="text-2xl font-black">{count(st)}</div><div className="truncate text-[11px] font-bold text-muted-foreground">{l}</div></div>
        ))}
      </div>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">Nenhum usuário ainda.</p>}
      <AnimatePresence initial={false}>
        {rows.map((u) => (
          <motion.div layout key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className={`${card} grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center`}>
            <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand font-black text-primary-foreground">{(u.full_name || u.email || "?").charAt(0).toUpperCase()}</span>
              <div className="min-w-0">
                <p className="flex min-w-0 items-center gap-2 font-bold"><span className="truncate">{u.full_name || "—"}</span><span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${statusCls[u.status]}`}>{u.status}</span></p>
                <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString("pt-PT")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(u.status === "pendente" || u.status === "recusado") && <Btn onClick={() => void set(u.id, "aprovado")} cls="bg-success/15 text-success" icon={<Check className="size-4" />}>Aprovar</Btn>}
              {u.status === "pendente" && <Btn onClick={() => void set(u.id, "recusado")} cls="bg-secondary" icon={<X className="size-4" />}>Recusar</Btn>}
              {u.status === "aprovado" && <Btn onClick={() => void set(u.id, "bloqueado")} cls="bg-destructive/15 text-destructive" icon={<Ban className="size-4" />}>Bloquear</Btn>}
              {u.status === "bloqueado" && <Btn onClick={() => void set(u.id, "aprovado")} cls="bg-success/15 text-success" icon={<Unlock className="size-4" />}>Desbloquear</Btn>}
              {u.status !== "pendente" && <Btn onClick={() => void remove(u.id)} cls="bg-destructive text-destructive-foreground" icon={<Trash2 className="size-4" />}>Excluir</Btn>}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Btn({ onClick, cls, icon, children, disabled }: { onClick: () => void; cls: string; icon?: React.ReactNode; children: React.ReactNode; disabled?: boolean }) {
  return (
    <motion.button whileTap={{ scale: 0.95 }} disabled={disabled} onClick={onClick} className={`${btn} flex items-center gap-1.5 overflow-hidden disabled:opacity-50 ${cls}`}>
      {icon && <span className="shrink-0">{icon}</span>}<span className="truncate">{children}</span>
    </motion.button>
  );
}

type Settings = {
  robot_on: boolean; api_endpoint: string; api_connected: boolean; telegram_bot_token: string; telegram_chat_id: string;
  telegram_template: string; game_link: string; telegram_auto: boolean; tpl_green: string; tpl_g1: string; tpl_red: string;
  sticker_entry: string; sticker_green: string; sticker_red: string;
};

function useSettings() {
  const [s, setS] = useState<Settings | null>(null);
  const reload = () => void supabase.from("app_settings").select("*").eq("id", 1).single().then(({ data }) => setS(data as unknown as Settings));
  useEffect(reload, []);
  async function save(patch: Partial<Settings>) {
    const { error } = await supabase.from("app_settings").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) toast.error(error.message);
    else toast.success("Guardado ✅");
  }
  return { s, setS, save, reload };
}

function Robot() {
  const { s, setS, save, reload } = useSettings();
  const connect = useServerFn(connectApi);
  const disconnect = useServerFn(disconnectApi);
  const [busy, setBusy] = useState(false);
  if (!s) return null;
  async function doConnect() {
    setBusy(true);
    const r = await connect({ data: { endpoint: s!.api_endpoint.trim() } }).catch(() => ({ ok: false, error: "Endereço inválido" }));
    setBusy(false);
    if (r.ok) toast.success("API conectada 🟢"); else toast.error(r.error ?? "Falha ao conectar");
    reload();
  }
  const hasUrl = s.api_endpoint.trim().length > 0;
  return (
    <div className="space-y-3">
      <Section emoji="🤖" title="Robô de sinais" desc="Liga ou desliga os sinais para todos os membros.">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-secondary/50 px-4 py-3">
          <p className={`flex items-center gap-2 text-sm font-black ${s.robot_on ? "text-success" : "text-destructive"}`}><Power className="size-4 shrink-0" />{s.robot_on ? "LIGADO" : "DESLIGADO"}</p>
          <Switch checked={s.robot_on} onCheckedChange={(v) => { setS({ ...s, robot_on: v }); void save({ robot_on: v }); }} />
        </div>
      </Section>
      <Section emoji="🔌" title="API da mesa" desc="Cole aqui o endereço da sua API. Sem API conectada, a mesa não envia sinais." delay={0.05}>
        <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ${s.api_connected ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
          <span className={`size-2 shrink-0 rounded-full ${s.api_connected ? "bg-success animate-pulse" : "bg-destructive"}`} />
          {s.api_connected ? "CONECTADA · sinais ao vivo" : "DESCONECTADA"}
        </div>
        <input className={inp} placeholder="https://sua-api.com/sinal" disabled={s.api_connected} value={s.api_endpoint} onChange={(e) => setS({ ...s, api_endpoint: e.target.value })} />
        <AnimatePresence mode="wait">
          {s.api_connected ? (
            <motion.div key="on" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-2">
              <Btn disabled={busy} onClick={() => void doConnect()} cls="justify-center bg-primary/15 text-primary" icon={<RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />}>Reconectar</Btn>
              <Btn onClick={async () => { await disconnect(); toast.success("API desconectada"); reload(); }} cls="justify-center bg-destructive/15 text-destructive" icon={<Unplug className="size-4" />}>Desconectar</Btn>
            </motion.div>
          ) : hasUrl ? (
            <motion.div key="off" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Btn disabled={busy} onClick={() => void doConnect()} cls="w-full justify-center bg-brand py-3 text-primary-foreground glow-blue" icon={busy ? <Loader2 className="size-4 animate-spin" /> : <Plug className="size-4" />}>{busy ? "A conectar..." : "Conectar API"}</Btn>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Section>
      <Section emoji="🎮" title="Link do jogo" desc="Para onde o botão “Entrar no jogo” leva os membros." delay={0.1}>
        <input className={inp} value={s.game_link} onChange={(e) => setS({ ...s, game_link: e.target.value })} />
        <Btn onClick={() => void save({ game_link: s.game_link.trim() })} cls="bg-primary text-primary-foreground" icon={<Save className="size-4" />}>Guardar</Btn>
      </Section>
    </div>
  );
}

const sampleVars = (link: string) => ({ entrada: "CASA 🔴", tempo: 15, link });

function Telegram() {
  const { s, setS, save } = useSettings();
  const test = useServerFn(sendTelegramTest);
  const [tab, setTab] = useState<"entry" | "green" | "g1" | "red">("entry");
  if (!s) return null;
  const fields = {
    entry: { label: "🎯 Entrada", tpl: "telegram_template", sticker: "sticker_entry" },
    green: { label: "✅ Green", tpl: "tpl_green", sticker: "sticker_green" },
    g1: { label: "🔁 G1", tpl: "tpl_g1", sticker: "sticker_green" },
    red: { label: "❌ Red", tpl: "tpl_red", sticker: "sticker_red" },
  } as const;
  const f = fields[tab];
  const preview = renderTemplate(s[f.tpl], sampleVars(s.game_link));
  return (
    <div className="space-y-3">
      <Section emoji="✈️" title="Bot do Telegram" desc="Dados do seu bot e do canal onde os sinais são publicados.">
        <input className={inp} type="password" placeholder="Bot Token" value={s.telegram_bot_token} onChange={(e) => setS({ ...s, telegram_bot_token: e.target.value })} />
        <input className={inp} placeholder="Chat ID (ex: -100123...)" value={s.telegram_chat_id} onChange={(e) => setS({ ...s, telegram_chat_id: e.target.value })} />
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-secondary/50 px-4 py-3">
          <div className="min-w-0"><p className="text-sm font-black">⚡ Envio automático</p><p className="text-xs text-muted-foreground">Publica a entrada e o resultado (Green, G1 ou Red) a cada minuto.</p></div>
          <Switch checked={s.telegram_auto} onCheckedChange={(v) => { setS({ ...s, telegram_auto: v }); void save({ telegram_auto: v }); }} />
        </div>
      </Section>
      <Section emoji="📝" title="Mensagens" desc="Personalize cada mensagem com emojis e stickers." delay={0.05}>
        <div className="grid grid-cols-4 gap-1.5">
          {(Object.keys(fields) as (keyof typeof fields)[]).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={`min-w-0 truncate rounded-xl px-1 py-2 text-xs font-black ${tab === k ? "bg-primary/20 text-primary" : "bg-secondary/60 text-muted-foreground"}`}>{fields[k].label}</button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <textarea className={`${inp} min-h-44 font-mono`} value={s[f.tpl]} onChange={(e) => setS({ ...s, [f.tpl]: e.target.value })} />
            <input className={inp} placeholder="Sticker (file_id do Telegram, opcional)" value={s[f.sticker]} onChange={(e) => setS({ ...s, [f.sticker]: e.target.value })} />
            <p className="text-xs text-muted-foreground">Variáveis: {"{entrada}"} {"{tempo}"} {"{link}"}. Para obter o file_id de um sticker, envie-o ao bot @idstickerbot.</p>
          </div>
          <div className="rounded-2xl bg-background/60 p-3">
            <p className="mb-2 text-[11px] font-black text-muted-foreground">👀 PRÉ-VISUALIZAÇÃO</p>
            {s[f.sticker] && <div className="mb-2 inline-block rounded-xl bg-secondary px-3 py-2 text-2xl">🖼️ <span className="text-xs text-muted-foreground">sticker</span></div>}
            <motion.div key={preview} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="rounded-2xl rounded-tl-sm bg-primary/15 p-4 text-sm whitespace-pre-wrap break-words">{preview}</motion.div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => void save({ telegram_bot_token: s.telegram_bot_token.trim(), telegram_chat_id: s.telegram_chat_id.trim(), telegram_template: s.telegram_template, tpl_green: s.tpl_green, tpl_g1: s.tpl_g1, tpl_red: s.tpl_red, sticker_entry: s.sticker_entry.trim(), sticker_green: s.sticker_green.trim(), sticker_red: s.sticker_red.trim() })} cls="bg-primary text-primary-foreground" icon={<Save className="size-4" />}>Guardar tudo</Btn>
          <Btn onClick={async () => { const r = await test({ data: { kind: tab } }); if (r.ok) toast.success("Mensagem enviada! 📨"); else toast.error(r.error ?? "Erro"); }} cls="bg-secondary" icon={<Send className="size-4" />}>Enviar teste</Btn>
        </div>
      </Section>
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
        <button className={`${btn} bg-primary text-primary-foreground`}>📣 Enviar aviso a todos</button>
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
