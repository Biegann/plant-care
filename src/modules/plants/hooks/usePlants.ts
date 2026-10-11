import { useQuery } from "@tanstack/react-query";
import { listPlants } from "../api/plantsApi";

export const plantsQueryKey = (gardenId: string | undefined) =>
  ["plants", gardenId] as const;

export function usePlants(gardenId: string | undefined) {
  return useQuery({
    queryKey: plantsQueryKey(gardenId),
    enabled: !!gardenId,
    queryFn: async () => {
      const result = await listPlants(gardenId as string);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });
}
