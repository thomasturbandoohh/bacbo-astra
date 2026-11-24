import { describe, expect, it } from "vitest";
import { phaseAt, simulateSignal, winRate, renderTemplate, CYCLE_MS } from "@/lib/signal";

describe("signal cycle", () => {
  it("betting window lasts 15 seconds after analysis", () => {
    expect(phaseAt(0).phase).toBe("analyzing");
    expect(phaseAt(15_000).phase).toBe("confirmed");
    expect(phaseAt(15_000).remainingMs).toBe(15_000);
    expect(phaseAt(CYCLE_MS - 1).phase).toBe("confirmed");
  });
  it("percentages sum to 100 and entry is the strongest side", () => {
    for (let c = 1; c < 200; c++) {
      const s = simulateSignal(c);
      expect(s.player + s.tie + s.banker).toBe(100);
      expect(s.side).toBe(s.player >= s.banker ? "JOGADOR" : "CASA");
    }
  });
  it("win rate", () => {
    expect(winRate([{ cycle: 1, time: "", side: "CASA", win: true }, { cycle: 2, time: "", side: "CASA", win: false }])).toBe(50);
  });
  it("template", () => {
    expect(renderTemplate("{entrada} {tempo} {link}", { entrada: "CASA", tempo: 15, link: "x" })).toBe("CASA 15 x");
  });
});
