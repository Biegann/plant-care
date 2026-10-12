import { createInstance } from "i18next";
import en from "../../../shared/i18n/locales/en.json";
import pl from "../../../shared/i18n/locales/pl.json";
import { buildMessage } from "../message";
import type { NotifiableTask, PlannedNotification } from "../plan";

// Prawdziwy i18next z naszymi plikami tłumaczeń, żeby sprawdzić odmianę liczebników
async function translator(lng: "pl" | "en") {
  const instance = createInstance();
  await instance.init({
    resources: { pl: { translation: pl }, en: { translation: en } },
    lng,
    interpolation: { escapeValue: false },
  });
  return (key: string, options?: Record<string, unknown>) =>
    instance.t(key, options);
}

function task(overrides: Partial<NotifiableTask> = {}): NotifiableTask {
  return {
    type: "water",
    customLabel: null,
    plantName: "Monstera",
    nextDueOn: "2026-10-12",
    enabled: true,
    ...overrides,
  };
}

function planned(count: number, listed: NotifiableTask[]): PlannedNotification {
  return {
    date: "2026-10-12",
    count,
    listed,
    rest: count - listed.length,
  };
}

const two = [task(), task({ type: "fertilize", plantName: "Fikus" })];

describe("buildMessage po polsku", () => {
  test("jedno zadanie", async () => {
    const t = await translator("pl");

    expect(buildMessage(planned(1, [task()]), t)).toEqual({
      title: "1 zadanie opieki na dziś",
      body: "Podlewanie (Monstera)",
    });
  });

  test("dwa zadania: lista bez reszty", async () => {
    const t = await translator("pl");

    expect(buildMessage(planned(2, two), t)).toEqual({
      title: "2 zadania opieki na dziś",
      body: "Podlewanie (Monstera), Nawożenie (Fikus)",
    });
  });

  test("odmiana reszty: 1 inne, 2 inne, 5 innych", async () => {
    const t = await translator("pl");

    expect(buildMessage(planned(3, two), t).body).toBe(
      "Podlewanie (Monstera), Nawożenie (Fikus) i 1 inne",
    );
    expect(buildMessage(planned(4, two), t).body).toBe(
      "Podlewanie (Monstera), Nawożenie (Fikus) i 2 inne",
    );
    expect(buildMessage(planned(7, two), t)).toEqual({
      title: "7 zadań opieki na dziś",
      body: "Podlewanie (Monstera), Nawożenie (Fikus) i 5 innych",
    });
  });

  test("zadanie 'inne' pokazuje własną nazwę", async () => {
    const t = await translator("pl");
    const custom = task({ type: "other", customLabel: "Zraszanie" });

    expect(buildMessage(planned(1, [custom]), t).body).toBe(
      "Zraszanie (Monstera)",
    );
  });
});

describe("buildMessage po angielsku", () => {
  test("liczba pojedyncza i mnoga", async () => {
    const t = await translator("en");

    expect(buildMessage(planned(1, [task()]), t).title).toBe(
      "1 care task for today",
    );
    expect(buildMessage(planned(3, two), t)).toEqual({
      title: "3 care tasks for today",
      body: "Watering (Monstera), Fertilizing (Fikus) and 1 more",
    });
  });
});
