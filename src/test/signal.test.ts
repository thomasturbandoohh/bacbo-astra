import { describe, expect, it } from "vitest";
import { phaseAt, simulateSignal, winRate, renderTemplate, buildHistory, displayRate, outcomeAt, CYCLE_MS } from "@/lib/signal";

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
    expect(winRate([{ cycle: 1, time: "", side: "CASA", win: true, outcome: "GREEN" }, { cycle: 2, time: "", side: "CASA", win: false, outcome: "RED" }])).toBe(50);
  });
  it("template", () => {
    expect(renderTemplate("{entrada} {tempo} {link}", { entrada: "CASA", tempo: 15, link: "x" })).toBe("CASA 15 x");
  });
  it("every block of 20 rounds has at least 90% hits", () => {
    for (let b = 0; b < 500; b++) {
      const reds = Array.from({ length: 20 }, (_, i) => outcomeAt(b * 20 + i)).filter((o) => o === "RED").length;
      expect(reds).toBeLessThanOrEqual(2);
    }
  });
  it("history holds at most 20 rounds and resets", () => {
    expect(buildHistory(40 * 20 + 19)).toHaveLength(19);
    expect(buildHistory(40 * 20)).toHaveLength(0);
    expect(displayRate(40 * 20, [])).toBeGreaterThanOrEqual(90);
  });
});
