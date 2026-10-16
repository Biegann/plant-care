jest.mock("../../../shared/api/supabase", () => ({
  supabase: { from: jest.fn(), rpc: jest.fn(), storage: { from: jest.fn() } },
}));

import { supabase } from "../../../shared/api/supabase";
import { useAuthStore } from "../../auth/hooks/useSession";
import {
    createGarden,
    createInvite,
    deleteGarden,
    removeGardenPhotos,
    joinGarden,
    leaveGarden,
    listGardens,
    mapGardenError,
    mergeMembers,
    toGardens,
} from "../api/gardenApi";

const db = supabase as unknown as {
  from: jest.Mock;
  rpc: jest.Mock;
  storage: { from: jest.Mock };
};

// Udaje łańcuch zapytań Supabase (from().select().eq()...), który na końcu zwraca wynik
function chain(result: unknown) {
  const builder: Record<string, unknown> = {};
  ["select", "eq", "in", "update", "delete", "maybeSingle"].forEach(
    (method) => {
      builder[method] = jest.fn(() => builder);
    },
  );
  builder.then = (resolve: (value: unknown) => unknown) => resolve(result);
  return builder;
}

beforeEach(() => {
  useAuthStore.setState({ session: { user: { id: "user-1" } } as never });
});

afterEach(() => {
  jest.resetAllMocks();
  useAuthStore.setState({ session: null });
});

describe("mapGardenError", () => {
  test("komunikaty z funkcji bazy", () => {
    expect(mapGardenError({ message: "invalid_code" })).toBe("invalidCode");
    expect(mapGardenError({ message: "already_member" })).toBe("alreadyMember");
    expect(mapGardenError({ message: "not_owner" })).toBe("notAllowed");
    expect(mapGardenError({ message: "not_authenticated" })).toBe(
      "notAuthenticated",
    );
  });

  test("naruszenie ograniczenia nazwy i błąd nieznany", () => {
    expect(mapGardenError({ code: "23514" })).toBe("invalidName");
    expect(mapGardenError({ message: "cokolwiek" })).toBe("unknown");
  });
});

describe("toGardens i mergeMembers", () => {
  test("toGardens sortuje po nazwie i mapuje rolę", () => {
    const rows = [
      { role: "member" as const, gardens: { id: "1", name: "Działka" } },
      { role: "owner" as const, gardens: { id: "2", name: "Balkon" } },
      { role: "owner" as const, gardens: { id: "3", name: "Dom" } },
    ];
    expect(toGardens(rows).map((garden) => garden.name)).toEqual([
      "Balkon",
      "Dom",
      "Działka",
    ]);
    expect(toGardens(rows)[2]).toEqual({
      id: "1",
      name: "Działka",
      role: "member",
    });
  });

  test("mergeMembers: właściciel pierwszy, nazwy z profili, brak profilu to null", () => {
    const members = [
      { user_id: "b", role: "member" as const, joined_at: "2026-01-02" },
      { user_id: "a", role: "owner" as const, joined_at: "2026-01-01" },
      { user_id: "c", role: "member" as const, joined_at: "2026-01-03" },
    ];
    const profiles = [
      { id: "a", display_name: "Anna" },
      { id: "b", display_name: "Bartek" },
    ];
    const result = mergeMembers(members, profiles);
    expect(result.map((member) => member.userId)).toEqual(["a", "b", "c"]);
    expect(result.map((member) => member.displayName)).toEqual([
      "Anna",
      "Bartek",
      null,
    ]);
  });
});

describe("listGardens", () => {
  test("zwraca ogrody zalogowanego użytkownika", async () => {
    const builder = chain({
      data: [{ role: "owner", gardens: { id: "1", name: "Dom" } }],
      error: null,
    });
    db.from.mockReturnValue(builder);

    const result = await listGardens();

    expect(db.from).toHaveBeenCalledWith("garden_members");
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(result).toEqual({
      ok: true,
      data: [{ id: "1", name: "Dom", role: "owner" }],
    });
  });

  test("bez sesji zwraca notAuthenticated", async () => {
    useAuthStore.setState({ session: null });
    expect(await listGardens()).toEqual({
      ok: false,
      error: "notAuthenticated",
    });
    expect(db.from).not.toHaveBeenCalled();
  });
});

