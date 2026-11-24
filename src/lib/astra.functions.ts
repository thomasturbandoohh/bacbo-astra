import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildHistory, cycleAt, phaseAt, renderTemplate, simulateSignal, BET_WINDOW_MS, type Signal } from "./signal";

export const getSignal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profile }, { data: role }] = await Promise.all([
      supabaseAdmin.from("profiles").select("status").eq("id", context.userId).maybeSingle(),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle(),
    ]);
    if (profile?.status !== "aprovado" && !role) return { ok: false as const, reason: "not_approved" };
    const { data: s } = await supabaseAdmin.from("app_settings").select("*").eq("id", 1).single();
    const now = Date.now();
    const cycle = cycleAt(now);
    const gameLink = s?.game_link || "https://www.elephantbet.co.ao/";
    if (!s?.robot_on) return { ok: true as const, off: true, gameLink, history: buildHistory(cycle) };

    let signal: Signal = simulateSignal(cycle);
    if (s.api_endpoint) {
      try {
        const res = await fetch(s.api_endpoint, {
          headers: s.api_key ? { Authorization: `Bearer ${s.api_key}`, "x-api-key": s.api_key } : {},
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const j = (await res.json()) as Record<string, unknown>;
          const player = Number(j["player"] ?? j["jogador"]);
          const banker = Number(j["banker"] ?? j["casa"]);
          const tie = Number(j["tie"] ?? j["empate"]);
          if ([player, banker, tie].every((n) => Number.isFinite(n))) {
            const side = tie > player && tie > banker ? "EMPATE" : player >= banker ? "JOGADOR" : "CASA";
            signal = { cycle, side, player: Math.round(player), banker: Math.round(banker), tie: Math.round(tie) };
          }
        }
      } catch (e) {
        console.error("signal source failed, using simulation", e);
      }
    }
    return { ok: true as const, off: false, serverNow: now, signal, gameLink, history: buildHistory(cycle), phase: phaseAt(now) };
  });

export const setupAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(200), password: z.string().min(8).max(100) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: exists } = await supabaseAdmin.rpc("admin_exists");
    if (exists) return { ok: false, error: "O administrador já foi configurado." };
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.name },
    });
    if (error || !created.user) return { ok: false, error: error?.message ?? "Erro ao criar administrador" };
    await supabaseAdmin.from("profiles").update({ status: "aprovado" }).eq("id", created.user.id);
    await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "admin" });
    return { ok: true, error: null };
  });

export const sendTelegramTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: role } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (!role) return { ok: false, error: "Sem permissão" };
    const { data: s } = await supabaseAdmin.from("app_settings").select("*").eq("id", 1).single();
    if (!s?.telegram_bot_token || !s.telegram_chat_id) return { ok: false, error: "Preencha o Bot Token e o Chat ID." };
    const sig = simulateSignal(cycleAt(Date.now()));
    const text = renderTemplate(s.telegram_template, { entrada: sig.side, tempo: BET_WINDOW_MS / 1000, link: s.game_link });
    const res = await fetch(`https://api.telegram.org/bot${s.telegram_bot_token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: s.telegram_chat_id, text }),
    });
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    return j.ok ? { ok: true, error: null } : { ok: false, error: j.description ?? "Falha ao enviar" };
  });
