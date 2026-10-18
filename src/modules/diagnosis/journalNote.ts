import { MAX_NOTE_LENGTH } from "../journal/validation";
import type { DiagnosisResult } from "./api/diagnosisApi";

// Notatka do dziennika: "Diagnoza AI: <podsumowanie> Co zrobić: 1. ... 2. ..."
// Kończy się na ostatnim kroku. Funkcja przycina każdy tekst do 600 znaków i daje
// najwyżej 5 kroków, więc notatka ma najwyżej ok. 3650 znaków i mieści się w limicie;
// przycięcie z wielokropkiem to tylko zabezpieczenie przed odrzuceniem przez bazę
export function buildJournalNote(
  result: DiagnosisResult,
  labels: { prefix: string; steps: string },
): string {
  let note = `${labels.prefix} ${result.summary}`;
  if (result.steps.length > 0) {
    const steps = result.steps.map((step, i) => `${i + 1}. ${step}`).join(" ");
    note += ` ${labels.steps} ${steps}`;
  }
  if (note.length <= MAX_NOTE_LENGTH) return note;
  return `${note.slice(0, MAX_NOTE_LENGTH - 1).trimEnd()}…`;
}