describe("createGarden", () => {
  test("zła nazwa: nie wysyła zapytania", async () => {
    expect(await createGarden("   ")).toEqual({
      ok: false,
      error: "invalidName",
    });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  test("tworzy ogród z przyciętą nazwą i zwraca jego id", async () => {
    db.rpc.mockResolvedValue({ data: "garden-1", error: null });
    expect(await createGarden("  Balkon ")).toEqual({
      ok: true,
      data: "garden-1",
    });
    expect(db.rpc).toHaveBeenCalledWith("create_garden", { p_name: "Balkon" });
  });

  test("błąd bazy jest zamieniany na kod", async () => {
    db.rpc.mockResolvedValue({
      data: null,
      error: { message: "not_authenticated" },
    });
    expect(await createGarden("Balkon")).toEqual({
      ok: false,
      error: "notAuthenticated",
    });
  });
});

describe("joinGarden i createInvite", () => {
  test("kod jest normalizowany przed wysłaniem", async () => {
    db.rpc.mockResolvedValue({ data: "garden-1", error: null });
    expect(await joinGarden(" abcd-1234 ef ")).toEqual({
      ok: true,
      data: "garden-1",
    });
    expect(db.rpc).toHaveBeenCalledWith("join_garden", {
      p_code: "ABCD1234EF",
    });
  });

  test("zły format kodu: nie wysyła zapytania", async () => {
    expect(await joinGarden("abc")).toEqual({
      ok: false,
      error: "invalidCode",
    });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  test("błędy z bazy: zły kod i już jesteś członkiem", async () => {
    db.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "invalid_code" },
    });
    expect(await joinGarden("ABCD1234EF")).toEqual({
      ok: false,
      error: "invalidCode",
    });

    db.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "already_member" },
    });
    expect(await joinGarden("ABCD1234EF")).toEqual({
      ok: false,
      error: "alreadyMember",
    });
  });

  test("createInvite zwraca kod z bazy", async () => {
    db.rpc.mockResolvedValue({ data: "ABCD1234EF", error: null });
    expect(await createInvite("garden-1")).toEqual({
      ok: true,
      data: "ABCD1234EF",
    });
    expect(db.rpc).toHaveBeenCalledWith("create_invite", {
      p_garden_id: "garden-1",
    });
  });
});

// Udaje Storage: `folders` to zawartość folderów (id null = podfolder)
function storage(
  folders: Record<string, { id: string | null; name: string }[]>,
  options: { listError?: boolean; removeError?: boolean } = {},
) {
  const bucket = {
    list: jest.fn(async (folder: string) =>
      options.listError
        ? { data: null, error: { message: "network" } }
        : { data: folders[folder] ?? [], error: null },
    ),
    remove: jest.fn(async () =>
      options.removeError
        ? { data: null, error: { message: "network" } }
        : { data: [], error: null },
    ),
  };
  db.storage.from.mockReturnValue(bucket);
  return bucket;
}

const ownerRow = () => chain({ data: { role: "owner" }, error: null });

