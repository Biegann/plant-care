jest.mock("../../../shared/api/supabase", () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from "../../../shared/api/supabase";
import {
    CARE_LOG_LIMIT,
    deleteCareLogEntry,
    listCareLog,
    toCareLogEntry,
} from "../api/careLogApi";

const db = supabase as unknown as { from: jest.Mock };

// Udaje łańcuch zapytań Supabase (from().select().eq()...), który na końcu zwraca wynik
function chain(result: unknown) {
  const builder = {} as Record<string, jest.Mock>;
  ["select", "eq", "order", "limit", "delete"].forEach((method) => {
    builder[method] = jest.fn(() => builder);
  });
  Object.assign(builder, {
    then: (resolve: (value: unknown) => unknown) => resolve(result),
  });
  return builder;
}

const row = {
  id: "e1",
  plant_id: "p1",
  type: "water" as const,
  custom_label: null,
  done_on: "2026-10-12",
  done_by_profile: { display_name: "Przemek" },
};

afterEach(() => jest.resetAllMocks());

describe("toCareLogEntry", () => {
  test("zamienia kolumny bazy na pola wpisu", () => {
    expect(toCareLogEntry(row)).toEqual({
      id: "e1",
      plantId: "p1",
      type: "water",
      customLabel: null,
      doneOn: "2026-10-12",
      doneByName: "Przemek",
    });
  });

  test("brak profilu lub nazwy: wpis bez nazwy osoby", () => {
    expect(toCareLogEntry({ ...row, done_by_profile: null }).doneByName).toBeNull();
    expect(
      toCareLogEntry({ ...row, done_by_profile: { display_name: null } })
        .doneByName,
    ).toBeNull();
  });
});

describe("listCareLog", () => {
  test("pobiera wpisy rośliny od najnowszych, z limitem", async () => {
    const query = chain({ data: [row], error: null });
    db.from.mockReturnValue(query);

    const result = await listCareLog("p1");

    expect(db.from).toHaveBeenCalledWith("care_log");
    expect(query.eq).toHaveBeenCalledWith("plant_id", "p1");
    expect(query.order).toHaveBeenNthCalledWith(1, "done_on", {
      ascending: false,
    });
    expect(query.order).toHaveBeenNthCalledWith(2, "created_at", {
      ascending: false,
    });
    expect(query.limit).toHaveBeenCalledWith(CARE_LOG_LIMIT);
    expect(result).toEqual({ ok: true, data: [toCareLogEntry(row)] });
  });

  test("błąd bazy: zwraca kod błędu", async () => {
    db.from.mockReturnValue(chain({ data: null, error: { code: "42501" } }));

    expect(await listCareLog("p1")).toEqual({ ok: false, error: "notAllowed" });
  });
});

describe("deleteCareLogEntry", () => {
  test("usuwa wpis", async () => {
    const query = chain({ error: null, count: 1 });
    db.from.mockReturnValue(query);

    expect(await deleteCareLogEntry("e1")).toEqual({ ok: true, data: null });
    expect(query.eq).toHaveBeenCalledWith("id", "e1");
  });

  test("nic nie usunięto: zwraca notAllowed", async () => {
    db.from.mockReturnValue(chain({ error: null, count: 0 }));

    expect(await deleteCareLogEntry("e1")).toEqual({
      ok: false,
      error: "notAllowed",
    });
  });
});
