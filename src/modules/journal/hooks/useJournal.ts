import { useQuery } from "@tanstack/react-query";
import { listJournal } from "../api/journalApi";

export const journalQueryKey = (plantId: string) =>
  ["journal", plantId] as const;

// Dziennik jednej rośliny, od najnowszych wpisów
export function useJournal(plantId: string) {
  return useQuery({
    queryKey: journalQueryKey(plantId),
    queryFn: async () => {
      const result = await listJournal(plantId);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });
}

// Jeden wpis z dziennika rośliny (z tej samej listy, bez osobnego zapytania)
export function useJournalEntry(plantId: string, entryId: string) {
  const { data, isLoading, isError } = useJournal(plantId);
  const entry = data?.find((item) => item.id === entryId) ?? null;
  return { entry, isLoading, isError };
}
