jest.mock("../api/careApi", () => ({
  createCareTask: jest.fn(),
  updateCareTask: jest.fn(),
  setCareTaskDue: jest.fn(),
  deleteCareTask: jest.fn(),
}));

import { queryClient } from "../../../shared/api/queryClient";
import {
    createCareTask,
    deleteCareTask,
    setCareTaskDue,
    updateCareTask,
    type CareTask,
} from "../api/careApi";
import {
    completeCareTaskAndRefresh,
    createCareTaskAndRefresh,
    deleteCareTaskAndRefresh,
    postponeCareTaskAndRefresh,
    updateCareTaskAndRefresh,
} from "../careActions";
import type { CareTaskInput } from "../validation";

const mockCreate = createCareTask as jest.Mock;
const mockUpdate = updateCareTask as jest.Mock;
const mockSetDue = setCareTaskDue as jest.Mock;
const mockDelete = deleteCareTask as jest.Mock;

const task = { id: "t1", plantId: "p1", intervalDays: 7 } as CareTask;
const input: CareTaskInput = {
  type: "water",
  intervalDays: 7,
  nextDueOn: "2026-10-11",
};
const ok = { ok: true, data: null };
const failed = { ok: false, error: "notAllowed" };
const refreshed = { queryKey: ["care-tasks", "g1"] };

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

describe("akcje zadań opieki", () => {
  test("dodanie: zapisuje i odświeża zadania ogrodu", async () => {
    mockCreate.mockResolvedValue({ ok: true, data: "t1" });

    const result = await createCareTaskAndRefresh("g1", "p1", input);

    expect(mockCreate).toHaveBeenCalledWith("p1", input);
    expect(invalidate).toHaveBeenCalledWith(refreshed);
    expect(result).toEqual({ ok: true, data: "t1" });
  });

  test("zmiana: zapisuje i odświeża", async () => {
    mockUpdate.mockResolvedValue(ok);

    await updateCareTaskAndRefresh("g1", "t1", input);

    expect(mockUpdate).toHaveBeenCalledWith("t1", input);
    expect(invalidate).toHaveBeenCalledWith(refreshed);
  });

  test("zrobione: ustawia termin na dzień wykonania + interwał", async () => {
    mockSetDue.mockResolvedValue(ok);

    await completeCareTaskAndRefresh("g1", task, "2026-10-11");

    expect(mockSetDue).toHaveBeenCalledWith("t1", "2026-10-18");
    expect(invalidate).toHaveBeenCalledWith(refreshed);
  });

  test("odłożenie: ustawia termin na jutro", async () => {
    mockSetDue.mockResolvedValue(ok);

    await postponeCareTaskAndRefresh("g1", task, "2026-10-11");

    expect(mockSetDue).toHaveBeenCalledWith("t1", "2026-10-12");
    expect(invalidate).toHaveBeenCalledWith(refreshed);
  });

  test("usunięcie: usuwa i odświeża", async () => {
    mockDelete.mockResolvedValue(ok);

    await deleteCareTaskAndRefresh("g1", "t1");

    expect(mockDelete).toHaveBeenCalledWith("t1");
    expect(invalidate).toHaveBeenCalledWith(refreshed);
  });

  test("błąd: zwraca go i niczego nie odświeża", async () => {
    mockSetDue.mockResolvedValue(failed);

    const result = await completeCareTaskAndRefresh("g1", task, "2026-10-11");

    expect(result).toEqual(failed);
    expect(invalidate).not.toHaveBeenCalled();
  });
});
