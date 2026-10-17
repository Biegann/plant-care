import { supabase } from "../../../shared/api/supabase";
import { removeGardenPhotos } from "../../garden/api/gardenApi";
import { useAuthStore } from "../hooks/useSession";
import { mapAuthError } from "./authApi";

export type AccountErrorCode =
  | "invalidPassword"
  | "ownsSharedGarden"
  | "photosNotRemoved"
  | "notAuthenticated"
  | "rateLimited"
  | "unknown";
export type AccountResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: AccountErrorCode };

type GardenRef = { id: string; name: string };
// blocking: ogrody z innymi członkami (trzeba przekazać lub usunąć),
// removed: ogrody, które znikną razem z kontem
export type DeletionPlan = { blocking: GardenRef[]; removed: GardenRef[] };

type OwnedGardenRow = {
  id: string;
  name: string;
  garden_members: { user_id: string }[];
};

export function toDeletionPlan(
  rows: OwnedGardenRow[],
  userId: string,
): DeletionPlan {
  const plan: DeletionPlan = { blocking: [], removed: [] };
  const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name, "pl"));
  for (const row of sorted) {
    const shared = row.garden_members.some(
      (member) => member.user_id !== userId,
    );
    (shared ? plan.blocking : plan.removed).push({ id: row.id, name: row.name });
  }
  return plan;
}

export async function getDeletionPlan(): Promise<AccountResult<DeletionPlan>> {
  const userId = useAuthStore.getState().session?.user.id;
  if (!userId) return { ok: false, error: "notAuthenticated" };

  const { data, error } = await supabase
    .from("gardens")
    .select("id, name, garden_members(user_id)")
    .eq("owner_id", userId);
  if (error) return { ok: false, error: "unknown" };
  return {
    ok: true,
    data: toDeletionPlan((data ?? []) as OwnedGardenRow[], userId),
  };
}

// Kolejność: hasło -> blokada -> zdjęcia -> konto. Zdjęcia trzeba skasować przed
// kontem (potem reguły Storage nie wpuszczą); gdy się nie uda, konto zostaje.
export async function deleteAccount(
  password: string,
): Promise<AccountResult> {
  const email = useAuthStore.getState().session?.user.email;
  if (!email) return { ok: false, error: "notAuthenticated" };

  const auth = await supabase.auth.signInWithPassword({ email, password });
  if (auth.error) {
    const code = mapAuthError(auth.error);
    if (code === "invalidCredentials") return { ok: false, error: "invalidPassword" };
    return { ok: false, error: code === "rateLimited" ? "rateLimited" : "unknown" };
  }

  const plan = await getDeletionPlan();
  if (!plan.ok) return plan;
  if (plan.data.blocking.length > 0)
    return { ok: false, error: "ownsSharedGarden" };

  for (const garden of plan.data.removed) {
    const photos = await removeGardenPhotos(garden.id);
    if (!photos.ok) return { ok: false, error: "photosNotRemoved" };
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    return {
      ok: false,
      error: error.message === "owns_shared_garden" ? "ownsSharedGarden" : "unknown",
    };
  }

  // konta już nie ma, więc wystarczy zapomnieć sesję na telefonie;
  // reszta (powiadomienia, cache zapytań) dzieje się jak przy zwykłym wylogowaniu
  await supabase.auth.signOut({ scope: "local" });
  return { ok: true, data: null };
}
