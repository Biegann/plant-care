import { useQuery } from "@tanstack/react-query";
import { todayIso } from "../../care-schedule/schedule";
import { listDueTasks } from "../api/todayApi";

export const todayTasksQueryKey = ["today-tasks"] as const;

// Zadania na dziś i zaległe ze wszystkich ogrodów
export function useTodayTasks() {
  return useQuery({
    queryKey: todayTasksQueryKey,
    queryFn: async () => {
      const result = await listDueTasks(todayIso());
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
  });
}
