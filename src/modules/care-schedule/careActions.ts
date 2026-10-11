import { queryClient } from "../../shared/api/queryClient";
import {
    createCareTask,
    deleteCareTask,
    setCareTaskDue,
    updateCareTask,
    type CareResult,
    type CareTask,
} from "./api/careApi";
import { nextDueAfterDone, nextDueAfterPostpone } from "./schedule";
import type { CareTaskInput } from "./validation";

const refreshCareTasks = (gardenId: string) =>
  queryClient.invalidateQueries({ queryKey: ["care-tasks", gardenId] });

async function refreshOnSuccess<T>(
  gardenId: string,
  result: CareResult<T>,
): Promise<CareResult<T>> {
  if (result.ok) await refreshCareTasks(gardenId);
  return result;
}

export async function createCareTaskAndRefresh(
  gardenId: string,
  plantId: string,
  input: CareTaskInput,
): Promise<CareResult<string>> {
  return refreshOnSuccess(gardenId, await createCareTask(plantId, input));
}

export async function updateCareTaskAndRefresh(
  gardenId: string,
  taskId: string,
  input: CareTaskInput,
): Promise<CareResult> {
  return refreshOnSuccess(gardenId, await updateCareTask(taskId, input));
}

// "Zrobione": następny termin to dzień wykonania + interwał
export async function completeCareTaskAndRefresh(
  gardenId: string,
  task: CareTask,
  today: string,
): Promise<CareResult> {
  const nextDueOn = nextDueAfterDone(today, task.intervalDays);
  return refreshOnSuccess(gardenId, await setCareTaskDue(task.id, nextDueOn));
}

// "Odłóż o 1 dzień": termin przesuwa się na jutro
export async function postponeCareTaskAndRefresh(
  gardenId: string,
  task: CareTask,
  today: string,
): Promise<CareResult> {
  const nextDueOn = nextDueAfterPostpone(today);
  return refreshOnSuccess(gardenId, await setCareTaskDue(task.id, nextDueOn));
}

export async function deleteCareTaskAndRefresh(
  gardenId: string,
  taskId: string,
): Promise<CareResult> {
  return refreshOnSuccess(gardenId, await deleteCareTask(taskId));
}
