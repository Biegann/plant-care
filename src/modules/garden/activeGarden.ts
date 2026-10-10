import type { Garden } from "./api/gardenApi";

export function resolveActiveGarden(
  gardens: Garden[],
  savedId: string | null,
): Garden | null {
  if (gardens.length === 0) return null;
  return gardens.find((garden) => garden.id === savedId) ?? gardens[0];
}
