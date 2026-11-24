import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, ExternalLink, LogOut, Power, Shield, TrendingUp } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getSignal } from "@/lib/astra.functions";
import { cycleAt, phaseAt, winRate, type HistoryItem, type Side, type Signal } from "@/lib/signal";
import { useAuth } from "@/hooks/useAuth";
import { Brand } from "./Brand";
import { Bell } from "./Bell";
import { Assistant } from "./Assistant";

type State = { off: boolean; signal: Signal | undefined; history: HistoryItem[]; gameLink: string; offset: number };

const sideStyle: Record<Side, string> = {
  JOGADOR: "text-primary",
  CASA: "text-destructive",
  EMPATE: "text-tie",
};
const sideDot: Record<Side, string> = { JOGADOR: "🔵", CASA: "🔴", EMPATE: "⚪" };

export function Dashboard() {
  const { isAdmin, signOut, profile } = useAuth();
  const fetchSignal = useServerFn(getSignal);
  const [state, setState] = useState<State | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const lastCycle = useRef<number>(-1);

  async function load() {
    const t0 = Date.now();
    const r = await fetchSignal();
    if (!r.ok) return;
    const offset = "serverNow" in r && r.serverNow ? r.serverNow - (t0 + Date.now()) / 2 : 0;
    setState({ off: r.off, signal: "signal" in r ? r.signal : undefined, history: r.history, gameLink: r.gameLink, offset });
  }

  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle]);

  const sig = state?.signal && state.signal.cycle === cycle ? state.signal : undefined;
  const confirmed = !state?.off && phase === "confirmed" && !!sig;
  const secs = Math.ceil(remainingMs / 1000);
  const rate = useMemo(() => winRate(state?.history ?? []), [state?.history]);

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-28 pt-4">
      <header className="flex items-center justify-between">
        <button onClick={() => void signOut()} aria-label="Sair" className="flex size-10 items-center justify-center rounded-xl border border-border bg-card">
          <LogOut className="size-4" />
        </button>
        <Brand small />
        <div className="flex gap-2">
          {isAdmin && (
            <Link to="/admin" aria-label="Painel ADM" className="flex size-10 items-center justify-center rounded-xl border border-border bg-card">
              <Shield className="size-4" />
            </Link>
          )}
          <Bell />
        </div>
      </header>

      <p className="mt-4 text-center text-xs font-bold text-muted-foreground">Olá, {profile?.full_name || "membro"} 👋</p>

      <section className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-4">
        <span className="flex items-center gap-2 text-sm font-extrabold tracking-wider text-muted-foreground">
          <TrendingUp className="size-5 text-primary" /> TAXA DE ACERTO
        </span>
        <span className="text-2xl font-black text-success">{rate}%</span>
      </section>

      <section className="mt-3 grid grid-cols-3 gap-2.5">
        <PctCard label="JOGADOR" dot="🔵" value={sig?.player} cls="border-primary/50 bg-primary/10 text-primary" active={confirmed && sig?.side === "JOGADOR"} />
        <PctCard label="EMPATE" dot="⚪" value={sig?.tie} cls="border-border bg-secondary text-tie" active={confirmed && sig?.side === "EMPATE"} />
        <PctCard label="CASA" dot="🔴" value={sig?.banker} cls="border-destructive/50 bg-destructive/10 text-destructive" active={confirmed && sig?.side === "CASA"} />
      </section>

      <section className="mt-4 rounded-3xl border border-border bg-card px-5 py-7 text-center">
        {state?.off ? (
          <div className="py-6">
            <Power className="mx-auto size-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-black">SISTEMA EM PAUSA</p>
            <p className="mt-1 text-sm text-muted-foreground">Os sinais voltam em breve.</p>
          </div>
        ) : (
          <>
            <Radar confirmed={confirmed} side={sig?.side} />
            {confirmed && sig ? (
              <>
                <p className="mt-6 text-sm font-extrabold tracking-[0.2em] text-success">✅ ENTRADA CONFIRMADA</p>
                <p className={`mt-1 text-4xl font-black ${sideStyle[sig.side]}`}>{sig.side}</p>
                <p className="mt-1 text-xs font-bold text-muted-foreground">Proteger no EMPATE</p>
                <Countdown secs={secs} total={15} />
                <a href={state?.gameLink} target="_blank" rel="noreferrer" className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-brand py-4 text-base font-black tracking-widest text-primary-foreground glow-blue">
                  <ExternalLink className="size-5" /> ENTRAR NO JOGO
                </a>
              </>
            ) : (
              <>
                <p className="mt-6 text-sm font-extrabold tracking-[0.25em] text-primary">ANALISANDO...</p>
                <p className="mt-1 text-xs text-muted-foreground">Próxima entrada em</p>
                <p className="text-4xl font-black tabular-nums">{secs}s</p>
              </>
            )}
          </>
        )}
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-black"><BarChart3 className="size-5 text-primary" /> HISTÓRICO DE ASSERTIVIDADE</h2>
          <span className="rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-black text-success">{rate}% WIN</span>
        </div>
        <div className="mt-3 space-y-2 rounded-2xl border border-border bg-card p-3">
          {(state?.history ?? []).map((h) => (
            <div key={h.cycle} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-secondary px-3 py-2.5">
              <span className="font-mono text-sm text-muted-foreground">{h.time}</span>
              <span className={`text-center text-sm font-black ${sideStyle[h.side]}`}>{sideDot[h.side]} {h.side}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${h.win ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{h.win ? "✅ WIN" : "❌ LOSS"}</span>
            </div>
          ))}
          {!state && <p className="py-6 text-center text-sm text-muted-foreground">A carregar...</p>}
        </div>
      </section>

      <Assistant />
    </main>
  );
}

function PctCard({ label, dot, value, cls, active }: { label: string; dot: string; value: number | undefined; cls: string; active: boolean }) {
  return (
    <div className={`rounded-2xl border px-2 py-4 text-center transition ${cls} ${active ? "scale-[1.04] ring-2 ring-current" : ""}`}>
      <div className="text-[11px] font-extrabold tracking-wider">{dot} {label}</div>
      <div className="mt-1 text-2xl font-black tabular-nums">{value ?? "--"}%</div>
    </div>
  );
}

function Radar({ confirmed, side }: { confirmed: boolean; side: Side | undefined }) {
  const color = confirmed ? (side === "CASA" ? "border-destructive glow-red" : side === "EMPATE" ? "border-tie" : "border-primary glow-blue") : "border-primary/60";
  const core = confirmed ? (side === "CASA" ? "bg-destructive" : side === "EMPATE" ? "bg-tie" : "bg-primary") : "bg-primary/70";
  return (
    <div className={`relative mx-auto size-36 rounded-full border-2 ${color}`}>
      <div className="absolute inset-4 rounded-full border border-border" />
      <div className="absolute inset-9 rounded-full border border-border" />
      {!confirmed && (
        <div className="absolute inset-0 animate-sweep rounded-full" style={{ background: "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, var(--primary) 55%, transparent) 60deg, transparent 61deg)" }} />
      )}
      {confirmed && <div className={`absolute inset-10 animate-ring rounded-full ${core} opacity-60`} />}
      <div className={`absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full ${core}`} />
    </div>
  );
}

function Countdown({ secs, total }: { secs: number; total: number }) {
  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs font-bold text-muted-foreground">
        <span>JANELA DE APOSTAS</span>
        <span className="tabular-nums text-foreground">{secs}s</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-brand transition-all duration-300" style={{ width: `${Math.max(0, (secs / total) * 100)}%` }} />
      </div>
    </div>
  );
}
