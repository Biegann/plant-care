jest.mock("../../../shared/api/supabase", () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    functions: { invoke: jest.fn() },
    auth: { signInWithPassword: jest.fn(), signOut: jest.fn() },
  },
}));

import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "../../../shared/api/supabase";
import {
  deleteAccount,
  getDeletionPlan,
  toDeletionPlan,
} from "../api/accountApi";
import { useAuthStore } from "../hooks/useSession";

const db = supabase as unknown as {
  from: jest.Mock;
  rpc: jest.Mock;
  functions: { invoke: jest.Mock };
  auth: { signInWithPassword: jest.Mock; signOut: jest.Mock };
};

function httpError(status: number, body: unknown) {
  return new FunctionsHttpError(
    new Response(JSON.stringify(body), { status }),
  );
}

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
  test("złe hasło: nie wywołuje funkcji", async () => {
    db.auth.signInWithPassword.mockResolvedValue({
      error: { code: "invalid_credentials" },
    });
    expect(await deleteAccount("zle")).toEqual({
      ok: false,
      error: "invalidPassword",
    });
    expect(db.functions.invoke).not.toHaveBeenCalled();
  });

  test("sukces: wywołuje delete-account i wylogowuje lokalnie", async () => {
    db.auth.signInWithPassword.mockResolvedValue({ error: null });
    db.functions.invoke.mockResolvedValue({ data: { ok: true }, error: null });
    expect(await deleteAccount("haslo")).toEqual({ ok: true, data: null });
    expect(db.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "a@b.pl",
      password: "haslo",
    });
    expect(db.functions.invoke).toHaveBeenCalledWith("delete-account");
    expect(db.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  test("wspólny ogród zgłoszony przez funkcję", async () => {
    db.auth.signInWithPassword.mockResolvedValue({ error: null });
    db.functions.invoke.mockResolvedValue({
      data: null,
      error: httpError(409, { error: "ownsSharedGarden", gardens: ["Dom"] }),
    });
    expect(await deleteAccount("haslo")).toEqual({
      ok: false,
      error: "ownsSharedGarden",
    });
    expect(db.auth.signOut).not.toHaveBeenCalled();
  });

  test("błąd kasowania zdjęć: konto zostaje", async () => {
    db.auth.signInWithPassword.mockResolvedValue({ error: null });
    db.functions.invoke.mockResolvedValue({
      data: null,
      error: httpError(500, { error: "photosNotRemoved" }),
    });
    expect(await deleteAccount("haslo")).toEqual({
      ok: false,
      error: "photosNotRemoved",
    });
    expect(db.auth.signOut).not.toHaveBeenCalled();
  });

  test("błąd sieci lub nieznany kod: unknown", async () => {
    db.auth.signInWithPassword.mockResolvedValue({ error: null });
    db.functions.invoke.mockResolvedValue({
      data: null,
      error: new FunctionsFetchError("offline"),
    });
    expect(await deleteAccount("haslo")).toEqual({
      ok: false,
      error: "unknown",
    });
    db.functions.invoke.mockResolvedValue({
      data: null,
      error: httpError(500, { error: "serverError" }),
    });
    expect(await deleteAccount("haslo")).toEqual({
      ok: false,
      error: "unknown",
    });
  });
});
