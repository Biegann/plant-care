export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isValidPassword = (value: string): boolean => value.length >= 8;

export const isValidCode = (value: string): boolean =>
  /^\d{6,8}$/.test(value.trim());

export type CredentialErrors = {
  email?: "invalidEmail";
  password?: "shortPassword";
};

export function validateCredentials(
  email: string,
  password: string,
): CredentialErrors {
  const errors: CredentialErrors = {};
  if (!isValidEmail(email)) errors.email = "invalidEmail";
  if (!isValidPassword(password)) errors.password = "shortPassword";
  return errors;
}

export type ResetErrors = {
  code?: "invalidCode";
  password?: "shortPassword";
};

export function validateResetInput(
  code: string,
  password: string,
): ResetErrors {
  const errors: ResetErrors = {};
  if (!isValidCode(code)) errors.code = "invalidCode";
  if (!isValidPassword(password)) errors.password = "shortPassword";
  return errors;
}
