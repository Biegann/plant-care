import type { DiagnosisResult } from "../api/diagnosisApi";
import { buildJournalNote } from "../journalNote";

const labels = { prefix: "Diagnoza AI:", steps: "Co zrobić:" };

const result: DiagnosisResult = {
  notPlant: false,
  summary: "Prawdopodobnie przesuszenie.",
  causes: [],
  steps: ["Podlej obficie", "Zraszaj liście"],
  worryIf: [],
};

describe("buildJournalNote", () => {
  test("podsumowanie i ponumerowane kroki", () => {
    expect(buildJournalNote(result, labels)).toBe(
      "Diagnoza AI: Prawdopodobnie przesuszenie. Co zrobić: 1. Podlej obficie 2. Zraszaj liście",
    );
  });

  test("bez kroków: samo podsumowanie", () => {
    expect(buildJournalNote({ ...result, steps: [] }, labels)).toBe(
      "Diagnoza AI: Prawdopodobnie przesuszenie.",
    );
  });

  test("najdłuższy możliwy wynik funkcji (600 znaków x podsumowanie i 5 kroków): cały, kończy się ostatnim krokiem", () => {
    const steps = ["a", "b", "c", "d", "e"].map((c) => c.repeat(600));
    const note = buildJournalNote(
      { ...result, summary: "s".repeat(600), steps },
      labels,
    );
    expect(note.length).toBeLessThanOrEqual(4000);
    expect(note.endsWith(`5. ${"e".repeat(600)}`)).toBe(true);
  });

  test("zabezpieczenie: tekst ponad limit przycięty do 4000 znaków z wielokropkiem", () => {
    const note = buildJournalNote(
      { ...result, steps: ["a".repeat(3000), "b".repeat(3000)] },
      labels,
    );
    expect(note).toHaveLength(4000);
    expect(note.endsWith("…")).toBe(true);
  });
});
