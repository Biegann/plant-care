jest.mock("../../../shared/api/supabase", () => ({
  supabase: { from: jest.fn(), storage: { from: jest.fn() } },
}));

import { supabase } from "../../../shared/api/supabase";
import {
  createJournalEntry,
  deleteJournalEntry,
  listJournal,
  mapJournalError,
  updateJournalEntry,
  type JournalEntry,
} from "../api/journalApi";

const db = supabase as unknown as {
  from: jest.Mock;
  storage: { from: jest.Mock };
};
const storage = { upload: jest.fn(), remove: jest.fn() };

// Udaje łańcuch zapytań Supabase (from().select().eq()...), który na końcu zwraca wynik
function chain(result: unknown) {
  const builder = {} as Record<string, jest.Mock>;
  [
    "select",
    "eq",
    "order",
    "limit",
    "insert",
    "update",
    "delete",
    "single",
  ].forEach((method) => {
    builder[method] = jest.fn(() => builder);
  });
  Object.assign(builder, {
    then: (resolve: (value: unknown) => unknown) => resolve(result),
  });
  return builder;
}

const row = {
  id: "j1",
  plant_id: "p1",
  entry_on: "2026-10-12",
  note: "Nowy liść",
  photo_path: "g1/journal/a.jpg",
  created_at: "2026-10-12T10:00:00Z",
  created_by_profile: { display_name: "Anna" },
};

const entry: JournalEntry = {
  id: "j1",
  plantId: "p1",
  entryOn: "2026-10-12",
  note: "Nowy liść",
  photoPath: "g1/journal/a.jpg",
  createdByName: "Anna",
  createdAt: "2026-10-12T10:00:00Z",
};

const buffer = new ArrayBuffer(8);
const input = { entryOn: "2026-10-12", note: " Nowy liść ", hasPhoto: false };

beforeEach(() => {
  db.storage.from.mockReturnValue(storage);
});

afterEach(() => jest.resetAllMocks());

describe("mapJournalError", () => {
  test("mapuje kody bazy", () => {
    expect(mapJournalError({ code: "23514" })).toBe("invalidInput");
    expect(mapJournalError({ code: "42501" })).toBe("notAllowed");
    expect(mapJournalError({ code: "XX" })).toBe("unknown");
  });
});

describe("listJournal", () => {
  test("zwraca wpisy z nazwą autora, od najnowszych", async () => {
    const query = chain({ data: [row], error: null });
    db.from.mockReturnValue(query);

    expect(await listJournal("p1")).toEqual({ ok: true, data: [entry] });
    expect(db.from).toHaveBeenCalledWith("plant_journal");
    expect(query.eq).toHaveBeenCalledWith("plant_id", "p1");
    expect(query.order).toHaveBeenNthCalledWith(1, "entry_on", {
      ascending: false,
    });
  });

  test("wpis bez autora: nazwa null", async () => {
    db.from.mockReturnValue(
      chain({ data: [{ ...row, created_by_profile: null }], error: null }),
    );

    const result = await listJournal("p1");

    expect(result.ok && result.data[0].createdByName).toBeNull();
  });

  test("błąd bazy: kod błędu", async () => {
    db.from.mockReturnValue(chain({ data: null, error: { code: "42501" } }));

    expect(await listJournal("p1")).toEqual({ ok: false, error: "notAllowed" });
  });
});

