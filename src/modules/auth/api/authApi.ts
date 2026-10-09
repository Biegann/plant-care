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
