import { useActiveGarden } from "../../garden/hooks/useActiveGarden";
import { usePlants } from "./usePlants";

// Roślina z już wczytanej listy aktywnego ogrodu (bez osobnego zapytania do bazy)
export function usePlant(plantId: string) {
  const { garden, isLoading: gardenLoading } = useActiveGarden();
  const plantsQuery = usePlants(garden?.id);

  return {
    plant: plantsQuery.data?.find((item) => item.id === plantId) ?? null,
    isLoading: gardenLoading || (!!garden && plantsQuery.isPending),
  };
}
