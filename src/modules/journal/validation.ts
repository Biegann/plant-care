import { isValidIsoDate } from "../../shared/utils/date";

export const MAX_NOTE_LENGTH = 4000;

export type JournalInput = {
  // Data wpisu jako RRRR-MM-DD
  entryOn: string;
  note: string;
  // Czy wpis będzie miał zdjęcie (nowe albo zostawione)
  hasPhoto: boolean;
};

export type JournalInputErrors = {
  // Brak i notatki, i zdjęcia
  entry?: "empty";
  note?: "noteTooLong";
  entryOn?: "invalidDate" | "futureDate";
};

// today: dzisiejsza data z telefonu (RRRR-MM-DD); wpis nie może być z przyszłości
export function validateJournalInput(
  input: JournalInput,
  today: string,
): JournalInputErrors {
  const errors: JournalInputErrors = {};
  const note = input.note.trim();

  if (!note && !input.hasPhoto) errors.entry = "empty";
  if (note.length > MAX_NOTE_LENGTH) errors.note = "noteTooLong";

  if (!isValidIsoDate(input.entryOn)) errors.entryOn = "invalidDate";
  // Daty RRRR-MM-DD można porównywać jak tekst
  else if (input.entryOn > today) errors.entryOn = "futureDate";

  return errors;
}

export type NormalizedJournalInput = { entryOn: string; note: string | null };

export function normalizeJournalInput(
  input: JournalInput,
): NormalizedJournalInput {
  const note = input.note.trim();
  return { entryOn: input.entryOn, note: note || null };
}
