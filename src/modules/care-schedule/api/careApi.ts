import { supabase } from "../../../shared/api/supabase";
import { isValidIsoDate } from "../../plants/validation";
import {
    normalizeCareTaskInput,
    validateCareTaskInput,
    type CareTaskInput,
    type CareType,
} from "../validation";

export type CareTask = {
  id: string;
  plantId: string;
  type: CareType;
  customLabel: string | null;
  intervalDays: number;
  nextDueOn: string;
  enabled: boolean;
  createdAt: string;
};

export type CareErrorCode =
  | "invalidInput"
  | "duplicateType"
  | "notAllowed"
  | "unknown";
export type CareResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: CareErrorCode };

type DbError = { code?: string; message?: string };

export function mapCareError(error: DbError): CareErrorCode {
  if (error.code === "23505") return "duplicateType";
  if (error.code === "23514") return "invalidInput";
  if (error.code === "42501") return "notAllowed";
  return "unknown";
}

const fail = (error: DbError): { ok: false; error: CareErrorCode } => ({
  ok: false,
  error: mapCareError(error),
});

type CareTaskRow = {
  id: string;
  plant_id: string;
  type: CareType;
  custom_label: string | null;
  interval_days: number;
  next_due_on: string;
  enabled: boolean;
  created_at: string;
};

export function toCareTask(row: CareTaskRow): CareTask {
  return {
    id: row.id,
    plantId: row.plant_id,
    type: row.type,
    customLabel: row.custom_label,
    intervalDays: row.interval_days,
    nextDueOn: row.next_due_on,
    enabled: row.enabled,
    createdAt: row.created_at,
  };
}

const isInvalid = (input: CareTaskInput) =>
  Object.keys(validateCareTaskInput(input)).length > 0;

// Wszystkie zadania roślin z jednego ogrodu (jedno zapytanie dla listy i kart roślin)
export async function listCareTasks(
  gardenId: string,
): Promise<CareResult<CareTask[]>> {
  const { data, error } = await supabase
    .from("care_tasks")
    .select("*, plants!inner(garden_id, archived_at)")
    .eq("plants.garden_id", gardenId)
    .is("plants.archived_at", null)
    .order("next_due_on");
  if (error) return fail(error);

  return { ok: true, data: ((data ?? []) as CareTaskRow[]).map(toCareTask) };
}

export async function createCareTask(
  plantId: string,
  input: CareTaskInput,
): Promise<CareResult<string>> {
  if (isInvalid(input)) return { ok: false, error: "invalidInput" };

  const task = normalizeCareTaskInput(input);
  const { data, error } = await supabase
    .from("care_tasks")
    .insert({
      plant_id: plantId,
      type: task.type,
      custom_label: task.customLabel,
      interval_days: task.intervalDays,
      next_due_on: task.nextDueOn,
      enabled: task.enabled,
    })
    .select("id")
    .single();
  if (error) return fail(error);

  return { ok: true, data: (data as { id: string }).id };
}

// Typu zadania nie da się zmienić; input.type służy tylko do sprawdzenia własnej nazwy
export async function updateCareTask(
  taskId: string,
  input: CareTaskInput,
): Promise<CareResult> {
  if (isInvalid(input)) return { ok: false, error: "invalidInput" };

  const task = normalizeCareTaskInput(input);
  const { error, count } = await supabase
    .from("care_tasks")
    .update(
      {
        custom_label: task.customLabel,
        interval_days: task.intervalDays,
        next_due_on: task.nextDueOn,
        enabled: task.enabled,
      },
      { count: "exact" },
    )
    .eq("id", taskId);
  if (error) return fail(error);
  if ((count ?? 0) === 0) return { ok: false, error: "notAllowed" };

  return { ok: true, data: null };
}

// Zmienia sam termin (używane przez "Zrobione" i "Odłóż")
export async function setCareTaskDue(
  taskId: string,
  nextDueOn: string,
): Promise<CareResult> {
  if (!isValidIsoDate(nextDueOn)) return { ok: false, error: "invalidInput" };

  const { error, count } = await supabase
    .from("care_tasks")
    .update({ next_due_on: nextDueOn }, { count: "exact" })
    .eq("id", taskId);
  if (error) return fail(error);
  if ((count ?? 0) === 0) return { ok: false, error: "notAllowed" };

  return { ok: true, data: null };
}

export async function deleteCareTask(taskId: string): Promise<CareResult> {
  const { error, count } = await supabase
    .from("care_tasks")
    .delete({ count: "exact" })
    .eq("id", taskId);
  if (error) return fail(error);
  if ((count ?? 0) === 0) return { ok: false, error: "notAllowed" };

  return { ok: true, data: null };
}
