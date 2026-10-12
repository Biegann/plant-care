import { supabase } from "../../../shared/api/supabase";
import type { CareType } from "../validation";
import { mapCareError, type CareResult } from "./careApi";

// Tyle najnowszych wpisów jednej rośliny pobieramy naraz
export const CARE_LOG_LIMIT = 100;

export type CareLogEntry = {
  id: string;
  plantId: string;
  type: CareType;
  customLabel: string | null;
  doneOn: string;
  // Brak nazwy, gdy osoba nie ma jej w profilu, opuściła ogród albo usunęła konto
  doneByName: string | null;
};

type CareLogRow = {
  id: string;
  plant_id: string;
  type: CareType;
  custom_label: string | null;
  done_on: string;
  done_by_profile: { display_name: string | null } | null;
};

export function toCareLogEntry(row: CareLogRow): CareLogEntry {
  return {
    id: row.id,
    plantId: row.plant_id,
    type: row.type,
    customLabel: row.custom_label,
    doneOn: row.done_on,
    doneByName: row.done_by_profile?.display_name ?? null,
  };
}

// Historia jednej rośliny, od najnowszych wpisów
export async function listCareLog(
  plantId: string,
): Promise<CareResult<CareLogEntry[]>> {
  const { data, error } = await supabase
    .from("care_log")
    .select(
      "id, plant_id, type, custom_label, done_on, done_by_profile:profiles(display_name)",
    )
    .eq("plant_id", plantId)
    .order("done_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(CARE_LOG_LIMIT);
  if (error) return { ok: false, error: mapCareError(error) };

  return {
    ok: true,
    data: ((data ?? []) as unknown as CareLogRow[]).map(toCareLogEntry),
  };
}

export async function deleteCareLogEntry(entryId: string): Promise<CareResult> {
  const { error, count } = await supabase
    .from("care_log")
    .delete({ count: "exact" })
    .eq("id", entryId);
  if (error) return { ok: false, error: mapCareError(error) };
  if ((count ?? 0) === 0) return { ok: false, error: "notAllowed" };

  return { ok: true, data: null };
}
