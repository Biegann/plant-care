export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isValidPassword = (value: string): boolean => value.length >= 8;

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
