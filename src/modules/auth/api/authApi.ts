import { supabase } from "../../../shared/api/supabase";

export type AuthErrorCode = "invalidCredentials" | "emailTaken" | "unknown";
export type AuthResult = { ok: true } | { ok: false; error: AuthErrorCode };

export function mapAuthError(error: {
  code?: string;
  message?: string;
}): AuthErrorCode {
  if (
    error.code === "invalid_credentials" ||
    error.message === "Invalid login credentials"
  ) {
    return "invalidCredentials";
  }
  if (
    error.code === "user_already_exists" ||
    error.message?.includes("already registered")
  ) {
    return "emailTaken";
  }
  return "unknown";
}

export async function signUp(
  email: string,
  password: string,
): Promise<AuthResult> {
  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });
  return error ? { ok: false, error: mapAuthError(error) } : { ok: true };
}

export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  return error ? { ok: false, error: mapAuthError(error) } : { ok: true };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// 1. Prosi Supabase o wysłanie e-maila z 6-cyfrowym kodem
export const sendPasswordResetCode = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};

// 2. Weryfikuje kod wpisany przez użytkownika
export const verifyResetCode = async (email: string, code: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "recovery", // Ważne: informuje Supabase, że to kod do resetu hasła
  });
  if (error) throw error;
  return data;
};

// 3. Ustawia nowe hasło (zadziała tylko, jeśli krok 2 przeszedł pomyślnie)
export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
};
