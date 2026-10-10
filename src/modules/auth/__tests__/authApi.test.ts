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
  requestPasswordReset,
  resetPasswordWithCode,
  signIn,
  signUp,
} from "../api/authApi";
import { useAuthStore } from "../hooks/useSession";

const auth = supabase.auth as unknown as Record<string, jest.Mock>;

afterEach(() => jest.resetAllMocks());

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

  test("zły lub wygasły kod", () => {
    expect(mapAuthError({ code: "otp_expired" })).toBe("invalidCode");
    expect(mapAuthError({ message: "Token has expired or is invalid" })).toBe(
      "invalidCode",
    );
  });

  test("limit wysyłek", () => {
    expect(mapAuthError({ code: "over_email_send_rate_limit" })).toBe(
      "rateLimited",
    );
  });

  test("to samo hasło", () => {
    expect(mapAuthError({ code: "same_password" })).toBe("samePassword");
  });

  test("nieznany błąd", () => {
    expect(mapAuthError({ message: "cokolwiek" })).toBe("unknown");
  });
});

describe("signIn i signUp", () => {
  test("signIn zwraca ok, gdy nie ma błędu", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null });
    expect(await signIn("a@b.pl", "haslo1234")).toEqual({ ok: true });
  });

  test("signIn zwraca kod błędu przy złych danych", async () => {
    auth.signInWithPassword.mockResolvedValue({
      error: { code: "invalid_credentials" },
    });
    expect(await signIn("a@b.pl", "zlehaslo")).toEqual({
      ok: false,
      error: "invalidCredentials",
    });
  });

  test("signIn usuwa spacje z adresu e-mail", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null });
    await signIn("  a@b.pl ", "haslo1234");
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "a@b.pl",
      password: "haslo1234",
    });
  });

  test("signUp zwraca emailTaken dla istniejącego konta", async () => {
    auth.signUp.mockResolvedValue({ error: { code: "user_already_exists" } });
    expect(await signUp("a@b.pl", "haslo1234")).toEqual({
      ok: false,
      error: "emailTaken",
    });
  });
});

describe("requestPasswordReset", () => {
  test("wysyła kod na przycięty adres e-mail", async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    expect(await requestPasswordReset("  a@b.pl ")).toEqual({ ok: true });
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("a@b.pl");
  });

  test("zwraca rateLimited, gdy wysyłek jest za dużo", async () => {
    auth.resetPasswordForEmail.mockResolvedValue({
      error: { code: "over_email_send_rate_limit" },
    });
    expect(await requestPasswordReset("a@b.pl")).toEqual({
      ok: false,
      error: "rateLimited",
    });
  });
});

describe("resetPasswordWithCode", () => {
  test("weryfikuje kod, a potem zmienia hasło", async () => {
    auth.verifyOtp.mockResolvedValue({ error: null });
    auth.updateUser.mockResolvedValue({ error: null });

    const result = await resetPasswordWithCode(
      " a@b.pl ",
      " 123456 ",
      "noweHaslo1",
    );

    expect(result).toEqual({ ok: true });
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      email: "a@b.pl",
      token: "123456",
      type: "recovery",
    });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "noweHaslo1" });
  });

  test("na czas operacji ustawia flagę recovering, a po niej ją zeruje", async () => {
    let recoveringDuringVerify: boolean | undefined;
    auth.verifyOtp.mockImplementation(async () => {
      recoveringDuringVerify = useAuthStore.getState().recovering;
      return { error: null };
    });
    auth.updateUser.mockResolvedValue({ error: null });

    await resetPasswordWithCode("a@b.pl", "123456", "noweHaslo1");

    expect(recoveringDuringVerify).toBe(true);
    expect(useAuthStore.getState().recovering).toBe(false);
  });

  test("zły kod: zwraca invalidCode i nie zmienia hasła", async () => {
    auth.verifyOtp.mockResolvedValue({ error: { code: "otp_expired" } });

    const result = await resetPasswordWithCode(
      "a@b.pl",
      "000000",
      "noweHaslo1",
    );

    expect(result).toEqual({ ok: false, error: "invalidCode" });
    expect(auth.updateUser).not.toHaveBeenCalled();
    expect(useAuthStore.getState().recovering).toBe(false);
  });

  test("błąd zmiany hasła: wylogowuje i zwraca kod błędu", async () => {
    auth.verifyOtp.mockResolvedValue({ error: null });
    auth.updateUser.mockResolvedValue({ error: { code: "same_password" } });
    auth.signOut.mockResolvedValue({ error: null });

    const result = await resetPasswordWithCode(
      "a@b.pl",
      "123456",
      "stareHaslo1",
    );

    expect(result).toEqual({ ok: false, error: "samePassword" });
    expect(auth.signOut).toHaveBeenCalled();
    expect(useAuthStore.getState().recovering).toBe(false);
  });
});
