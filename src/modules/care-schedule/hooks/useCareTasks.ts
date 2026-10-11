import { useQuery } from "@tanstack/react-query";
import { useActiveGarden } from "../../garden/hooks/useActiveGarden";
import { listCareTasks } from "../api/careApi";

export const careTasksQueryKey = (gardenId: string | undefined) =>
  ["care-tasks", gardenId] as const;

// Zadania wszystkich roślin z ogrodu
export function useCareTasks(gardenId: string | undefined) {
  return useQuery({
    queryKey: careTasksQueryKey(gardenId),
    enabled: !!gardenId,
    queryFn: async () => {
      const result = await listCareTasks(gardenId as string);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });
}

// Zadania jednej rośliny z aktywnego ogrodu, wybrane z już wczytanej listy
export function usePlantCareTasks(plantId: string) {
  const { garden, isLoading: gardenLoading } = useActiveGarden();
  const query = useCareTasks(garden?.id);

  return {
    gardenId: garden?.id,
    tasks: (query.data ?? []).filter((task) => task.plantId === plantId),
    isLoading: gardenLoading || (!!garden && query.isPending),
    isError: query.isError,
    refetch: query.refetch,
  };
}

// Jedno zadanie z aktywnego ogrodu (do ekranu edycji)
export function useCareTask(taskId: string) {
  const { garden, isLoading: gardenLoading } = useActiveGarden();
  const query = useCareTasks(garden?.id);

  return {
    gardenId: garden?.id,
    task: (query.data ?? []).find((task) => task.id === taskId) ?? null,
    isLoading: gardenLoading || (!!garden && query.isPending),
  };
}
