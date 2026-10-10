export const isValidGardenName = (value: string): boolean => {
  const length = value.trim().length;
  return length >= 1 && length <= 60;
};

export const normalizeInviteCode = (value: string): string =>
  value.replace(/[\s-]/g, "").toUpperCase();

export const isValidInviteCode = (value: string): boolean =>
  /^[A-Z0-9]{10}$/.test(normalizeInviteCode(value));
