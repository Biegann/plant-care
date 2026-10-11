import { supabase } from "../../../shared/api/supabase";
import { newPhotoPath } from "../photo";
import {
    normalizePlantInput,
    validatePlantInput,
    type NormalizedPlantInput,
    type PlantInput,
} from "../validation";

export const PHOTO_BUCKET = "plant-photos";
const PHOTO_URL_TTL_SECONDS = 3600;

export type Plant = {
  id: string;
  gardenId: string;
  name: string;
  speciesName: string | null;
  locationNote: string | null;
  purchaseDate: string | null;
  notes: string | null;
  photoPath: string | null;
  createdAt: string;
};

export type PlantErrorCode =
  | "invalidName"
  | "invalidInput"
  | "notAllowed"
  | "unknown";
export type PlantResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: PlantErrorCode };
export type PlantSaved = { id: string; photoFailed: boolean };
export type PhotoChange = ArrayBuffer | "remove" | undefined;

type DbError = { code?: string; message?: string };

export function mapPlantError(error: DbError): PlantErrorCode {
  if (error.code === "23514") return "invalidInput";
  if (error.code === "42501") return "notAllowed";
  return "unknown";
}

const fail = (error: DbError): { ok: false; error: PlantErrorCode } => ({
  ok: false,
  error: mapPlantError(error),
});

type PlantRow = {
  id: string;
  garden_id: string;
  name: string;
  species_name: string | null;
  location_note: string | null;
  purchase_date: string | null;
  notes: string | null;
  photo_path: string | null;
  created_at: string;
};

export function toPlant(row: PlantRow): Plant {
  return {
    id: row.id,
    gardenId: row.garden_id,
    name: row.name,
    speciesName: row.species_name,
    locationNote: row.location_note,
    purchaseDate: row.purchase_date,
    notes: row.notes,
    photoPath: row.photo_path,
    createdAt: row.created_at,
  };
}

const toColumns = (input: NormalizedPlantInput) => ({
  name: input.name,
  species_name: input.speciesName,
  location_note: input.locationNote,
  purchase_date: input.purchaseDate,
  notes: input.notes,
});

function inputError(input: PlantInput): PlantErrorCode | null {
  const errors = validatePlantInput(input);
  if (errors.name) return "invalidName";
  return Object.keys(errors).length > 0 ? "invalidInput" : null;
}

// ===== Zdjęcia =====
async function uploadPhoto(
  gardenId: string,
  photo: ArrayBuffer,
): Promise<string | null> {
  const path = newPhotoPath(gardenId);
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, photo, { contentType: "image/jpeg" });
  return error ? null : path;
}

async function removePhoto(path: string): Promise<void> {
  await supabase.storage.from(PHOTO_BUCKET).remove([path]);
}

// Wysyła plik i zapisuje jego ścieżkę w roślinie. Zwraca false, gdy się nie udało.
async function attachPhoto(
  gardenId: string,
  plantId: string,
  photo: ArrayBuffer,
): Promise<boolean> {
  const path = await uploadPhoto(gardenId, photo);
  if (!path) return false;

  const { error } = await supabase
    .from("plants")
    .update({ photo_path: path })
    .eq("id", plantId);
  if (error) {
    await removePhoto(path);
    return false;
  }
  return true;
}

export async function getPhotoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, PHOTO_URL_TTL_SECONDS);
  return error || !data ? null : data.signedUrl;
}

// ===== Rośliny =====
export async function listPlants(
  gardenId: string,
): Promise<PlantResult<Plant[]>> {
  const { data, error } = await supabase
    .from("plants")
    .select("*")
    .eq("garden_id", gardenId)
    .is("archived_at", null)
    .order("name");
  if (error) return fail(error);

  return { ok: true, data: ((data ?? []) as PlantRow[]).map(toPlant) };
}

export async function createPlant(
  gardenId: string,
  input: PlantInput,
  photo?: ArrayBuffer,
): Promise<PlantResult<PlantSaved>> {
  const invalid = inputError(input);
  if (invalid) return { ok: false, error: invalid };

  const { data, error } = await supabase
    .from("plants")
    .insert({ garden_id: gardenId, ...toColumns(normalizePlantInput(input)) })
    .select("id")
    .single();
  if (error) return fail(error);

  const id = (data as { id: string }).id;
  if (!photo) return { ok: true, data: { id, photoFailed: false } };

  const attached = await attachPhoto(gardenId, id, photo);
  return { ok: true, data: { id, photoFailed: !attached } };
}

export async function updatePlant(
  plant: Plant,
  input: PlantInput,
  photo: PhotoChange,
): Promise<PlantResult<PlantSaved>> {
  const invalid = inputError(input);
  if (invalid) return { ok: false, error: invalid };

  const { error, count } = await supabase
    .from("plants")
    .update(toColumns(normalizePlantInput(input)), { count: "exact" })
    .eq("id", plant.id);
  if (error) return fail(error);
  if ((count ?? 0) === 0) return { ok: false, error: "notAllowed" };

  if (photo === undefined)
    return { ok: true, data: { id: plant.id, photoFailed: false } };

  if (photo === "remove") {
    const cleared = await supabase
      .from("plants")
      .update({ photo_path: null })
      .eq("id", plant.id);
    if (cleared.error)
      return { ok: true, data: { id: plant.id, photoFailed: true } };
    if (plant.photoPath) await removePhoto(plant.photoPath);
    return { ok: true, data: { id: plant.id, photoFailed: false } };
  }

  const attached = await attachPhoto(plant.gardenId, plant.id, photo);
  if (attached && plant.photoPath) await removePhoto(plant.photoPath);
  return { ok: true, data: { id: plant.id, photoFailed: !attached } };
}

export async function deletePlant(plant: Plant): Promise<PlantResult> {
  const { error, count } = await supabase
    .from("plants")
    .delete({ count: "exact" })
    .eq("id", plant.id);
  if (error) return fail(error);
  if ((count ?? 0) === 0) return { ok: false, error: "notAllowed" };

  if (plant.photoPath) await removePhoto(plant.photoPath);
  return { ok: true, data: null };
}
