import { findSpecies, SPECIES } from "../data";
import { normalize, searchSpecies } from "../search";

describe("lista gatunków", () => {
  test("klucze są unikalne i w formacie akceptowanym przez bazę", () => {
    const keys = SPECIES.map((species) => species.key);
    expect(new Set(keys).size).toBe(keys.length);
    keys.forEach((key) => expect(key).toMatch(/^[a-z0-9-]{1,60}$/));
  });

  test("interwały mieszczą się w limitach zadań (1-730 dni)", () => {
    SPECIES.forEach((species) => {
      expect(species.waterDays).toBeGreaterThanOrEqual(1);
      expect(species.fertilizeDays).toBeLessThanOrEqual(730);
    });
  });

  test("nazwa gatunku mieści się w polu rośliny (80 znaków)", () => {
    SPECIES.forEach((species) => {
      expect(species.names.pl.length).toBeLessThanOrEqual(80);
      expect(species.names.en.length).toBeLessThanOrEqual(80);
    });
  });

  test("findSpecies: znany klucz, nieznany i brak", () => {
    expect(findSpecies("ficus-elastica")?.names.pl).toBe(
      "Fikus sprężysty (gumowiec)",
    );
    expect(findSpecies("nie-ma")).toBeNull();
    expect(findSpecies(null)).toBeNull();
  });
});

describe("normalize", () => {
  test("usuwa wielkie litery i polskie znaki, także ł", () => {
    expect(normalize("  Skrzydłokwiat ŻÓŁW ")).toBe("skrzydlokwiat zolw");
  });
});

describe("searchSpecies", () => {
  test("mniej niż 2 znaki: brak podpowiedzi", () => {
    expect(searchSpecies("m", "pl")).toEqual([]);
  });

  test("bez polskich znaków znajduje polską nazwę", () => {
    expect(searchSpecies("skrzydlo", "pl").map((s) => s.key)).toEqual([
      "spathiphyllum-wallisii",
    ]);
  });

  test("znajduje po nazwie angielskiej i łacińskiej", () => {
    expect(searchSpecies("peace", "pl")[0].key).toBe("spathiphyllum-wallisii");
    expect(searchSpecies("deliciosa", "pl")[0].key).toBe("monstera-deliciosa");
  });

  test("najpierw nazwy zaczynające się od tekstu w bieżącym języku", () => {
    const keys = searchSpecies("fikus", "pl").map((s) => s.key);
    expect(keys.slice(0, 3)).toEqual([
      "ficus-elastica",
      "ficus-lyrata",
      "ficus-benjamina",
    ]);
  });

  test("limit wyników", () => {
    expect(searchSpecies("a", "pl")).toHaveLength(0);
    expect(searchSpecies("ra", "pl", 3)).toHaveLength(3);
  });
});
