import type { Plant } from "./api/plantsApi";

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function filterPlants(plants: Plant[], query: string): Plant[] {
  const needle = normalizeText(query);
  if (needle === "") return plants;

  return plants.filter((plant) =>
    [plant.name, plant.speciesName, plant.locationNote].some(
      (field) => field !== null && normalizeText(field).includes(needle),
    ),
  );
}
