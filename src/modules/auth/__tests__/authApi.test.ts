jest.mock("../../../shared/api/supabase", () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      verifyOtp: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

import { supabase } from "../../../shared/api/supabase";
import {
    mapAuthError,
    sendPasswordResetCode,
    signIn,
    signUp,
    updatePassword,
    verifyResetCode,
} from "../api/authApi";

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

describe("Logika resetowania hasła", () => {
  afterEach(() => jest.clearAllMocks());

  test("sendPasswordResetCode wywołuje metodę resetPasswordForEmail", async () => {
    (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
      error: null,
    });

    await sendPasswordResetCode("test@example.com");

    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "test@example.com",
    );
  });

  test("verifyResetCode weryfikuje kod OTP z odpowiednim typem", async () => {
    (supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
      data: {},
      error: null,
    });

    await verifyResetCode("test@example.com", "123456");

    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: "test@example.com",
      token: "123456",
      type: "recovery",
    });
  });

  test("updatePassword aktualizuje hasło użytkownika", async () => {
    (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
      data: {},
      error: null,
    });

    await updatePassword("NoweHaslo123!");

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      password: "NoweHaslo123!",
    });
  });
});
