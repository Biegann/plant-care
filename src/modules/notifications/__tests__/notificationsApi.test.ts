jest.mock("../../../shared/api/supabase", () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from "../../../shared/api/supabase";
import { listNotifiableTasks, toNotifiableTask } from "../api/notificationsApi";

const db = supabase as unknown as { from: jest.Mock };

// Udaje łańcuch zapytań Supabase (from().select().eq()...), który na końcu zwraca wynik
function chain(result: unknown) {
  const builder = {} as Record<string, jest.Mock>;
  ["select", "eq", "is", "order"].forEach((method) => {
    builder[method] = jest.fn(() => builder);
  });
  Object.assign(builder, {
    then: (resolve: (value: unknown) => unknown) => resolve(result),
  });
  return builder;
}

const row = {
  type: "other" as const,
  custom_label: "Zraszanie",
  next_due_on: "2026-10-15",
  enabled: true,
  plants: { name: "Monstera" },
};

afterEach(() => jest.resetAllMocks());

describe("toNotifiableTask", () => {
  test("zamienia kolumny bazy na pola zadania z nazwą rośliny", () => {
    expect(toNotifiableTask(row)).toEqual({
      type: "other",
      customLabel: "Zraszanie",
      plantName: "Monstera",
      nextDueOn: "2026-10-15",
      enabled: true,
    });
  });
});

describe("listNotifiableTasks", () => {
  test("pobiera włączone zadania niezarchiwizowanych roślin, bez filtra ogrodu", async () => {
    const query = chain({ data: [row], error: null });
    db.from.mockReturnValue(query);

    const result = await listNotifiableTasks();

    expect(db.from).toHaveBeenCalledWith("care_tasks");
    expect(query.eq).toHaveBeenCalledTimes(1);
    expect(query.eq).toHaveBeenCalledWith("enabled", true);
    expect(query.is).toHaveBeenCalledWith("plants.archived_at", null);
    expect(result).toEqual({ ok: true, data: [toNotifiableTask(row)] });
  });

  test("brak danych: pusta lista", async () => {
    db.from.mockReturnValue(chain({ data: null, error: null }));

    expect(await listNotifiableTasks()).toEqual({ ok: true, data: [] });
  });

  test("błąd bazy: zwraca kod błędu", async () => {
    db.from.mockReturnValue(chain({ data: null, error: { code: "42501" } }));

    expect(await listNotifiableTasks()).toEqual({
      ok: false,
      error: "notAllowed",
    });
  });
});
