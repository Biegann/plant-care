jest.mock("../../../shared/api/supabase", () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from "../../../shared/api/supabase";
import { listDueTasks, toTodayTask } from "../api/todayApi";

const db = supabase as unknown as { from: jest.Mock };

// Udaje łańcuch zapytań Supabase (from().select().eq()...), który na końcu zwraca wynik
function chain(result: unknown) {
  const builder = {} as Record<string, jest.Mock>;
  ["select", "eq", "is", "lte", "order"].forEach((method) => {
    builder[method] = jest.fn(() => builder);
  });
  Object.assign(builder, {
    then: (resolve: (value: unknown) => unknown) => resolve(result),
  });
  return builder;
}

const row = {
  id: "t1",
  plant_id: "p1",
  type: "water" as const,
  custom_label: null,
  interval_days: 7,
  next_due_on: "2026-10-13",
  enabled: true,
  created_at: "2026-10-01T10:00:00Z",
  plants: { name: "Monstera", garden_id: "g1", gardens: { name: "Dom" } },
};

afterEach(() => jest.resetAllMocks());

describe("toTodayTask", () => {
  test("łączy zadanie z nazwą rośliny i ogrodem", () => {
    expect(toTodayTask(row)).toEqual({
      task: {
        id: "t1",
        plantId: "p1",
        type: "water",
        customLabel: null,
        intervalDays: 7,
        nextDueOn: "2026-10-13",
        enabled: true,
        createdAt: "2026-10-01T10:00:00Z",
      },
      plantName: "Monstera",
      gardenId: "g1",
      gardenName: "Dom",
    });
  });
});

describe("listDueTasks", () => {
  test("pobiera włączone zadania z terminem do dziś, bez filtra ogrodu", async () => {
    const query = chain({ data: [row], error: null });
    db.from.mockReturnValue(query);

    const result = await listDueTasks("2026-10-14");

    expect(db.from).toHaveBeenCalledWith("care_tasks");
    expect(query.eq).toHaveBeenCalledTimes(1);
    expect(query.eq).toHaveBeenCalledWith("enabled", true);
    expect(query.is).toHaveBeenCalledWith("plants.archived_at", null);
    expect(query.lte).toHaveBeenCalledWith("next_due_on", "2026-10-14");
    expect(result).toEqual({ ok: true, data: [toTodayTask(row)] });
  });

  test("brak danych: pusta lista", async () => {
    db.from.mockReturnValue(chain({ data: null, error: null }));

    expect(await listDueTasks("2026-10-14")).toEqual({ ok: true, data: [] });
  });

  test("niepoprawna data: nie pyta bazy", async () => {
    expect(await listDueTasks("14.10.2026")).toEqual({
      ok: false,
      error: "invalidInput",
    });
    expect(db.from).not.toHaveBeenCalled();
  });

  test("błąd bazy: zwraca kod błędu", async () => {
    db.from.mockReturnValue(chain({ data: null, error: { code: "42501" } }));

    expect(await listDueTasks("2026-10-14")).toEqual({
      ok: false,
      error: "notAllowed",
    });
  });
});
