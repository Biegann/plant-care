import {
    formatDisplayDate,
    fromIsoDate,
    isValidIsoDate,
    toIsoDate,
} from "../date";

describe("isValidIsoDate", () => {
  test("akceptuje prawdziwe daty", () => {
    expect(isValidIsoDate("2026-03-12")).toBe(true);
    expect(isValidIsoDate("2024-02-29")).toBe(true);
  });

  test("odrzuca zły format i nieistniejące daty", () => {
    expect(isValidIsoDate("12.03.2026")).toBe(false);
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("")).toBe(false);
  });
});

describe("toIsoDate", () => {
  test("dopisuje zera do miesiąca i dnia", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  test("tuż po północy i tuż przed północą zostaje ten sam dzień", () => {
    expect(toIsoDate(new Date(2026, 9, 11, 0, 30))).toBe("2026-10-11");
    expect(toIsoDate(new Date(2026, 9, 11, 23, 30))).toBe("2026-10-11");
  });
});

describe("fromIsoDate", () => {
  test("zwraca lokalną datę o tym samym dniu", () => {
    const date = fromIsoDate("2026-03-09");

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(2);
    expect(date?.getDate()).toBe(9);
  });

  test("zamiana w obie strony nie zmienia daty", () => {
    const date = fromIsoDate("2024-02-29");

    expect(date && toIsoDate(date)).toBe("2024-02-29");
  });

  test("nieprawidłowa data: zwraca null", () => {
    expect(fromIsoDate("")).toBeNull();
    expect(fromIsoDate("2026-02-30")).toBeNull();
    expect(fromIsoDate("09.03.2026")).toBeNull();
  });
});

describe("formatDisplayDate", () => {
  test("pokazuje datę jako DD.MM.RRRR", () => {
    expect(formatDisplayDate("2026-03-09")).toBe("09.03.2026");
  });

  test("nieprawidłową wartość zwraca bez zmian", () => {
    expect(formatDisplayDate("abc")).toBe("abc");
  });
});
