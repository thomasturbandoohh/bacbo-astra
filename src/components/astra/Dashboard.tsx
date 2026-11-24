import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, BarChart3, CircleCheck, CircleX, ExternalLink, LogOut,
  Power, Radio, Shield, ShieldCheck, Target, Timer, Zap, AlertTriangle
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getSignal } from "@/lib/astra.functions";
import {
  cycleAt, phaseAt, HISTORY_LIMIT, type HistoryItem, type Side, type Signal,
  outcomeAt, simulateDice
} from "@/lib/signal";
import { useAuth } from "@/hooks/useAuth";
import { Brand } from "./Brand";
import { Bell } from "./Bell";
import { Assistant } from "./Assistant";
import { SignalIsland, type IslandState } from "./SignalIsland";
import { BeadPlate } from "./BeadPlate";
import type { RobotMood } from "./Robot3D";

const Robot3D = lazy(() => import("./Robot3D"));
const BacBoDice3D = lazy(() => import("./BacBoDice3D"));

type Mode = "off" | "waiting" | "live";
type State = {
  mode: Mode;
  signal: Signal | undefined;
  history: HistoryItem[];
  rate: number;
  gameLink: string;
  offset: number;
  apiConnected?: boolean | undefined;
};

const sideText: Record<Side, string> = { JOGADOR: "text-primary", CASA: "text-destructive", EMPATE: "text-tie" };
const sideDot: Record<Side, string> = { JOGADOR: "🔵", CASA: "🔴", EMPATE: "⚪" };
const iconBtn = "glass flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl";

