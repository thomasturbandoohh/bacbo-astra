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
  outcome: Outcome;
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

export const HISTORY_LIMIT = 20; // history resets every 20 rounds
export type Outcome = "GREEN" | "G1" | "RED";

/** Per block of 20 rounds: at most 2 REDs, so the hit rate never drops below 90%. */
export function outcomeAt(cycle: number): Outcome {
  const block = Math.floor(cycle / HISTORY_LIMIT);
  const idx = ((cycle % HISTORY_LIMIT) + HISTORY_LIMIT) % HISTORY_LIMIT;
  const r = rand(block * 7919 + 3);
  r();
  const order = Array.from({ length: HISTORY_LIMIT }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const a = order[i]!, b = order[j]!;
    order[i] = b; order[j] = a;
  }
  const nRed = Math.floor(r() * 3); // 0–2
  const nG1 = 1 + Math.floor(r() * 3); // 1–3
  const pos = order.indexOf(idx);
  if (pos < nRed) return "RED";
  if (pos < nRed + nG1) return "G1";
  return "GREEN";
}

export function simulateWin(cycle: number): boolean {
  return outcomeAt(cycle) !== "RED";
}

function item(c: number): HistoryItem {
  const d = new Date(c * CYCLE_MS + ANALYZE_MS);
  return {
    cycle: c,
    time: d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Luanda" }),
    side: simulateSignal(c).side,
    win: simulateWin(c),
    outcome: outcomeAt(c),
  };
}

/** Rounds of the current block of 20 (newest first); resets when the block fills. */
export function buildHistory(nowCycle: number): HistoryItem[] {
  const start = Math.floor(nowCycle / HISTORY_LIMIT) * HISTORY_LIMIT;
  const items: HistoryItem[] = [];
  for (let c = nowCycle - 1; c >= start; c--) items.push(item(c));
  return items;
}

/** Rate shown: current block, or the previous full block right after a reset. */
export function displayRate(nowCycle: number, items: HistoryItem[]): number {
  if (items.length > 0) return winRate(items);
  const start = Math.floor(nowCycle / HISTORY_LIMIT) * HISTORY_LIMIT - HISTORY_LIMIT;
  return winRate(Array.from({ length: HISTORY_LIMIT }, (_, i) => item(start + i)));
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
