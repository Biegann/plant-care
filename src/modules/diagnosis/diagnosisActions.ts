import { queryClient } from "../../shared/api/queryClient";
import { toIsoDate } from "../../shared/utils/date";
import type { JournalEntry, JournalResult } from "../journal/api/journalApi";
import { createJournalEntryAndRefresh } from "../journal/journalActions";
import { preparePhoto } from "../plants/preparePhoto";
import {
  diagnosePlant,
  type DiagnosisApiResult,
  type Diagnosis,
  type DiagnosisRequest,
} from "./api/diagnosisApi";
import { remainingDiagnosesKey } from "./hooks/useRemainingDiagnoses";

// Po odpowiedzi funkcji od razu znamy aktualny licznik, więc wpisujemy go bez
// ponownego pytania bazy
export async function diagnosePlantAndRefresh(
  request: DiagnosisRequest,
): Promise<DiagnosisApiResult<Diagnosis>> {
  const result = await diagnosePlant(request);
  if (result.ok)
    queryClient.setQueryData(remainingDiagnosesKey, result.data.remaining);
  else if (result.error === "limitReached")
    queryClient.setQueryData(remainingDiagnosesKey, 0);
  return result;
}

// Zwykły wpis w dzienniku z dzisiejszą datą. Zdjęcie przygotowujemy jeszcze raz
// z oryginału w rozmiarze dziennika (800 px, 60%), a nie z wersji do diagnozy
export async function saveDiagnosisToJournal(
  gardenId: string,
  plantId: string,
  photoUri: string,
  note: string,
): Promise<JournalResult<JournalEntry>> {
  let photo: ArrayBuffer;
  try {
    photo = await preparePhoto(photoUri, 0, 0);
  } catch {
    return { ok: false, error: "photoUpload" };
  }
  return createJournalEntryAndRefresh(
    gardenId,
    plantId,
    { entryOn: toIsoDate(new Date()), note, hasPhoto: true },
    photo,
  );
}
