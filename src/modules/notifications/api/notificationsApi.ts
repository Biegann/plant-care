import { supabase } from "../../../shared/api/supabase";
import { mapCareError, type CareResult } from "../../care-schedule/api/careApi";
import type { CareType } from "../../care-schedule/validation";
import type { NotifiableTask } from "../plan";

type NotifiableTaskRow = {
  type: CareType;
  custom_label: string | null;
  next_due_on: string;
  enabled: boolean;
  plants: { name: string };
};

export function toNotifiableTask(row: NotifiableTaskRow): NotifiableTask {
  return {
    type: row.type,
    customLabel: row.custom_label,
    plantName: row.plants.name,
    nextDueOn: row.next_due_on,
    enabled: row.enabled,
  };
}

// Włączone zadania ze wszystkich ogrodów użytkownika (zakres wyznaczają reguły RLS)
export async function listNotifiableTasks(): Promise<
  CareResult<NotifiableTask[]>
> {
  const { data, error } = await supabase
    .from("care_tasks")
    .select(
      "type, custom_label, next_due_on, enabled, plants!inner(name, archived_at)",
    )
    .eq("enabled", true)
    .is("plants.archived_at", null)
    .order("next_due_on");
  if (error) return { ok: false, error: mapCareError(error) };

  return {
    ok: true,
    data: ((data ?? []) as unknown as NotifiableTaskRow[]).map(
      toNotifiableTask,
    ),
  };
}
