import {
    addDays,
    daysUntil,
    DEFAULT_INTERVAL_DAYS,
    dueStatus,
    needsCare,
    nextDueAfterDone,
    nextDueAfterPostpone,
    plantIdsNeedingCare,
    todayIso,
} from "../schedule";

describe("addDays", () => {
  test("dodaje dni w obrębie miesiąca", () => {
    expect(addDays("2026-10-11", 7)).toBe("2026-10-18");
  });

  test("przechodzi przez koniec miesiąca i roku", () => {
    expect(addDays("2026-10-28", 7)).toBe("2026-11-04");
    expect(addDays("2026-12-30", 5)).toBe("2027-01-04");
  });

  test("uwzględnia rok przestępny", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
  });

  test("zmiana czasu nie gubi ani nie dodaje dnia", () => {
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
  });
});

describe("daysUntil i dueStatus", () => {
  test("liczy dni do terminu", () => {
    expect(daysUntil("2026-10-14", "2026-10-11")).toBe(3);
    expect(daysUntil("2026-10-11", "2026-10-11")).toBe(0);
    expect(daysUntil("2026-10-09", "2026-10-11")).toBe(-2);
  });

  test("liczy poprawnie przez zmianę czasu", () => {
    expect(daysUntil("2026-10-26", "2026-10-24")).toBe(2);
  });

  test("rozróżnia: po terminie, dziś, w przyszłości", () => {
    expect(dueStatus("2026-10-09", "2026-10-11")).toBe("overdue");
    expect(dueStatus("2026-10-11", "2026-10-11")).toBe("today");
    expect(dueStatus("2026-10-12", "2026-10-11")).toBe("upcoming");
  });
});

describe("następny termin", () => {
  test("po wykonaniu: dzień wykonania + interwał, także przy spóźnieniu", () => {
    expect(nextDueAfterDone("2026-10-11", 7)).toBe("2026-10-18");
  });

  test("po odłożeniu: jutro", () => {
    expect(nextDueAfterPostpone("2026-10-31")).toBe("2026-11-01");
  });

  test("podpowiadane interwały: podlewanie 7 dni, nawożenie 30", () => {
    expect(DEFAULT_INTERVAL_DAYS.water).toBe(7);
    expect(DEFAULT_INTERVAL_DAYS.fertilize).toBe(30);
  });
});

describe("needsCare i plantIdsNeedingCare", () => {
  const today = "2026-10-11";
  const task = (plantId: string, nextDueOn: string, enabled = true) => ({
    plantId,
    nextDueOn,
    enabled,
  });

  test("uwagi wymaga włączone zadanie na dziś lub po terminie", () => {
    expect(needsCare(task("p1", "2026-10-11"), today)).toBe(true);
    expect(needsCare(task("p1", "2026-10-01"), today)).toBe(true);
    expect(needsCare(task("p1", "2026-10-12"), today)).toBe(false);
    expect(needsCare(task("p1", "2026-10-01", false), today)).toBe(false);
  });

  test("zbiera id roślin z zadaniami do zrobienia, każde raz", () => {
    const ids = plantIdsNeedingCare(
      [
        task("p1", "2026-10-11"),
        task("p1", "2026-10-05"),
        task("p2", "2026-10-20"),
        task("p3", "2026-10-01", false),
        task("p4", "2026-10-10"),
      ],
      today,
    );

    expect([...ids].sort()).toEqual(["p1", "p4"]);
  });
});

describe("todayIso", () => {
  test("zwraca dzisiejszą datę telefonu jako RRRR-MM-DD", () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 11, 0, 30));

    expect(todayIso()).toBe("2026-10-11");

    jest.useRealTimers();
  });
});
