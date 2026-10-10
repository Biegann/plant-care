import { resolveActiveGarden } from "../activeGarden";
import { useGardenStore } from "../store/gardenStore";
import { useGardens } from "./useGardens";

export function useActiveGarden() {
  const query = useGardens();
  const hydrated = useGardenStore((state) => state.hydrated);
  const activeGardenId = useGardenStore((state) => state.activeGardenId);
  const setActiveGardenId = useGardenStore((state) => state.setActiveGardenId);

  const gardens = query.data ?? [];

  return {
    gardens,
    garden: resolveActiveGarden(gardens, activeGardenId),
    setActiveGardenId,
    isLoading: !hydrated || query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}
