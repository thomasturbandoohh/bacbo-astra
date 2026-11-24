import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { cycleAt, outcomeAt, simulateSignal, BET_WINDOW_MS } from "@/lib/signal";
import { fetchApiSignal, labelSide, loadSettings, tgSend } from "@/lib/astra.server";

// Called every minute by the scheduler: posts the result of the last entry, then a new entry.
export const Route = createFileRoute("/api/public/telegram/tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const s = await loadSettings(supabaseAdmin);
        if (!s?.telegram_auto || !s.robot_on || !s.telegram_bot_token || !s.telegram_chat_id) return Response.json({ skipped: true });
        const cycle = cycleAt(Date.now());
        const link = s.game_link;
        const tempo = BET_WINDOW_MS / 1000;
        const last = s.last_sent_cycle == null ? null : Number(s.last_sent_cycle);
        if (last !== null && last !== cycle) {
          const o = outcomeAt(last);
          const entrada = labelSide(simulateSignal(last).side);
          const [tpl, st] = o === "GREEN" ? [s.tpl_green, s.sticker_green] : o === "G1" ? [s.tpl_g1, s.sticker_green] : [s.tpl_red, s.sticker_red];
          await tgSend(s, tpl, st, { entrada, tempo, link });
        }
        if (!s.api_connected || !s.api_endpoint) {
          await supabaseAdmin.from("app_settings").update({ last_sent_cycle: null }).eq("id", 1);
          return Response.json({ waiting: true });
        }
        const sig = await fetchApiSignal(s.api_endpoint, cycle);
        if (!sig) {
          await supabaseAdmin.from("app_settings").update({ last_sent_cycle: null }).eq("id", 1);
          return Response.json({ waiting: true });
        }
        await tgSend(s, s.telegram_template, s.sticker_entry, { entrada: labelSide(sig.side), tempo, link });
        await supabaseAdmin.from("app_settings").update({ last_sent_cycle: cycle }).eq("id", 1);
        return Response.json({ sent: true });
      },
    },
  },
});