export function Dashboard() {
  const { isAdmin, signOut, profile } = useAuth();
  const fetchSignal = useServerFn(getSignal);
  const [state, setState] = useState<State | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [mounted, setMounted] = useState(false);
  const lastCycle = useRef<number>(-1);

  async function load() {
    const t0 = Date.now();
    const r = await fetchSignal();
    if (!r.ok) return;
    const offset = r.serverNow - (t0 + Date.now()) / 2;
    setState({
      mode: r.mode,
      signal: "signal" in r ? r.signal : undefined,
      history: r.history,
      rate: r.rate,
      gameLink: r.gameLink,
      offset,
      apiConnected: "apiConnected" in r ? Boolean(r.apiConnected) : undefined,
    });
  }

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const serverNow = now + (state?.offset ?? 0);
  const cycle = cycleAt(serverNow);
  const { phase, remainingMs } = phaseAt(serverNow);

  useEffect(() => {
    if (cycle !== lastCycle.current) {
      lastCycle.current = cycle;
      void load();
    }
  }, [cycle]);

  const live = state?.mode === "live";
  const sig = live && state?.signal && state.signal.cycle === cycle ? state.signal : undefined;
  const confirmed = phase === "confirmed" && !!sig;
  const secs = Math.ceil(remainingMs / 1000);
  const rate = state?.rate ?? 0;
  const mood: RobotMood = state?.mode !== "live" ? "off" : confirmed && sig ? sig.side : "scan";

  // Simulated live dice for the round
  const currentDice = simulateDice(cycle);
  const isRolling = phase === "analyzing";

  // Dynamic Island state
  const outcome = outcomeAt(cycle - 1);
  const islandState: IslandState = {
    phase:
      state?.mode === "off"
        ? "idle"
        : !live
        ? "idle"
        : phase === "analyzing"
        ? "analyzing"
        : confirmed
        ? "confirmed"
        : outcome === "GREEN" || outcome === "TIE_GREEN"
        ? "green"
        : outcome === "G1"
        ? "gale"
        : "red",
    side: sig?.side,
    secs,
    outcome,
  };

  return (
    <main className="bg-aurora min-h-screen">
      {/* Floating Dynamic Island Notification */}
      <SignalIsland state={islandState} />

      <div className="mx-auto max-w-md px-4 pb-28 pt-4">
        <header className="grid grid-cols-3 items-center">
          <button onClick={() => void signOut()} aria-label="Sair" className={`${iconBtn} justify-self-start`}>
            <LogOut className="size-4" />
          </button>
          <div className="justify-self-center"><Brand small /></div>
          <div className="flex gap-2 justify-self-end">
            {isAdmin && (
              <Link to="/admin" aria-label="Painel ADM" className={iconBtn}><Shield className="size-4" /></Link>
            )}
            <Bell />
          </div>
        </header>

        <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-center text-sm font-bold text-muted-foreground">
          Olá, <span className="text-foreground">{profile?.full_name || "membro"}</span> 👋 Boas apostas!
        </motion.p>

        {/* Card Alerta: Sem conexão com a mesa */}
        {state && (!state.apiConnected || state.mode === "waiting") && state.mode !== "off" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-3.5 text-destructive flex items-center gap-3"
          >
            <AlertTriangle className="size-5 shrink-0 animate-pulse" />
            <div className="min-w-0 text-xs">
              <p className="font-black uppercase tracking-wider">Sem conexão com a mesa</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">Aguardando restabelecimento do sinal do cassino.</p>
            </div>
          </motion.div>
        )}

        {/* Win Rate Banner */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass mt-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-3xl px-4 py-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-success/15"><Target className="size-5 text-success" /></span>
          <div className="min-w-0">
            <p className="truncate text-xs font-extrabold tracking-wider text-muted-foreground">TAXA DE ACERTO (WIN)</p>
            <p className="truncate text-[11px] text-muted-foreground">Últimas {HISTORY_LIMIT} rodadas (Empate conta como GREEN)</p>
          </div>
          <motion.span key={rate} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl font-black tabular-nums text-success">{rate}%</motion.span>
        </motion.section>

        {/* Percentage Cards */}
        <section className="mt-3 grid grid-cols-3 gap-2.5">
          <PctCard i={0} label="Jogador" dot="🔵" value={sig?.player} tone="primary" active={confirmed && sig?.side === "JOGADOR"} />
          <PctCard i={1} label="Empate" dot="⚪" value={sig?.tie} tone="tie" active={confirmed && sig?.side === "EMPATE"} />
          <PctCard i={2} label="Casa" dot="🔴" value={sig?.banker} tone="destructive" active={confirmed && sig?.side === "CASA"} />
        </section>

        {/* 3D Dice Display of the 4 Bac Bo Dice */}
        <section className="mt-4">
          {mounted ? (
            <Suspense fallback={<div className="h-40 rounded-3xl bg-black/40 animate-pulse" />}>
              <BacBoDice3D
                playerDice={currentDice.playerDice}
                bankerDice={currentDice.bankerDice}
                rolling={isRolling}
              />
            </Suspense>
          ) : (
            <div className="h-40 rounded-3xl bg-black/40" />
          )}
        </section>

        {/* 3D Robot & Signal Decision Box */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-strong relative mt-4 overflow-hidden rounded-[2rem] px-5 pb-6 pt-4 text-center">
          <div className="mx-auto h-40 w-full">
            {mounted ? (
              <Suspense fallback={<div className="size-full" />}><Robot3D mood={mood} /></Suspense>
            ) : <div className="size-full" />}
          </div>
          <AnimatePresence mode="wait">
            {state?.mode === "off" ? (
              <Phase key="off">
                <Power className="mx-auto size-7 text-muted-foreground" />
                <p className="mt-2 text-lg font-black">SISTEMA EM PAUSA</p>
                <p className="mt-1 text-sm text-muted-foreground">O robô está desligado. Os sinais voltam em breve. ⏳</p>
              </Phase>
            ) : !live ? (
              <Phase key="wait">
                <Radio className="mx-auto size-7 animate-pulse text-primary" />
                <p className="mt-2 text-lg font-black">A AGUARDAR A MESA</p>
                <p className="mt-1 text-sm text-muted-foreground">Ainda não há sinais disponíveis. Fique atento, avisamos assim que a mesa abrir. 📡</p>
              </Phase>
            ) : confirmed && sig ? (
              <Phase key={`c${cycle}`}>
                <p className="flex items-center justify-center gap-2 text-sm font-extrabold tracking-[0.2em] text-success"><CircleCheck className="size-4" /> ENTRADA CONFIRMADA</p>
                <motion.p initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} className={`mt-1 text-5xl font-black ${sideText[sig.side]}`}>{sideDot[sig.side]} {sig.side}</motion.p>
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-3 py-1 text-xs font-bold text-muted-foreground"><ShieldCheck className="size-3.5" /> Proteja no EMPATE ⚪ · até 1 gale</p>
                <Countdown secs={secs} total={15} />
                <motion.a whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }} href={state?.gameLink} target="_blank" rel="noreferrer" className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-brand py-4 text-base font-black tracking-widest text-primary-foreground glow-blue">
                  <ExternalLink className="size-5 shrink-0" /> ENTRAR NO JOGO
                </motion.a>
              </Phase>
            ) : (
              <Phase key={`a${cycle}`}>
                <p className="flex items-center justify-center gap-2 text-sm font-extrabold tracking-[0.25em] text-primary"><Activity className="size-4" /> A ANALISAR A MESA...</p>
                <p className="mt-1 text-xs text-muted-foreground">O robô está a ler os padrões dos 4 dados. Próxima entrada em</p>
                <p className="mt-1 text-5xl font-black tabular-nums">{secs}s</p>
              </Phase>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Casino Bead Plate (Roadmap) */}
        <BeadPlate history={state?.history ?? []} />

        {/* History List */}
        <section className="mt-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <h2 className="flex min-w-0 items-center gap-2 text-base font-black"><BarChart3 className="size-5 shrink-0 text-primary" /> <span className="truncate">HISTÓRICO DE RODADAS</span></h2>
            <span className="rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-black text-success">{rate}% WIN</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{state?.history.length ?? 0}/{HISTORY_LIMIT} rodadas · reinicia a cada {HISTORY_LIMIT}</p>
          <div className="glass mt-3 space-y-2 rounded-3xl p-3">
            <AnimatePresence initial={false}>
              {(state?.history ?? []).map((h) => (
                <motion.div layout key={h.cycle} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-secondary/60 px-3 py-2.5">
                  <span className="font-mono text-sm text-muted-foreground">{h.time}</span>
                  <span className={`truncate text-center text-sm font-black ${sideText[h.side]}`}>{sideDot[h.side]} {h.side}</span>
                  <Result o={h.outcome} />
                </motion.div>
              ))}
            </AnimatePresence>
            {state && state.history.length === 0 && <p className="py-5 text-center text-sm text-muted-foreground">🔄 Histórico reiniciado. Novas rodadas a caminho!</p>}
            {!state && <p className="py-6 text-center text-sm text-muted-foreground">A carregar...</p>}
          </div>
        </section>

        <Assistant />
      </div>
    </main>
  );
}

