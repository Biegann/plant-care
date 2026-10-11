import { useQuery } from "@tanstack/react-query";
import { getPhotoUrl } from "../api/plantsApi";

export function usePlantPhotoUrl(path: string | null): string | null {
  const query = useQuery({
    queryKey: ["plant-photo", path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: () => getPhotoUrl(path as string),
  });

  return path ? (query.data ?? null) : null;
}
