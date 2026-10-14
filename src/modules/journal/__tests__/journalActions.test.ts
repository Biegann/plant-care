jest.mock("../../../shared/api/supabase", () => ({ supabase: { auth: {} } }));
jest.mock("../api/journalApi", () => ({
  createJournalEntry: jest.fn(),
  updateJournalEntry: jest.fn(),
  deleteJournalEntry: jest.fn(),
}));

import { queryClient } from "../../../shared/api/queryClient";
import {
  createJournalEntry,
  deleteJournalEntry,
  updateJournalEntry,
  type JournalEntry,
} from "../api/journalApi";
import {
  createJournalEntryAndRefresh,
  deleteJournalEntryAndRefresh,
  updateJournalEntryAndRefresh,
} from "../journalActions";

const mockCreate = createJournalEntry as jest.Mock;
const mockUpdate = updateJournalEntry as jest.Mock;
const mockDelete = deleteJournalEntry as jest.Mock;

const entry = { id: "j1", plantId: "p1", photoPath: null } as JournalEntry;
const input = { entryOn: "2026-10-14", note: "Liść", hasPhoto: false };
const ok = { ok: true, data: null };
const failed = { ok: false, error: "notAllowed" };
const refreshed = { queryKey: ["journal", "p1"] };

let invalidate: jest.SpyInstance;

beforeEach(() => {
  invalidate = jest
    .spyOn(queryClient, "invalidateQueries")
    .mockResolvedValue(undefined);
});

afterEach(() => {
  invalidate.mockRestore();
  jest.resetAllMocks();
});

describe("journalActions", () => {
  test("dodanie: zapisuje i odświeża dziennik rośliny", async () => {
    mockCreate.mockResolvedValue(ok);

    await createJournalEntryAndRefresh("g1", "p1", input);

    expect(mockCreate).toHaveBeenCalledWith("g1", "p1", input, undefined);
    expect(invalidate).toHaveBeenCalledWith(refreshed);
  });

  test("zmiana: zapisuje i odświeża", async () => {
    mockUpdate.mockResolvedValue(ok);

    await updateJournalEntryAndRefresh("g1", entry, input, "remove");

    expect(mockUpdate).toHaveBeenCalledWith("g1", entry, input, "remove");
    expect(invalidate).toHaveBeenCalledWith(refreshed);
  });

  test("usunięcie: usuwa i odświeża", async () => {
    mockDelete.mockResolvedValue(ok);

    await deleteJournalEntryAndRefresh(entry);

    expect(invalidate).toHaveBeenCalledWith(refreshed);
  });

  test("błąd: nie odświeża i zwraca kod błędu", async () => {
    mockCreate.mockResolvedValue(failed);
    mockDelete.mockResolvedValue(failed);

    expect(await createJournalEntryAndRefresh("g1", "p1", input)).toEqual(
      failed,
    );
    expect(await deleteJournalEntryAndRefresh(entry)).toEqual(failed);
    expect(invalidate).not.toHaveBeenCalled();
  });
});
