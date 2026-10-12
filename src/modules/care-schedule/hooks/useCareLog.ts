import { useQuery } from "@tanstack/react-query";
import { listCareLog } from "../api/careLogApi";

export const careLogQueryKey = (plantId: string) =>
  ["care-log", plantId] as const;

// Historia opieki jednej rośliny, od najnowszych wpisów
export function useCareLog(plantId: string) {
  return useQuery({
    queryKey: careLogQueryKey(plantId),
    queryFn: async () => {
      const result = await listCareLog(plantId);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });
}