function Phase({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(6px)" }} transition={{ duration: 0.3 }}>
      {children}
    </motion.div>
  );
}

function Result({ o }: { o: HistoryItem["outcome"] }) {
  if (o === "RED") {
    return <span className="flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-black text-destructive"><CircleX className="size-3.5 shrink-0" />RED</span>;
  }
  if (o === "TIE_GREEN") {
    return <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-black text-emerald-400"><CircleCheck className="size-3.5 shrink-0" />EMPATE (GREEN)</span>;
  }
  return <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-black text-success"><CircleCheck className="size-3.5 shrink-0" />{o === "G1" ? "G1" : "GREEN"}</span>;
}

const tones = {
  primary: "text-primary border-primary/40",
  tie: "text-tie border-border",
  destructive: "text-destructive border-destructive/40",
} as const;

function PctCard({ i, label, dot, value, tone, active }: { i: number; label: string; dot: string; value: number | undefined; tone: keyof typeof tones; active: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, scale: active ? 1.06 : 1 }} transition={{ delay: 0.08 + i * 0.05, type: "spring", stiffness: 300, damping: 20 }} className={`glass relative min-w-0 overflow-hidden rounded-3xl border px-2 py-3.5 text-center ${tones[tone]} ${active ? "ring-2 ring-current" : ""}`}>
      <div className="text-lg leading-none">{dot}</div>
      <div className="mt-1.5 truncate text-[11px] font-extrabold uppercase tracking-wider">{label}</div>
      <div className="mt-0.5 text-2xl font-black tabular-nums text-foreground">{value ?? "--"}<span className="text-sm text-muted-foreground">%</span></div>
      {active && <Zap className="absolute right-2 top-2 size-3.5" />}
    </motion.div>
  );
}

function Countdown({ secs, total }: { secs: number; total: number }) {
  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs font-bold text-muted-foreground">
        <span className="flex items-center gap-1"><Timer className="size-3.5" /> JANELA DE APOSTA</span>
        <span className="tabular-nums text-foreground">{secs}s</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, (secs / total) * 100))}%` }} />
      </div>
    </div>
  );
}
