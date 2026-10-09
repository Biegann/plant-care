jest.mock("../../../shared/api/supabase", () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

import { supabase } from "../../../shared/api/supabase";
import { mapAuthError, signIn, signUp } from "../api/authApi";

const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;
const mockSignUp = supabase.auth.signUp as jest.Mock;

describe("mapAuthError", () => {
  test("błędne dane logowania", () => {
    expect(mapAuthError({ code: "invalid_credentials" })).toBe(
      "invalidCredentials",
    );
    expect(mapAuthError({ message: "Invalid login credentials" })).toBe(
      "invalidCredentials",
    );
  });

  test("zajęty adres e-mail", () => {
    expect(mapAuthError({ code: "user_already_exists" })).toBe("emailTaken");
    expect(mapAuthError({ message: "User already registered" })).toBe(
      "emailTaken",
    );
  });

  test("nieznany błąd", () => {
    expect(mapAuthError({ message: "cokolwiek" })).toBe("unknown");
  });
});

describe("signIn i signUp", () => {
  afterEach(() => jest.clearAllMocks());

  test("signIn zwraca ok, gdy nie ma błędu", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    expect(await signIn("a@b.pl", "haslo1234")).toEqual({ ok: true });
  });

  test("signIn zwraca kod błędu przy złych danych", async () => {
    mockSignIn.mockResolvedValue({ error: { code: "invalid_credentials" } });
    expect(await signIn("a@b.pl", "zlehaslo")).toEqual({
      ok: false,
      error: "invalidCredentials",
    });
  });

  test("signIn usuwa spacje z adresu e-mail", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    await signIn("  a@b.pl ", "haslo1234");
    expect(mockSignIn).toHaveBeenCalledWith({
      email: "a@b.pl",
      password: "haslo1234",
    });
  });

  test("signUp zwraca emailTaken dla istniejącego konta", async () => {
    mockSignUp.mockResolvedValue({ error: { code: "user_already_exists" } });
    expect(await signUp("a@b.pl", "haslo1234")).toEqual({
      ok: false,
      error: "emailTaken",
    });
  });
});
