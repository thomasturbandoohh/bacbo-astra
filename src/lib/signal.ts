// Pure Bac Bo signal cycle logic, shared by server and client.
export type Side = "JOGADOR" | "CASA" | "EMPATE";

export const CYCLE_MS = 30_000; // one Bac Bo round
export const ANALYZE_MS = 15_000; // analysing phase
export const BET_WINDOW_MS = 15_000; // betting window (~15 s)

export interface Signal {
  cycle: number;
  side: Side;
  player: number;
  tie: number;
  banker: number;
}

export interface HistoryItem {
  cycle: number;
  time: string;
  side: Side;
  win: boolean;
}

function rand(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

export function cycleAt(now: number): number {
  return Math.floor(now / CYCLE_MS);
}

export function phaseAt(now: number): { phase: "analyzing" | "confirmed"; remainingMs: number } {
  const t = now % CYCLE_MS;
  if (t < ANALYZE_MS) return { phase: "analyzing", remainingMs: ANALYZE_MS - t };
  return { phase: "confirmed", remainingMs: CYCLE_MS - t };
}

/** Deterministic simulation: every user sees the same signal for a given round. */
export function simulateSignal(cycle: number): Signal {
  const r = rand(cycle * 2654435761);
  r();
  const tie = 8 + Math.round(r() * 6); // 8–14
  const playerShare = 0.3 + r() * 0.4;
  const rest = 100 - tie;
  const player = Math.round(rest * playerShare);
  const banker = rest - player;
  const side: Side = player >= banker ? "JOGADOR" : "CASA";
  return { cycle, side, player, tie, banker };
}

/** Result of a past round: ~93% win rate. */
export function simulateWin(cycle: number): boolean {
  const r = rand(cycle * 40503 + 7);
  r();
  return r() < 0.93;
}

export function buildHistory(nowCycle: number, count = 15): HistoryItem[] {
  const items: HistoryItem[] = [];
  for (let c = nowCycle - 1; c > nowCycle - 1 - count; c--) {
    const d = new Date(c * CYCLE_MS + ANALYZE_MS);
    items.push({
      cycle: c,
      time: d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Luanda" }),
      side: simulateSignal(c).side,
      win: simulateWin(c),
    });
  }
  return items;
}

export function winRate(items: HistoryItem[]): number {
  if (items.length === 0) return 0;
  return Math.round((items.filter((i) => i.win).length / items.length) * 1000) / 10;
}

export function renderTemplate(tpl: string, v: { entrada: string; tempo: number; link: string }): string {
  return tpl
    .replaceAll("{entrada}", v.entrada)
    .replaceAll("{tempo}", String(v.tempo))
    .replaceAll("{link}", v.link);
}
