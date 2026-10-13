import { supabase } from "../../../shared/api/supabase";
import { isValidIsoDate } from "../../../shared/utils/date";
import {
    mapCareError,
    toCareTask,
    type CareResult,
    type CareTask,
} from "../../care-schedule/api/careApi";

// Zadanie do zrobienia razem z tym, co ekran "Dziś" pokazuje obok niego
export type TodayTask = {
  task: CareTask;
  plantName: string;
  gardenId: string;
  gardenName: string;
};

type TodayTaskRow = Parameters<typeof toCareTask>[0] & {
  plants: { name: string; garden_id: string; gardens: { name: string } };
};

export function toTodayTask(row: TodayTaskRow): TodayTask {
  return {
    task: toCareTask(row),
    plantName: row.plants.name,
    gardenId: row.plants.garden_id,
    gardenName: row.plants.gardens.name,
  };
}

// Włączone zadania z terminem dziś lub wcześniej, ze wszystkich ogrodów użytkownika
// (zakres wyznaczają reguły RLS)
export async function listDueTasks(
  today: string,
): Promise<CareResult<TodayTask[]>> {
  if (!isValidIsoDate(today)) return { ok: false, error: "invalidInput" };

  const { data, error } = await supabase
    .from("care_tasks")
    .select("*, plants!inner(name, garden_id, archived_at, gardens!inner(name))")
    .eq("enabled", true)
    .is("plants.archived_at", null)
    .lte("next_due_on", today)
    .order("next_due_on");
  if (error) return { ok: false, error: mapCareError(error) };

  return {
    ok: true,
    data: ((data ?? []) as unknown as TodayTaskRow[]).map(toTodayTask),
  };
}
