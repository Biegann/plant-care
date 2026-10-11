import { useQuery } from "@tanstack/react-query";
import { listMembers } from "../api/gardenApi";

export const membersQueryKey = (gardenId: string) =>
  ["garden-members", gardenId] as const;

export function useGardenMembers(gardenId: string) {
  return useQuery({
    queryKey: membersQueryKey(gardenId),
    queryFn: async () => {
      const result = await listMembers(gardenId);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });
}
