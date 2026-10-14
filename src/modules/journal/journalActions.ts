import { queryClient } from "../../shared/api/queryClient";
import type { PhotoChange } from "../plants/api/plantsApi";
import {
  createJournalEntry,
  deleteJournalEntry,
  updateJournalEntry,
  type JournalEntry,
  type JournalResult,
} from "./api/journalApi";
import { journalQueryKey } from "./hooks/useJournal";
import type { JournalInput } from "./validation";

const refreshJournal = (plantId: string) =>
  queryClient.invalidateQueries({ queryKey: journalQueryKey(plantId) });

export async function createJournalEntryAndRefresh(
  gardenId: string,
  plantId: string,
  input: JournalInput,
  photo?: ArrayBuffer,
): Promise<JournalResult<JournalEntry>> {
  const result = await createJournalEntry(gardenId, plantId, input, photo);
  if (result.ok) await refreshJournal(plantId);
  return result;
}

export async function updateJournalEntryAndRefresh(
  gardenId: string,
  entry: JournalEntry,
  input: JournalInput,
  photo: PhotoChange,
): Promise<JournalResult> {
  const result = await updateJournalEntry(gardenId, entry, input, photo);
  if (result.ok) await refreshJournal(entry.plantId);
  return result;
}

export async function deleteJournalEntryAndRefresh(
  entry: JournalEntry,
): Promise<JournalResult> {
  const result = await deleteJournalEntry(entry);
  if (result.ok) await refreshJournal(entry.plantId);
  return result;
}