describe("createJournalEntry", () => {
  test("niepoprawne dane: nic nie wysyła", async () => {
    const result = await createJournalEntry("g1", "p1", {
      ...input,
      note: "",
    });

    expect(result).toEqual({ ok: false, error: "invalidInput" });
    expect(db.from).not.toHaveBeenCalled();
  });

  test("sama notatka: zapisuje przyciętą notatkę bez zdjęcia", async () => {
    const query = chain({ data: { ...row, photo_path: null }, error: null });
    db.from.mockReturnValue(query);

    const result = await createJournalEntry("g1", "p1", input);

    expect(result.ok).toBe(true);
    expect(query.insert).toHaveBeenCalledWith({
      plant_id: "p1",
      entry_on: "2026-10-12",
      note: "Nowy liść",
      photo_path: null,
    });
    expect(storage.upload).not.toHaveBeenCalled();
  });

  test("samo zdjęcie: najpierw wysyła plik do folderu journal", async () => {
    storage.upload.mockResolvedValue({ error: null });
    const query = chain({ data: { ...row, note: null }, error: null });
    db.from.mockReturnValue(query);

    const result = await createJournalEntry(
      "g1",
      "p1",
      { ...input, note: "" },
      buffer,
    );

    expect(result.ok).toBe(true);
    const path = storage.upload.mock.calls[0][0] as string;
    expect(path).toMatch(/^g1\/journal\/[a-z0-9]+\.jpg$/);
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({ note: null, photo_path: path }),
    );
  });

  test("nieudane wysłanie zdjęcia: nie zapisuje wpisu", async () => {
    storage.upload.mockResolvedValue({ error: { message: "x" } });

    const result = await createJournalEntry("g1", "p1", input, buffer);

    expect(result).toEqual({ ok: false, error: "photoUpload" });
    expect(db.from).not.toHaveBeenCalled();
  });

  test("błąd zapisu wpisu: usuwa wysłane zdjęcie", async () => {
    storage.upload.mockResolvedValue({ error: null });
    db.from.mockReturnValue(chain({ data: null, error: { code: "42501" } }));

    const result = await createJournalEntry("g1", "p1", input, buffer);

    expect(result).toEqual({ ok: false, error: "notAllowed" });
    expect(storage.remove).toHaveBeenCalledWith([
      storage.upload.mock.calls[0][0],
    ]);
  });
});

describe("updateJournalEntry", () => {
  test("bez zmiany zdjęcia: zapisuje pola i zostawia plik", async () => {
    const query = chain({ error: null, count: 1 });
    db.from.mockReturnValue(query);

    const result = await updateJournalEntry("g1", entry, input, undefined);

    expect(result).toEqual({ ok: true, data: null });
    expect(query.update).toHaveBeenCalledWith(
      {
        entry_on: "2026-10-12",
        note: "Nowy liść",
        photo_path: "g1/journal/a.jpg",
      },
      { count: "exact" },
    );
    expect(storage.remove).not.toHaveBeenCalled();
  });

  test("nowe zdjęcie: po udanym zapisie usuwa stare", async () => {
    storage.upload.mockResolvedValue({ error: null });
    db.from.mockReturnValue(chain({ error: null, count: 1 }));

    await updateJournalEntry("g1", entry, input, buffer);

    expect(storage.remove).toHaveBeenCalledWith(["g1/journal/a.jpg"]);
  });

  test("nowe zdjęcie, nieudany zapis: usuwa nowe, stare zostaje", async () => {
    storage.upload.mockResolvedValue({ error: null });
    db.from.mockReturnValue(chain({ error: null, count: 0 }));

    const result = await updateJournalEntry("g1", entry, input, buffer);

    expect(result).toEqual({ ok: false, error: "notAllowed" });
    const uploaded = storage.upload.mock.calls[0][0];
    expect(storage.remove).toHaveBeenCalledTimes(1);
    expect(storage.remove).toHaveBeenCalledWith([uploaded]);
  });

  test("usunięcie zdjęcia: zapisuje null i usuwa plik", async () => {
    const query = chain({ error: null, count: 1 });
    db.from.mockReturnValue(query);

    await updateJournalEntry("g1", entry, input, "remove");

    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({ photo_path: null }),
      { count: "exact" },
    );
    expect(storage.remove).toHaveBeenCalledWith(["g1/journal/a.jpg"]);
  });

  test("usunięcie zdjęcia przy pustej notatce: pusty wpis, nic nie zapisuje", async () => {
    const result = await updateJournalEntry(
      "g1",
      entry,
      { ...input, note: "" },
      "remove",
    );

    expect(result).toEqual({ ok: false, error: "invalidInput" });
    expect(db.from).not.toHaveBeenCalled();
  });
});

describe("deleteJournalEntry", () => {
  test("usuwa wpis, a potem jego zdjęcie", async () => {
    db.from.mockReturnValue(chain({ error: null, count: 1 }));

    expect(await deleteJournalEntry(entry)).toEqual({ ok: true, data: null });
    expect(storage.remove).toHaveBeenCalledWith(["g1/journal/a.jpg"]);
  });

  test("0 usuniętych wierszy: brak uprawnień i plik zostaje", async () => {
    db.from.mockReturnValue(chain({ error: null, count: 0 }));

    expect(await deleteJournalEntry(entry)).toEqual({
      ok: false,
      error: "notAllowed",
    });
    expect(storage.remove).not.toHaveBeenCalled();
  });
});
