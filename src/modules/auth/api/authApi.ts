import { supabase } from "../../../shared/api/supabase";
import { useAuthStore } from "../hooks/useSession";

export type AuthErrorCode =
  | "invalidCredentials"
  | "emailTaken"
  | "invalidCode"
  | "rateLimited"
  | "samePassword"
  | "unknown";
export type AuthResult = { ok: true } | { ok: false; error: AuthErrorCode };

export function mapAuthError(error: {
  code?: string;
  message?: string;
}): AuthErrorCode {
  const message = error.message?.toLowerCase() ?? "";
  if (
    error.code === "invalid_credentials" ||
    message === "invalid login credentials"
  ) {
    return "invalidCredentials";
  }
  if (
    error.code === "user_already_exists" ||
    message.includes("already registered")
  ) {
    return "emailTaken";
  }
  if (
    error.code === "otp_expired" ||
    message.includes("expired or is invalid")
  ) {
    return "invalidCode";
  }
  if (
    error.code === "over_email_send_rate_limit" ||
    error.code === "over_request_rate_limit" ||
    message.includes("rate limit")
  ) {
    return "rateLimited";
  }
  if (error.code === "same_password") {
    return "samePassword";
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

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  return error ? { ok: false, error: mapAuthError(error) } : { ok: true };
}

export async function resetPasswordWithCode(
  email: string,
  code: string,
  newPassword: string,
): Promise<AuthResult> {
  // verifyOtp loguje użytkownika. Do końca operacji strażnik tras ma go traktować
  // jak niezalogowanego, żeby nie przerzucił go do aplikacji przed zmianą hasła.
  useAuthStore.setState({ recovering: true });
  try {
    const verified = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "recovery",
    });
    if (verified.error)
      return { ok: false, error: mapAuthError(verified.error) };

    const updated = await supabase.auth.updateUser({ password: newPassword });
    if (updated.error) {
      await supabase.auth.signOut();
      return { ok: false, error: mapAuthError(updated.error) };
    }
    return { ok: true };
  } finally {
    useAuthStore.setState({ recovering: false });
  }
}
