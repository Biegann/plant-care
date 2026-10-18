import {
  normalizeJournalInput,
  validateJournalInput,
  type JournalInput,
} from "../validation";

const TODAY = "2026-10-14";
const input = (overrides: Partial<JournalInput> = {}): JournalInput => ({
  entryOn: TODAY,
  note: "Nowy liść",
  hasPhoto: false,
  ...overrides,
});

describe("validateJournalInput", () => {
  test("sama notatka: poprawny wpis", () => {
    expect(validateJournalInput(input(), TODAY)).toEqual({});
  });

  test("samo zdjęcie: poprawny wpis", () => {
    expect(
      validateJournalInput(input({ note: "  ", hasPhoto: true }), TODAY),
    ).toEqual({});
  });

  test("bez notatki i zdjęcia: pusty wpis", () => {
    expect(validateJournalInput(input({ note: "   " }), TODAY)).toEqual({
      entry: "empty",
    });
  });

  test("notatka: 4000 znaków przechodzi, 4001 nie", () => {
    expect(
      validateJournalInput(input({ note: "a".repeat(4000) }), TODAY),
    ).toEqual({});
    expect(
      validateJournalInput(input({ note: "a".repeat(4001) }), TODAY),
    ).toEqual({ note: "noteTooLong" });
  });

  test("data z przyszłości: błąd, wcześniejsza: dobrze", () => {
    expect(
      validateJournalInput(input({ entryOn: "2026-10-15" }), TODAY),
    ).toEqual({ entryOn: "futureDate" });
    expect(
      validateJournalInput(input({ entryOn: "2025-01-01" }), TODAY),
    ).toEqual({});
  });

  test("niepoprawna data: błąd", () => {
    expect(
      validateJournalInput(input({ entryOn: "2026-02-30" }), TODAY),
    ).toEqual({ entryOn: "invalidDate" });
  });
});

describe("normalizeJournalInput", () => {
  test("przycina notatkę, a pustą zamienia na null", () => {
    expect(normalizeJournalInput(input({ note: "  Liść  " }))).toEqual({
      entryOn: TODAY,
      note: "Liść",
    });
    expect(normalizeJournalInput(input({ note: "  " })).note).toBeNull();
  });
});
