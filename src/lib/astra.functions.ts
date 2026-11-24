import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildHistory, cycleAt, displayRate, simulateSignal, BET_WINDOW_MS } from "./signal";
import { fetchApiSignal, labelSide, loadSettings, tgSend } from "./astra.server";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

async function isAdmin(userId: string) {
  const db = await admin();
  const { data } = await db.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  return !!data;
}

export const getSignal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    const [{ data: profile }, adm] = await Promise.all([
      db.from("profiles").select("status").eq("id", context.userId).maybeSingle(),
      isAdmin(context.userId),
    ]);
    if (profile?.status !== "aprovado" && !adm) return { ok: false as const, reason: "not_approved" };
    const s = await loadSettings(db);
    const now = Date.now();
    const cycle = cycleAt(now);
    const history = buildHistory(cycle);
    const base = {
      ok: true as const,
      serverNow: now,
      gameLink: s?.game_link || "https://www.elephantbet.co.ao/",
      history,
      rate: displayRate(cycle, history),
      apiConnected: Boolean(s?.api_connected),
      robotOn: Boolean(s?.robot_on),
    };
    if (!s?.robot_on) return { ...base, mode: "off" as const };
    if (!s.api_connected || !s.api_endpoint) return { ...base, mode: "waiting" as const };
    const signal = await fetchApiSignal(s.api_endpoint, cycle);
    if (!signal) return { ...base, mode: "waiting" as const };
    return { ...base, mode: "live" as const, signal };
  });

export const connectApi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ endpoint: z.string().trim().url().max(500) }).parse(d))
  .handler(async ({ context, data }) => {
    if (!(await isAdmin(context.userId))) return { ok: false, error: "Sem permissão" };
    const sig = await fetchApiSignal(data.endpoint, cycleAt(Date.now()));
    const db = await admin();
    await db.from("app_settings").update({ api_endpoint: data.endpoint, api_connected: !!sig, updated_at: new Date().toISOString() }).eq("id", 1);
    return sig ? { ok: true, error: null } : { ok: false, error: "A API não respondeu com percentagens de Jogador, Casa e Empate." };
  });

export const disconnectApi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context.userId))) return { ok: false };
    const db = await admin();
    await db.from("app_settings").update({ api_connected: false, updated_at: new Date().toISOString() }).eq("id", 1);
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    if (!(await isAdmin(context.userId))) return { ok: false, error: "Sem permissão" };
    if (data.id === context.userId) return { ok: false, error: "Não pode excluir a sua própria conta." };
    const db = await admin();
    const { error } = await db.auth.admin.deleteUser(data.id);
    return error ? { ok: false, error: error.message } : { ok: true, error: null };
  });

export const setupAdmin = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(200), password: z.string().min(8).max(100) }).parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: exists } = await db.rpc("admin_exists");
    if (exists) return { ok: false, error: "O administrador já foi configurado." };
    const { data: created, error } = await db.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.name },
    });
    if (error || !created.user) return { ok: false, error: error?.message ?? "Erro ao criar administrador" };
    await db.from("profiles").update({ status: "aprovado" }).eq("id", created.user.id);
    await db.from("user_roles").insert({ user_id: created.user.id, role: "admin" });
    return { ok: true, error: null };
  });

export const sendTelegramTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ kind: z.enum(["entry", "green", "g1", "red", "attention"]) }).parse(d))
  .handler(async ({ context, data }) => {
    if (!(await isAdmin(context.userId))) return { ok: false, error: "Sem permissão" };
    const s = await loadSettings(await admin());
    if (!s?.telegram_bot_token || !s.telegram_chat_id) return { ok: false, error: "Preencha o Bot Token e o Chat ID." };
    const v = { entrada: labelSide(simulateSignal(cycleAt(Date.now())).side), tempo: BET_WINDOW_MS / 1000, link: s.game_link };
    const map = {
      attention: ["⚠️ ATENÇÃO ⚠️\nIdentificando entrada no Bac Bo...\n🔗 {link}", s.sticker_entry],
      entry: [s.telegram_template, s.sticker_entry],
      green: [s.tpl_green, s.sticker_green],
      g1: [s.tpl_g1, s.sticker_green],
      red: [s.tpl_red, s.sticker_red],
    } as const;
    const [tpl, sticker] = map[data.kind];
    const r = await tgSend(s, tpl, sticker, v);
    return r.ok ? { ok: true, error: null } : { ok: false, error: r.description ?? "Falha ao enviar" };
  });
