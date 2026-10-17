jest.mock("../../../shared/api/supabase", () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: { signInWithPassword: jest.fn(), signOut: jest.fn() },
  },
}));
jest.mock("../../garden/api/gardenApi", () => ({
  removeGardenPhotos: jest.fn(),
}));

import { supabase } from "../../../shared/api/supabase";
import { removeGardenPhotos } from "../../garden/api/gardenApi";
import {
  deleteAccount,
  getDeletionPlan,
  toDeletionPlan,
} from "../api/accountApi";
import { useAuthStore } from "../hooks/useSession";

const db = supabase as unknown as {
  from: jest.Mock;
  rpc: jest.Mock;
  auth: { signInWithPassword: jest.Mock; signOut: jest.Mock };
};
const removePhotos = removeGardenPhotos as jest.Mock;

function chain(result: unknown) {
  const builder: Record<string, unknown> = {};
  ["select", "eq"].forEach((method) => {
    builder[method] = jest.fn(() => builder);
  });
  builder.then = (resolve: (value: unknown) => unknown) => resolve(result);
  return builder;
}

const shared = {
  id: "g-dom",
  name: "Dom",
  garden_members: [{ user_id: "user-1" }, { user_id: "user-2" }],
};
const alone = {
  id: "g-balkon",
  name: "Balkon",
  garden_members: [{ user_id: "user-1" }],
};

beforeEach(() => {
  useAuthStore.setState({
    session: { user: { id: "user-1", email: "a@b.pl" } } as never,
  });
});

afterEach(() => {
  jest.resetAllMocks();
  useAuthStore.setState({ session: null });
});

describe("toDeletionPlan", () => {
  test("ogród z innymi członkami blokuje, ogród tylko z właścicielem znika", () => {
    expect(toDeletionPlan([shared, alone], "user-1")).toEqual({
      blocking: [{ id: "g-dom", name: "Dom" }],
      removed: [{ id: "g-balkon", name: "Balkon" }],
    });
  });

  test("bez ogrodów plan jest pusty", () => {
    expect(toDeletionPlan([], "user-1")).toEqual({ blocking: [], removed: [] });
  });
});

describe("getDeletionPlan", () => {
  test("pyta o ogrody, których użytkownik jest właścicielem", async () => {
    const query = chain({ data: [alone], error: null });
    db.from.mockReturnValue(query);
    const result = await getDeletionPlan();
    expect(db.from).toHaveBeenCalledWith("gardens");
    expect(query.eq).toHaveBeenCalledWith("owner_id", "user-1");
    expect(result).toEqual({
      ok: true,
      data: { blocking: [], removed: [{ id: "g-balkon", name: "Balkon" }] },
    });
  });

  test("bez sesji zwraca notAuthenticated", async () => {
    useAuthStore.setState({ session: null });
    expect(await getDeletionPlan()).toEqual({
      ok: false,
      error: "notAuthenticated",
    });
  });
});

describe("deleteAccount", () => {
  test("złe hasło: nic nie kasuje", async () => {
    db.auth.signInWithPassword.mockResolvedValue({
      error: { code: "invalid_credentials" },
    });
    expect(await deleteAccount("zle")).toEqual({
      ok: false,
      error: "invalidPassword",
    });
    expect(db.rpc).not.toHaveBeenCalled();
    expect(removePhotos).not.toHaveBeenCalled();
  });

  test("wspólny ogród blokuje usunięcie", async () => {
    db.auth.signInWithPassword.mockResolvedValue({ error: null });
    db.from.mockReturnValue(chain({ data: [shared, alone], error: null }));
    expect(await deleteAccount("haslo")).toEqual({
      ok: false,
      error: "ownsSharedGarden",
    });
    expect(removePhotos).not.toHaveBeenCalled();
    expect(db.rpc).not.toHaveBeenCalled();
  });

  test("błąd kasowania zdjęć: konto zostaje", async () => {
    db.auth.signInWithPassword.mockResolvedValue({ error: null });
    db.from.mockReturnValue(chain({ data: [alone], error: null }));
    removePhotos.mockResolvedValue({ ok: false, error: "photosNotRemoved" });
    expect(await deleteAccount("haslo")).toEqual({
      ok: false,
      error: "photosNotRemoved",
    });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  test("sukces: kasuje zdjęcia, konto i wylogowuje lokalnie", async () => {
    db.auth.signInWithPassword.mockResolvedValue({ error: null });
    db.from.mockReturnValue(chain({ data: [alone], error: null }));
    removePhotos.mockResolvedValue({ ok: true, data: null });
    db.rpc.mockResolvedValue({ error: null });
    expect(await deleteAccount("haslo")).toEqual({ ok: true, data: null });
    expect(db.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "a@b.pl",
      password: "haslo",
    });
    expect(removePhotos).toHaveBeenCalledWith("g-balkon");
    expect(db.rpc).toHaveBeenCalledWith("delete_my_account");
    expect(db.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  test("blokada zgłoszona przez bazę", async () => {
    db.auth.signInWithPassword.mockResolvedValue({ error: null });
    db.from.mockReturnValue(chain({ data: [], error: null }));
    db.rpc.mockResolvedValue({ error: { message: "owns_shared_garden" } });
    expect(await deleteAccount("haslo")).toEqual({
      ok: false,
      error: "ownsSharedGarden",
    });
    expect(db.auth.signOut).not.toHaveBeenCalled();
  });
});
