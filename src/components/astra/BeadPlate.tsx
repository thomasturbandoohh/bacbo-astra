import { useRef, type ReactElement } from "react";
import type { HistoryItem, Side } from "@/lib/signal";
import { motion } from "framer-motion";

interface BeadPlateProps {
  history: HistoryItem[];
}

export function BeadPlate({ history }: BeadPlateProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);

  // Casino Bead Plate usually arranges in columns of 6 rows
  // Or horizontal sequential beads
  const playerWins = history.filter((h) => h.side === "JOGADOR").length;
  const bankerWins = history.filter((h) => h.side === "CASA").length;
  const tieWins = history.filter((h) => h.side === "EMPATE" || h.outcome === "TIE_GREEN").length;

  return (
    <section className="glass rounded-3xl p-3.5 mt-3 border border-white/10" aria-label="Bead Plate Bac Bo">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs">
        <span className="font-extrabold uppercase tracking-wider text-muted-foreground">
          BEAD PLATE (ROADMAP)
        </span>
        <div className="flex items-center gap-3 font-mono text-[11px] font-bold">
          <span className="text-blue-400">P: {playerWins}</span>
          <span className="text-rose-400">B: {bankerWins}</span>
          <span className="text-emerald-400">T: {tieWins}</span>
        </div>
      </div>

      {/* Horizontal Sliding Casino Strip */}
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent select-none cursor-grab active:cursor-grabbing"
      >
        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center w-full">Aguardando primeiras rodadas...</p>
        ) : (
          history.slice().reverse().map((item, idx) => {
            const isTie = item.side === "EMPATE" || item.outcome === "TIE_GREEN";
            const isPlayer = item.side === "JOGADOR" && !isTie;
            const isBanker = item.side === "CASA" && !isTie;

            const bg = isTie
              ? "bg-emerald-600 border-emerald-400 text-white shadow-emerald-500/50"
              : isPlayer
              ? "bg-blue-600 border-blue-400 text-white shadow-blue-500/50"
              : "bg-rose-600 border-rose-400 text-white shadow-rose-500/50";

            const letter = isTie ? "T" : isPlayer ? "P" : "B";
            const total = isPlayer ? item.playerTotal : isBanker ? item.bankerTotal : item.playerTotal ?? item.bankerTotal;

            return (
              <motion.div
                key={item.cycle || idx}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div
                  className={`size-9 rounded-full flex items-center justify-center font-black text-sm border-2 shadow-md ${bg}`}
                  title={`${item.side} - ${item.time}`}
                >
                  {letter}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{item.time.slice(0, 5)}</span>
              </motion.div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default BeadPlate;
