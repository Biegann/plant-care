import {
    normalizeCareTaskInput,
    validateCareTaskInput,
    type CareTaskInput,
} from "../validation";

const water: CareTaskInput = {
  type: "water",
  intervalDays: 7,
  nextDueOn: "2026-10-11",
};

describe("validateCareTaskInput", () => {
  test("poprawne podlewanie: brak błędów", () => {
    expect(validateCareTaskInput(water)).toEqual({});
  });

  test("interwał musi być liczbą całkowitą od 1 do 730", () => {
    const check = (intervalDays: number) =>
      validateCareTaskInput({ ...water, intervalDays }).intervalDays;

    expect(check(1)).toBeUndefined();
    expect(check(730)).toBeUndefined();
    expect(check(0)).toBe("invalidInterval");
    expect(check(731)).toBe("invalidInterval");
    expect(check(2.5)).toBe("invalidInterval");
    expect(check(Number.NaN)).toBe("invalidInterval");
  });

  test("termin musi być poprawną datą RRRR-MM-DD", () => {
    expect(validateCareTaskInput({ ...water, nextDueOn: "" }).nextDueOn).toBe(
      "invalidDate",
    );
    expect(
      validateCareTaskInput({ ...water, nextDueOn: "2026-02-30" }).nextDueOn,
    ).toBe("invalidDate");
  });

  test("zadanie inne wymaga własnej nazwy do 40 znaków", () => {
    const check = (customLabel?: string) =>
      validateCareTaskInput({ ...water, type: "other", customLabel })
        .customLabel;

    expect(check("Zraszanie")).toBeUndefined();
    expect(check("a".repeat(40))).toBeUndefined();
    expect(check(undefined)).toBe("invalidLabel");
    expect(check("   ")).toBe("invalidLabel");
    expect(check("a".repeat(41))).toBe("invalidLabel");
  });

  test("przy pozostałych typach własna nazwa nie jest sprawdzana", () => {
    expect(
      validateCareTaskInput({ ...water, customLabel: "a".repeat(99) }),
    ).toEqual({});
  });
});

describe("normalizeCareTaskInput", () => {
  test("zadanie inne: przycina nazwę i domyślnie jest włączone", () => {
    expect(
      normalizeCareTaskInput({
        ...water,
        type: "other",
        customLabel: "  Zraszanie ",
      }),
    ).toEqual({
      type: "other",
      customLabel: "Zraszanie",
      intervalDays: 7,
      nextDueOn: "2026-10-11",
      enabled: true,
    });
  });

  test("pozostałe typy: własna nazwa jest pomijana", () => {
    expect(
      normalizeCareTaskInput({ ...water, customLabel: "cokolwiek" })
        .customLabel,
    ).toBeNull();
  });

  test("zachowuje wyłączenie zadania", () => {
    expect(normalizeCareTaskInput({ ...water, enabled: false }).enabled).toBe(
      false,
    );
  });
});
