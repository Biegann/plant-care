import { supabase } from "../../../shared/api/supabase";
import { toIsoDate } from "../../../shared/utils/date";
import { PHOTO_BUCKET, type PhotoChange } from "../../plants/api/plantsApi";
import { newPhotoPath } from "../../plants/photo";
import {
  normalizeJournalInput,
  validateJournalInput,
  type JournalInput,
} from "../validation";

// Tyle najnowszych wpisów jednej rośliny pobieramy naraz
export const JOURNAL_LIMIT = 100;
const PHOTO_FOLDER = "journal";

export type JournalEntry = {
  id: string;
  plantId: string;
  entryOn: string;
  note: string | null;
  photoPath: string | null;
  // Brak nazwy, gdy osoba nie ma jej w profilu albo usunęła konto
  createdByName: string | null;
  createdAt: string;
};

export type JournalErrorCode =
  "invalidInput" | "photoUpload" | "notAllowed" | "unknown";
export type JournalResult<T = null> =
  { ok: true; data: T } | { ok: false; error: JournalErrorCode };

type DbError = { code?: string; message?: string };

export function mapJournalError(error: DbError): JournalErrorCode {
  if (error.code === "23514") return "invalidInput";
  if (error.code === "42501") return "notAllowed";
  return "unknown";
}

const fail = (error: DbError): { ok: false; error: JournalErrorCode } => ({
  ok: false,
  error: mapJournalError(error),
});

type JournalRow = {
  id: string;
  plant_id: string;
  entry_on: string;
  note: string | null;
  photo_path: string | null;
  created_at: string;
  created_by_profile: { display_name: string | null } | null;
};

const SELECT =
  "id, plant_id, entry_on, note, photo_path, created_at, created_by_profile:profiles(display_name)";

export function toJournalEntry(row: JournalRow): JournalEntry {
  return {
    id: row.id,
    plantId: row.plant_id,
    entryOn: row.entry_on,
    note: row.note,
    photoPath: row.photo_path,
    createdByName: row.created_by_profile?.display_name ?? null,
    createdAt: row.created_at,
  };
}

const isInvalid = (input: JournalInput) =>
  Object.keys(validateJournalInput(input, toIsoDate(new Date()))).length > 0;

// ===== Zdjęcia =====
async function uploadPhoto(
  gardenId: string,
  photo: ArrayBuffer,
): Promise<string | null> {
  const path = newPhotoPath(gardenId, PHOTO_FOLDER);
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, photo, { contentType: "image/jpeg" });
  return error ? null : path;
}

async function removePhotos(paths: string[]): Promise<void> {
  if (paths.length > 0) await supabase.storage.from(PHOTO_BUCKET).remove(paths);
}

// ===== Wpisy =====
// Dziennik jednej rośliny, od najnowszych wpisów
export async function listJournal(
  plantId: string,
): Promise<JournalResult<JournalEntry[]>> {
  const { data, error } = await supabase
    .from("plant_journal")
    .select(SELECT)
    .eq("plant_id", plantId)
    .order("entry_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(JOURNAL_LIMIT);
  if (error) return fail(error);

  return {
    ok: true,
    data: ((data ?? []) as unknown as JournalRow[]).map(toJournalEntry),
  };
}

// Zdjęcie wysyłamy przed zapisem wpisu, bo wpis może składać się z samego zdjęcia.
// Gdy wysłanie się nie uda, nie zapisujemy niczego
export async function createJournalEntry(
  gardenId: string,
  plantId: string,
  input: JournalInput,
  photo?: ArrayBuffer,
): Promise<JournalResult<JournalEntry>> {
  if (isInvalid({ ...input, hasPhoto: !!photo }))
    return { ok: false, error: "invalidInput" };

  let photoPath: string | null = null;
  if (photo) {
    photoPath = await uploadPhoto(gardenId, photo);
    if (!photoPath) return { ok: false, error: "photoUpload" };
  }

  const { entryOn, note } = normalizeJournalInput(input);
  const { data, error } = await supabase
    .from("plant_journal")
    .insert({
      plant_id: plantId,
      entry_on: entryOn,
      note,
      photo_path: photoPath,
    })
    .select(SELECT)
    .single();
  if (error) {
    if (photoPath) await removePhotos([photoPath]);
    return fail(error);
  }

  return { ok: true, data: toJournalEntry(data as unknown as JournalRow) };
}

// photo: nowe zdjęcie, "remove" albo undefined (bez zmian). Stary plik usuwamy
// dopiero po udanym zapisie, nowy po nieudanym
export async function updateJournalEntry(
  gardenId: string,
  entry: JournalEntry,
  input: JournalInput,
  photo: PhotoChange,
): Promise<JournalResult> {
  const hasPhoto = photo === undefined ? !!entry.photoPath : photo !== "remove";
  if (isInvalid({ ...input, hasPhoto }))
    return { ok: false, error: "invalidInput" };

  let photoPath = entry.photoPath;
  if (photo === "remove") photoPath = null;
  else if (photo) {
    photoPath = await uploadPhoto(gardenId, photo);
    if (!photoPath) return { ok: false, error: "photoUpload" };
  }
  const uploaded = photo instanceof ArrayBuffer ? photoPath : null;

  const { entryOn, note } = normalizeJournalInput(input);
  const { error, count } = await supabase
    .from("plant_journal")
    .update(
      { entry_on: entryOn, note, photo_path: photoPath },
      { count: "exact" },
    )
    .eq("id", entry.id);
  if (error || (count ?? 0) === 0) {
    if (uploaded) await removePhotos([uploaded]);
    return error ? fail(error) : { ok: false, error: "notAllowed" };
  }

  if (photo !== undefined && entry.photoPath)
    await removePhotos([entry.photoPath]);
  return { ok: true, data: null };
}

export async function deleteJournalEntry(
  entry: JournalEntry,
): Promise<JournalResult> {
  const { error, count } = await supabase
    .from("plant_journal")
    .delete({ count: "exact" })
    .eq("id", entry.id);
  if (error) return fail(error);
  if ((count ?? 0) === 0) return { ok: false, error: "notAllowed" };

  if (entry.photoPath) await removePhotos([entry.photoPath]);
  return { ok: true, data: null };
}
