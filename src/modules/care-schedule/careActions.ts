import { queryClient } from "../../shared/api/queryClient";
import { syncNotifications } from "../notifications/sync";
import {
    completeCareTask,
    createCareTask,
    deleteCareTask,
    setCareTaskDue,
    updateCareTask,
    type CareResult,
    type CareTask,
} from "./api/careApi";
import { deleteCareLogEntry } from "./api/careLogApi";
import { nextDueAfterPostpone } from "./schedule";
import type { CareTaskInput } from "./validation";

// Każda zmiana zadań zmienia też plan powiadomień; przeliczamy go w tle, bez czekania
const refreshCareTasks = (gardenId: string) => {
  void syncNotifications();
  return queryClient.invalidateQueries({ queryKey: ["care-tasks", gardenId] });
};

const refreshCareLog = (plantId: string) =>
  queryClient.invalidateQueries({ queryKey: ["care-log", plantId] });

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

// "Zrobione": baza zapisuje wpis w historii i ustawia termin na dzień wykonania + interwał
export async function completeCareTaskAndRefresh(
  gardenId: string,
  task: CareTask,
  today: string,
): Promise<CareResult<string>> {
  const result = await completeCareTask(task.id, today);
  if (result.ok) {
    await Promise.all([refreshCareTasks(gardenId), refreshCareLog(task.plantId)]);
  }
  return result;
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

// Usuwa wpis z historii; termin zadania zostaje bez zmian
export async function deleteCareLogEntryAndRefresh(
  plantId: string,
  entryId: string,
): Promise<CareResult> {
  const result = await deleteCareLogEntry(entryId);
  if (result.ok) await refreshCareLog(plantId);
  return result;
}
