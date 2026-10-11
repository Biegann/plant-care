jest.mock("../../../shared/api/supabase", () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from "../../../shared/api/supabase";
import {
    createCareTask,
    deleteCareTask,
    listCareTasks,
    mapCareError,
    setCareTaskDue,
    toCareTask,
    updateCareTask,
} from "../api/careApi";
import type { CareTaskInput } from "../validation";

const db = supabase as unknown as { from: jest.Mock };

// Udaje łańcuch zapytań Supabase (from().select().eq()...), który na końcu zwraca wynik
function chain(result: unknown) {
  const builder = {} as Record<string, jest.Mock>;
  ["select", "eq", "is", "order", "insert", "update", "delete", "single"].forEach(
    (method) => {
      builder[method] = jest.fn(() => builder);
    },
  );
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
  next_due_on: "2026-10-11",
  enabled: true,
  created_at: "2026-10-01T10:00:00Z",
  plants: { garden_id: "g1", archived_at: null },
};

const water: CareTaskInput = {
  type: "water",
  intervalDays: 7,
  nextDueOn: "2026-10-11",
};

afterEach(() => jest.resetAllMocks());

describe("mapCareError i toCareTask", () => {
  test("mapuje kody błędów bazy", () => {
    expect(mapCareError({ code: "23505" })).toBe("duplicateType");
    expect(mapCareError({ code: "23514" })).toBe("invalidInput");
    expect(mapCareError({ code: "42501" })).toBe("notAllowed");
    expect(mapCareError({ message: "cokolwiek" })).toBe("unknown");
  });

  test("toCareTask zamienia kolumny bazy na pola zadania", () => {
    expect(toCareTask(row)).toEqual({
      id: "t1",
      plantId: "p1",
      type: "water",
      customLabel: null,
      intervalDays: 7,
      nextDueOn: "2026-10-11",
      enabled: true,
      createdAt: "2026-10-01T10:00:00Z",
    });
  });
});

describe("listCareTasks", () => {
  test("pobiera zadania roślin z ogrodu, bez zarchiwizowanych", async () => {
    const query = chain({ data: [row], error: null });
    db.from.mockReturnValue(query);

    const result = await listCareTasks("g1");

    expect(db.from).toHaveBeenCalledWith("care_tasks");
    expect(query.eq).toHaveBeenCalledWith("plants.garden_id", "g1");
    expect(query.is).toHaveBeenCalledWith("plants.archived_at", null);
    expect(result).toEqual({ ok: true, data: [toCareTask(row)] });
  });

  test("błąd bazy: zwraca kod błędu", async () => {
    db.from.mockReturnValue(chain({ data: null, error: { code: "42501" } }));

    expect(await listCareTasks("g1")).toEqual({
      ok: false,
      error: "notAllowed",
    });
  });
});

describe("createCareTask", () => {
  test("zapisuje zadanie i zwraca jego id", async () => {
    const query = chain({ data: { id: "t1" }, error: null });
    db.from.mockReturnValue(query);

    const result = await createCareTask("p1", water);

    expect(query.insert).toHaveBeenCalledWith({
      plant_id: "p1",
      type: "water",
      custom_label: null,
      interval_days: 7,
      next_due_on: "2026-10-11",
      enabled: true,
    });
    expect(result).toEqual({ ok: true, data: "t1" });
  });

  test("niepoprawne dane: nie wysyła nic do bazy", async () => {
    const result = await createCareTask("p1", { ...water, intervalDays: 0 });

    expect(result).toEqual({ ok: false, error: "invalidInput" });
    expect(db.from).not.toHaveBeenCalled();
  });

  test("drugie zadanie tego samego typu: zwraca duplicateType", async () => {
    db.from.mockReturnValue(chain({ data: null, error: { code: "23505" } }));

    expect(await createCareTask("p1", water)).toEqual({
      ok: false,
      error: "duplicateType",
    });
  });
});

describe("updateCareTask", () => {
  test("zmienia nazwę, interwał, termin i włączenie, ale nie typ", async () => {
    const query = chain({ error: null, count: 1 });
    db.from.mockReturnValue(query);

    const result = await updateCareTask("t1", {
      type: "other",
      customLabel: " Zraszanie ",
      intervalDays: 3,
      nextDueOn: "2026-10-20",
      enabled: false,
    });

    expect(query.update).toHaveBeenCalledWith(
      {
        custom_label: "Zraszanie",
        interval_days: 3,
        next_due_on: "2026-10-20",
        enabled: false,
      },
      { count: "exact" },
    );
    expect(query.eq).toHaveBeenCalledWith("id", "t1");
    expect(result).toEqual({ ok: true, data: null });
  });

  test("nic nie zmieniono (brak dostępu lub zadania): zwraca notAllowed", async () => {
    db.from.mockReturnValue(chain({ error: null, count: 0 }));

    expect(await updateCareTask("t1", water)).toEqual({
      ok: false,
      error: "notAllowed",
    });
  });
});

describe("setCareTaskDue", () => {
  test("zmienia tylko termin", async () => {
    const query = chain({ error: null, count: 1 });
    db.from.mockReturnValue(query);

    const result = await setCareTaskDue("t1", "2026-10-18");

    expect(query.update).toHaveBeenCalledWith(
      { next_due_on: "2026-10-18" },
      { count: "exact" },
    );
    expect(result).toEqual({ ok: true, data: null });
  });

  test("niepoprawna data: nie wysyła nic do bazy", async () => {
    expect(await setCareTaskDue("t1", "jutro")).toEqual({
      ok: false,
      error: "invalidInput",
    });
    expect(db.from).not.toHaveBeenCalled();
  });
});

describe("deleteCareTask", () => {
  test("usuwa zadanie", async () => {
    const query = chain({ error: null, count: 1 });
    db.from.mockReturnValue(query);

    expect(await deleteCareTask("t1")).toEqual({ ok: true, data: null });
    expect(query.eq).toHaveBeenCalledWith("id", "t1");
  });

  test("nic nie usunięto: zwraca notAllowed", async () => {
    db.from.mockReturnValue(chain({ error: null, count: 0 }));

    expect(await deleteCareTask("t1")).toEqual({
      ok: false,
      error: "notAllowed",
    });
  });
});
