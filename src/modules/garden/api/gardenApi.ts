import { supabase } from "../../../shared/api/supabase";
import { useAuthStore } from "../../auth/hooks/useSession";
import { PHOTO_BUCKET } from "../../plants/api/plantsApi";
import {
    isValidGardenName,
    isValidInviteCode,
    normalizeInviteCode,
} from "../validation";

export type GardenRole = "owner" | "member";
export type Garden = { id: string; name: string; role: GardenRole };
export type GardenMember = {
  userId: string;
  displayName: string | null;
  role: GardenRole;
  joinedAt: string;
};

export type GardenErrorCode =
  | "invalidName"
  | "invalidCode"
  | "alreadyMember"
  | "notAllowed"
  | "notAuthenticated"
  | "photosNotRemoved"
  | "unknown";
export type GardenResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: GardenErrorCode };

type DbError = { code?: string; message?: string };

export function mapGardenError(error: DbError): GardenErrorCode {
  const message = error.message ?? "";
  if (message === "invalid_code") return "invalidCode";
  if (message === "already_member") return "alreadyMember";
  if (message === "not_owner") return "notAllowed";
  if (message === "not_authenticated") return "notAuthenticated";
  if (error.code === "23514") return "invalidName";
  return "unknown";
}

const fail = (error: DbError): { ok: false; error: GardenErrorCode } => ({
  ok: false,
  error: mapGardenError(error),
});

const currentUserId = (): string | null =>
  useAuthStore.getState().session?.user.id ?? null;

const ok = { ok: true, data: null } as const;

// ===== Lista ogrodów =====
type GardenRow = { role: GardenRole; gardens: { id: string; name: string } };