describe("removeGardenPhotos", () => {
  test("kasuje zdjęcia roślin i dziennika z folderu ogrodu", async () => {
    const bucket = storage({
      "garden-1": [
        { id: "a", name: "p1.jpg" },
        { id: null, name: "journal" },
      ],
      "garden-1/journal": [{ id: "b", name: "j1.jpg" }],
    });
    expect(await removeGardenPhotos("garden-1")).toEqual({
      ok: true,
      data: null,
    });
    expect(bucket.remove).toHaveBeenCalledWith([
      "garden-1/p1.jpg",
      "garden-1/journal/j1.jpg",
    ]);
  });

  test("pobiera listę porcjami, gdy plików jest dużo", async () => {
    const page = Array.from({ length: 1000 }, (_, i) => ({
      id: `id-${i}`,
      name: `${i}.jpg`,
    }));
    const bucket = storage({});
    bucket.list
      .mockResolvedValueOnce({ data: page, error: null })
      .mockResolvedValueOnce({
        data: [{ id: "x", name: "last.jpg" }],
        error: null,
      });
    await removeGardenPhotos("garden-1");
    expect(bucket.list).toHaveBeenNthCalledWith(2, "garden-1", {
      limit: 1000,
      offset: 1000,
    });
    expect(bucket.remove).toHaveBeenCalledTimes(2);
    expect(bucket.remove).toHaveBeenLastCalledWith(["garden-1/last.jpg"]);
  });

  test("bez plików niczego nie kasuje", async () => {
    const bucket = storage({});
    expect((await removeGardenPhotos("garden-1")).ok).toBe(true);
    expect(bucket.remove).not.toHaveBeenCalled();
  });

  test("błąd listy lub kasowania daje photosNotRemoved", async () => {
    storage({}, { listError: true });
    expect(await removeGardenPhotos("garden-1")).toEqual({
      ok: false,
      error: "photosNotRemoved",
    });
    storage(
      { "garden-1": [{ id: "a", name: "p1.jpg" }] },
      { removeError: true },
    );
    expect(await removeGardenPhotos("garden-1")).toEqual({
      ok: false,
      error: "photosNotRemoved",
    });
  });
});

describe("deleteGarden i leaveGarden", () => {
  test("właściciel: najpierw kasuje zdjęcia, potem ogród", async () => {
    const bucket = storage({ "garden-1": [{ id: "a", name: "p1.jpg" }] });
    const deleteQuery = chain({ error: null, count: 1 });
    db.from.mockReturnValueOnce(ownerRow()).mockReturnValueOnce(deleteQuery);
    expect(await deleteGarden("garden-1")).toEqual({ ok: true, data: null });
    expect(bucket.remove).toHaveBeenCalledWith(["garden-1/p1.jpg"]);
    expect(deleteQuery.delete).toHaveBeenCalled();
  });

  test("gdy zdjęć nie udało się skasować, ogród zostaje", async () => {
    storage({}, { listError: true });
    db.from.mockReturnValueOnce(ownerRow());
    expect(await deleteGarden("garden-1")).toEqual({
      ok: false,
      error: "photosNotRemoved",
    });
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  test("członek nie rusza zdjęć i dostaje notAllowed", async () => {
    const bucket = storage({ "garden-1": [{ id: "a", name: "p1.jpg" }] });
    db.from.mockReturnValueOnce(
      chain({ data: { role: "member" }, error: null }),
    );
    expect(await deleteGarden("garden-1")).toEqual({
      ok: false,
      error: "notAllowed",
    });
    expect(bucket.list).not.toHaveBeenCalled();
  });

  test("błąd sprawdzania roli (np. brak sieci) daje unknown", async () => {
    const bucket = storage({});
    db.from.mockReturnValueOnce(
      chain({ data: null, error: { message: "network" } }),
    );
    expect(await deleteGarden("garden-1")).toEqual({
      ok: false,
      error: "unknown",
    });
    expect(bucket.list).not.toHaveBeenCalled();
  });

  test("bez sesji zwraca notAuthenticated", async () => {
    useAuthStore.setState({ session: null });
    expect(await deleteGarden("garden-1")).toEqual({
      ok: false,
      error: "notAuthenticated",
    });
  });

  test("brak uprawnień, gdy usunięto 0 wierszy", async () => {
    storage({});
    db.from
      .mockReturnValueOnce(ownerRow())
      .mockReturnValueOnce(chain({ error: null, count: 0 }));
    expect(await deleteGarden("garden-1")).toEqual({
      ok: false,
      error: "notAllowed",
    });
  });

  test("opuszczanie bez sesji zwraca notAuthenticated", async () => {
    useAuthStore.setState({ session: null });
    expect(await leaveGarden("garden-1")).toEqual({
      ok: false,
      error: "notAuthenticated",
    });
  });

  test("właściciel nie może opuścić ogrodu (0 wierszy)", async () => {
    db.from.mockReturnValue(chain({ error: null, count: 0 }));
    expect(await leaveGarden("garden-1")).toEqual({
      ok: false,
      error: "notAllowed",
    });
  });
});
