import type { Plant } from "../api/plantsApi";
import { filterPlants, normalizeText } from "../filter";

function plant(
  id: string,
  name: string,
  speciesName: string | null,
  locationNote: string | null,
) {
  return {
    id,
    gardenId: "g1",
    name,
    speciesName,
    locationNote,
    purchaseDate: null,
    notes: null,
    photoPath: null,
    createdAt: "2026-01-01",
  } as Plant;
}

const plants = [
  plant("1", "Monstera", "Monstera deliciosa", "Salon"),
  plant("2", "Paproć", null, "Łazienka"),
  plant("3", "Żółtlica", "Ficus", null),
];

describe("normalizeText", () => {
  test("ignoruje wielkość liter, polskie znaki i spacje na brzegach", () => {
    expect(normalizeText("  Żółć ŁÓDŹ ")).toBe("zolc lodz");
  });
});

describe("filterPlants", () => {
  test("pusty tekst zwraca wszystkie rośliny", () => {
    expect(filterPlants(plants, "   ")).toHaveLength(3);
  });

  test("szuka po nazwie bez względu na wielkość liter", () => {
    expect(filterPlants(plants, "MONST").map((p) => p.id)).toEqual(["1"]);
  });

  test("szuka po gatunku i lokalizacji", () => {
    expect(filterPlants(plants, "ficus").map((p) => p.id)).toEqual(["3"]);
    expect(filterPlants(plants, "salon").map((p) => p.id)).toEqual(["1"]);
  });

  test("ignoruje polskie znaki w zapytaniu i w danych", () => {
    expect(filterPlants(plants, "paproc").map((p) => p.id)).toEqual(["2"]);
    expect(filterPlants(plants, "lazienka").map((p) => p.id)).toEqual(["2"]);
    expect(filterPlants(plants, "zoltlica").map((p) => p.id)).toEqual(["3"]);
  });

  test("brak dopasowań daje pustą listę, a puste pola nie przeszkadzają", () => {
    expect(filterPlants(plants, "xyz")).toEqual([]);
  });
});
