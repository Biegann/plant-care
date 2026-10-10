import { useQuery } from "@tanstack/react-query";
import { useSession } from "../../auth/hooks/useSession";
import { listGardens } from "../api/gardenApi";

export const gardensQueryKey = (userId: string | undefined) =>
  ["gardens", userId] as const;

export function useGardens() {
  const userId = useSession()?.user.id;

  return useQuery({
    queryKey: gardensQueryKey(userId),
    enabled: !!userId,
    queryFn: async () => {
      const result = await listGardens();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });
}
