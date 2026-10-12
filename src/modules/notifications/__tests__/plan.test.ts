import {
  buildNotificationPlan,
  firstPlanDay,
  notificationDate,
  PLAN_DAYS,
  type NotifiableTask,
} from "../plan";

function task(overrides: Partial<NotifiableTask> = {}): NotifiableTask {
  return {
    type: "water",
    customLabel: null,
    plantName: "Monstera",
    nextDueOn: "2026-10-15",
    enabled: true,
    ...overrides,
  };
}

const dates = (plan: { date: string }[]) => plan.map((item) => item.date);

describe("notificationDate i firstPlanDay", () => {
  const time = { hour: 9, minute: 30 };

  test("chwila powiadomienia według czasu telefonu", () => {
    expect(notificationDate("2026-10-12", time)).toEqual(
      new Date(2026, 9, 12, 9, 30),
    );
  });

  test("przed godziną powiadomienia plan zaczyna się dziś", () => {
    expect(firstPlanDay(new Date(2026, 9, 12, 9, 29), time)).toBe("2026-10-12");
  });

  test("o godzinie powiadomienia lub później plan zaczyna się jutro", () => {
    expect(firstPlanDay(new Date(2026, 9, 12, 9, 30), time)).toBe("2026-10-13");
    expect(firstPlanDay(new Date(2026, 9, 31, 23, 0), time)).toBe("2026-11-01");
  });
});

describe("buildNotificationPlan", () => {
  test("bez zadań: pusty plan", () => {
    expect(buildNotificationPlan([], "2026-10-12")).toEqual([]);
  });

  test("zadanie z przyszłym terminem: powiadomienia od dnia terminu", () => {
    const plan = buildNotificationPlan([task()], "2026-10-12", 5);

    expect(dates(plan)).toEqual(["2026-10-15", "2026-10-16"]);
  });

  test("zadanie po terminie liczy się codziennie od pierwszego dnia", () => {
    const plan = buildNotificationPlan(
      [task({ nextDueOn: "2026-10-01" })],
      "2026-10-12",
      3,
    );

    expect(dates(plan)).toEqual(["2026-10-12", "2026-10-13", "2026-10-14"]);
  });

  test("termin poza oknem planu: brak powiadomień", () => {
    const plan = buildNotificationPlan(
      [task({ nextDueOn: "2026-12-31" })],
      "2026-10-12",
    );

    expect(plan).toEqual([]);
  });

  test("domyślnie planuje na 30 dni", () => {
    const plan = buildNotificationPlan(
      [task({ nextDueOn: "2026-10-12" })],
      "2026-10-12",
    );

    expect(plan).toHaveLength(PLAN_DAYS);
    expect(plan.at(-1)?.date).toBe("2026-11-10");
  });

  test("wyłączone zadanie jest pomijane", () => {
    const plan = buildNotificationPlan(
      [task({ nextDueOn: "2026-10-12", enabled: false })],
      "2026-10-12",
      3,
    );

    expect(plan).toEqual([]);
  });

  test("liczba zadań rośnie, gdy dochodzą kolejne terminy", () => {
    const plan = buildNotificationPlan(
      [
        task({ nextDueOn: "2026-10-12" }),
        task({ plantName: "Fikus", nextDueOn: "2026-10-13" }),
      ],
      "2026-10-12",
      2,
    );

    expect(plan.map((item) => item.count)).toEqual([1, 2]);
  });

  test("wymienia 2 zadania, najdłużej zaległe najpierw, resztę zlicza", () => {
    const plan = buildNotificationPlan(
      [
        task({ plantName: "Zamiokulkas", nextDueOn: "2026-10-12" }),
        task({ plantName: "Fikus", nextDueOn: "2026-10-12" }),
        task({ plantName: "Monstera", nextDueOn: "2026-10-05" }),
        task({ plantName: "Aloes", nextDueOn: "2026-10-12" }),
      ],
      "2026-10-12",
      1,
    );

    expect(plan[0].count).toBe(4);
    expect(plan[0].listed.map((item) => item.plantName)).toEqual([
      "Monstera",
      "Aloes",
    ]);
    expect(plan[0].rest).toBe(2);
  });

  test("nie zmienia kolejności przekazanej tablicy", () => {
    const tasks = [
      task({ plantName: "Zamiokulkas" }),
      task({ plantName: "Aloes" }),
    ];

    buildNotificationPlan(tasks, "2026-10-12", 5);

    expect(tasks[0].plantName).toBe("Zamiokulkas");
  });
});
