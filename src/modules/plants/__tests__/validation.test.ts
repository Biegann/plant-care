import { normalizePlantInput, validatePlantInput } from "../validation";

describe("validatePlantInput", () => {
  test("minimalne dane (tylko nazwa) są poprawne", () => {
    expect(validatePlantInput({ name: "Monstera" })).toEqual({});
  });

  test("nazwa pusta lub za długa", () => {
    expect(validatePlantInput({ name: "   " })).toEqual({
      name: "invalidName",
    });
    expect(validatePlantInput({ name: "a".repeat(61) })).toEqual({
      name: "invalidName",
    });
  });

  test("za długie pola opcjonalne i zła data", () => {
    expect(
      validatePlantInput({
        name: "Fikus",
        speciesName: "a".repeat(81),
        locationNote: "a".repeat(81),
        notes: "a".repeat(1001),
        purchaseDate: "2026-02-30",
      }),
    ).toEqual({
      speciesName: "tooLong",
      locationNote: "tooLong",
      notes: "tooLong",
      purchaseDate: "invalidDate",
    });
  });
});

describe("normalizePlantInput", () => {
  test("przycina spacje, a puste pola zamienia na null", () => {
    expect(
      normalizePlantInput({
        name: "  Monstera ",
        speciesName: "  ",
        purchaseDate: "2026-03-12",
      }),
    ).toEqual({
      name: "Monstera",
      speciesName: null,
      speciesKey: null,
      locationNote: null,
      purchaseDate: "2026-03-12",
      notes: null,
    });
  });

  test("klucz gatunku: znany zostaje, nieznany zamienia na null", () => {
    expect(
      normalizePlantInput({ name: "A", speciesKey: "ficus-elastica" })
        .speciesKey,
    ).toBe("ficus-elastica");
    expect(
      normalizePlantInput({ name: "A", speciesKey: "nie-ma-takiego" })
        .speciesKey,
    ).toBeNull();
  });
});