export function toGardens(rows: GardenRow[]): Garden[] {
  return rows
    .map((row) => ({
      id: row.gardens.id,
      name: row.gardens.name,
      role: row.role,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pl"));
}

export async function listGardens(): Promise<GardenResult<Garden[]>> {
  const userId = currentUserId();
  if (!userId) return { ok: false, error: "notAuthenticated" };

  const { data, error } = await supabase
    .from("garden_members")
    .select("role, gardens(id, name)")
    .eq("user_id", userId);
  if (error) return fail(error);

  return { ok: true, data: toGardens((data ?? []) as unknown as GardenRow[]) };
}

// ===== Tworzenie, zmiana nazwy, usuwanie =====
export async function createGarden(
  name: string,
): Promise<GardenResult<string>> {
  if (!isValidGardenName(name)) return { ok: false, error: "invalidName" };

  const { data, error } = await supabase.rpc("create_garden", {
    p_name: name.trim(),
  });
  if (error) return fail(error);
  return { ok: true, data: data as string };
}

export async function renameGarden(
  gardenId: string,
  name: string,
): Promise<GardenResult> {
  if (!isValidGardenName(name)) return { ok: false, error: "invalidName" };

  const { error, count } = await supabase
    .from("gardens")
    .update({ name: name.trim() }, { count: "exact" })
    .eq("id", gardenId);
  if (error) return fail(error);
  return (count ?? 0) > 0 ? ok : { ok: false, error: "notAllowed" };
}

// Wszystkie pliki z folderu ogrodu (zdjęcia roślin i, w podfolderze, dziennika).
// Storage zwraca listę porcjami; podfoldery mają id równe null.
const LIST_PAGE = 1000;

async function listFolderFiles(folder: string): Promise<string[] | null> {
  const paths: string[] = [];
  const subfolders: string[] = [];
  for (let offset = 0; ; offset += LIST_PAGE) {
    const { data, error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .list(folder, { limit: LIST_PAGE, offset });
    if (error) return null;
    const items = data ?? [];
    for (const item of items) {
      if (item.id === null) subfolders.push(`${folder}/${item.name}`);
      else paths.push(`${folder}/${item.name}`);
    }
    if (items.length < LIST_PAGE) break;
  }
  for (const subfolder of subfolders) {
    const nested = await listFolderFiles(subfolder);
    if (nested === null) return null;
    paths.push(...nested);
  }
  return paths;
}

// Pliki trzeba skasować przed usunięciem ogrodu: potem reguły Storage
// już nie wpuszczą, bo nikt nie jest członkiem nieistniejącego ogrodu
export async function removeGardenPhotos(
  gardenId: string,
): Promise<GardenResult> {
  const paths = await listFolderFiles(gardenId);
  if (paths === null) return { ok: false, error: "photosNotRemoved" };
  for (let start = 0; start < paths.length; start += LIST_PAGE) {
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .remove(paths.slice(start, start + LIST_PAGE));
    if (error) return { ok: false, error: "photosNotRemoved" };
  }
  return ok;
}

async function isOwner(
  gardenId: string,
  userId: string,
): Promise<GardenResult<boolean>> {
  const { data, error } = await supabase
    .from("garden_members")
    .select("role")
    .eq("garden_id", gardenId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return fail(error);
  const role = (data as { role: GardenRole } | null)?.role;
  return { ok: true, data: role === "owner" };
}

export async function deleteGarden(gardenId: string): Promise<GardenResult> {
  const userId = currentUserId();
  if (!userId) return { ok: false, error: "notAuthenticated" };
  const owner = await isOwner(gardenId, userId);
  if (!owner.ok) return owner;
  if (!owner.data) return { ok: false, error: "notAllowed" };

  const photos = await removeGardenPhotos(gardenId);
  if (!photos.ok) return photos;

  const { error, count } = await supabase
    .from("gardens")
    .delete({ count: "exact" })
    .eq("id", gardenId);
  if (error) return fail(error);
  return (count ?? 0) > 0 ? ok : { ok: false, error: "notAllowed" };
}

// ===== Członkowie =====
type MemberRow = { user_id: string; role: GardenRole; joined_at: string };
type ProfileRow = { id: string; display_name: string | null };

export function mergeMembers(
  members: MemberRow[],
  profiles: ProfileRow[],
): GardenMember[] {
  const names = new Map(
    profiles.map((profile) => [profile.id, profile.display_name]),
  );
  return members
    .map((member) => ({
      userId: member.user_id,
      displayName: names.get(member.user_id) ?? null,
      role: member.role,
      joinedAt: member.joined_at,
    }))
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
      return a.joinedAt.localeCompare(b.joinedAt);
    });
}

export async function listMembers(
  gardenId: string,
): Promise<GardenResult<GardenMember[]>> {
  const members = await supabase
    .from("garden_members")
    .select("user_id, role, joined_at")
    .eq("garden_id", gardenId);
  if (members.error) return fail(members.error);

  const rows = (members.data ?? []) as MemberRow[];
  const profiles = await supabase
    .from("profiles")
    .select("id, display_name")
    .in(
      "id",
      rows.map((row) => row.user_id),
    );
  if (profiles.error) return fail(profiles.error);

  return {
    ok: true,
    data: mergeMembers(rows, (profiles.data ?? []) as ProfileRow[]),
  };
}

export async function removeMember(
  gardenId: string,
  userId: string,
): Promise<GardenResult> {
  const { error, count } = await supabase
    .from("garden_members")
    .delete({ count: "exact" })
    .eq("garden_id", gardenId)
    .eq("user_id", userId);
  if (error) return fail(error);
  return (count ?? 0) > 0 ? ok : { ok: false, error: "notAllowed" };
}

export async function leaveGarden(gardenId: string): Promise<GardenResult> {
  const userId = currentUserId();
  if (!userId) return { ok: false, error: "notAuthenticated" };
  return removeMember(gardenId, userId);
}

// ===== Zaproszenia =====
export async function createInvite(
  gardenId: string,
): Promise<GardenResult<string>> {
  const { data, error } = await supabase.rpc("create_invite", {
    p_garden_id: gardenId,
  });
  if (error) return fail(error);
  return { ok: true, data: data as string };
}

export async function joinGarden(code: string): Promise<GardenResult<string>> {
  if (!isValidInviteCode(code)) return { ok: false, error: "invalidCode" };

  const { data, error } = await supabase.rpc("join_garden", {
    p_code: normalizeInviteCode(code),
  });
  if (error) return fail(error);
  return { ok: true, data: data as string };
}
