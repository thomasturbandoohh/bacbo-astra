import type { SupabaseClient } from "@supabase/supabase-js";
import { renderTemplate, type Side, type Signal, getDailyScore } from "./signal";

export type Settings = Record<string, unknown> & {
  robot_on: boolean;
  api_endpoint: string;
  api_connected: boolean;
  game_link: string;
  telegram_bot_token: string;
  telegram_chat_id: string;
  telegram_template: string;
  telegram_auto: boolean;
  tpl_green: string;
  tpl_g1: string;
  tpl_red: string;
  sticker_entry: string;
  sticker_green: string;
  sticker_red: string;
  last_sent_cycle: number | null;
  last_signal_id?: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadSettings(db: SupabaseClient<any>): Promise<Settings | null> {
  const { data } = await db.from("app_settings").select("*").eq("id", 1).single();
  return (data as Settings | null) ?? null;
}

/** Reads the live signal from the configured API; null when it is unreachable or malformed. */
export async function fetchApiSignal(endpoint: string, cycle: number): Promise<Signal | null> {
  try {
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(4000), headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const j = (await res.json()) as Record<string, unknown>;
    const player = Number(j["player"] ?? j["jogador"]);
    const banker = Number(j["banker"] ?? j["casa"]);
    const tie = Number(j["tie"] ?? j["empate"]);
    if (![player, banker, tie].every((n) => Number.isFinite(n))) return null;
    const side: Side = tie > player && tie > banker ? "EMPATE" : player >= banker ? "JOGADOR" : "CASA";
    return { cycle, side, player: Math.round(player), banker: Math.round(banker), tie: Math.round(tie) };
  } catch (e) {
    console.error("signal api failed", e);
    return null;
  }
}

const sideLabel: Record<Side, string> = { JOGADOR: "JOGADOR 🔵", CASA: "CASA 🔴", EMPATE: "EMPATE ⚪" };
export const labelSide = (s: Side) => sideLabel[s];

export async function tg(token: string, method: string, body: Record<string, unknown>): Promise<{ ok: boolean; description?: string }> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json().catch(() => ({ ok: false }))) as { ok: boolean; description?: string };
}

export async function tgSend(
  s: Settings,
  tpl: string,
  sticker: string,
  v: { entrada: string; tempo: number; link: string; placar?: string; sinalId?: string }
) {
  if (sticker) await tg(s.telegram_bot_token, "sendSticker", { chat_id: s.telegram_chat_id, sticker });
  return tg(s.telegram_bot_token, "sendMessage", {
    chat_id: s.telegram_chat_id,
    text: renderTemplate(tpl, v),
    disable_web_page_preview: true,
  });
}
