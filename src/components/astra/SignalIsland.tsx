import { useEffect, useState, type ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Shield,
  ChevronUp,
} from "lucide-react";
import type { Side, Outcome } from "@/lib/signal";

export type IslandState = {
  phase: "analyzing" | "confirmed" | "gale" | "green" | "red" | "idle";
  side?: Side | undefined;
  secs?: number | undefined;
  outcome?: Outcome | undefined;
};

interface SignalIslandProps {
  state: IslandState;
  onDismiss?: () => void;
}

export function SignalIsland({ state, onDismiss }: SignalIslandProps): ReactElement | null {
  const [visible, setVisible] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse / auto-hide after successful result
  useEffect(() => {
    if (state.phase === "green") {
      const timer = setTimeout(() => {
        setCollapsed(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else if (state.phase === "idle") {
      setVisible(false);
    } else {
      setVisible(true);
      setCollapsed(false);
    }
    return undefined;
  }, [state.phase]);

  if (!visible || state.phase === "idle") {
    return null;
  }

  // Visual content mapping for all required states
  let content: ReactElement | null = null;

  if (state.phase === "analyzing") {
    content = (
      <div className="flex items-center gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
          <Activity className="size-4 animate-spin" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black tracking-wider text-primary uppercase">
            ⚡ Analisando mesa ao vivo...
          </p>
          <p className="truncate text-xs font-semibold text-muted-foreground">
            Avaliando padrões e histórico de dados
          </p>
        </div>
        {state.secs != null && (
          <span className="font-mono text-xs font-black text-foreground tabular-nums">
            {state.secs}s
          </span>
        )}
      </div>
    );
  } else if (state.phase === "confirmed") {
    const isPlayer = state.side === "JOGADOR";
    const sideColor = isPlayer ? "text-blue-400" : "text-rose-400";
    const badgeBg = isPlayer ? "bg-blue-500/20 text-blue-300" : "bg-rose-500/20 text-rose-300";

    content = (
      <div className="flex items-center gap-3">
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${badgeBg}`}>
          <Flame className="size-4 animate-bounce" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
              ENTRADA CONFIRMADA
            </span>
            <span className="rounded-full bg-secondary px-1.5 py-0.2 text-[9px] font-black text-muted-foreground">
              GALE 1
            </span>
          </div>
          <p className={`text-sm font-black tracking-wide ${sideColor}`}>
            {isPlayer ? "🔵 JOGADOR" : "🔴 CASA"} + Proteção EMPATE ⚪
          </p>
        </div>
        {state.secs != null && (
          <div className="text-right">
            <span className="text-[10px] block font-bold text-muted-foreground">FECHA EM</span>
            <span className="font-mono text-sm font-black text-foreground tabular-nums">
              {state.secs}s
            </span>
          </div>
        )}
      </div>
    );
  } else if (state.phase === "gale") {
    content = (
      <div className="flex items-center gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
          <Shield className="size-4 animate-pulse" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black tracking-wider text-amber-400 uppercase">
            🔁 VAMOS AO GALE 1
          </p>
          <p className="truncate text-xs font-semibold text-muted-foreground">
            Mantenha a aposta com proteção no empate
          </p>
        </div>
      </div>
    );
  } else if (state.phase === "green") {
    const isTie = state.outcome === "TIE_GREEN";
    content = (
      <div className="flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black tracking-widest text-emerald-400 uppercase">
            {isTie ? "✅ EMPATE É GREEN! (PAGOU ALTO)" : "✅ GREEN CONFIRMADO!"}
          </p>
          <p className="truncate text-xs font-medium text-emerald-200/80">
            Lucro garantido na operação Bac Bo Astra
          </p>
        </div>
      </div>
    );
  } else if (state.phase === "red") {
    content = (
      <div className="flex items-center gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
          <AlertTriangle className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black tracking-wider text-rose-400 uppercase">
            ❌ RED REGISTRADO
          </p>
          <p className="truncate text-xs font-semibold text-muted-foreground">
            Gestão de banca rigorosa. Aguarde o próximo ciclo.
          </p>
        </div>
      </div>
    );
  }

  // Ensures TS7030 is fully satisfied across all code branches
  if (!content) {
    return null;
  }

  return (
    <div className="fixed top-3 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="pointer-events-auto w-full max-w-md rounded-3xl border border-white/10 bg-black/85 backdrop-blur-xl px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.6)] text-white"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">{content}</div>
              <button
                type="button"
                onClick={() => {
                  setCollapsed(true);
                  onDismiss?.();
                }}
                className="ml-2 flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 hover:text-white transition-colors"
                aria-label="Recolher notificação"
              >
                <ChevronUp className="size-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
