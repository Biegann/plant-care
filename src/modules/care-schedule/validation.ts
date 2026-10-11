import { isValidIsoDate } from "../plants/validation";

export type CareType = "water" | "fertilize" | "repot" | "other";
export const CARE_TYPES: CareType[] = ["water", "fertilize", "repot", "other"];

export const MAX_INTERVAL_DAYS = 730;
export const MAX_LABEL_LENGTH = 40;

export type CareTaskInput = {
  type: CareType;
  // Własna nazwa, używana tylko przy typie "other"
  customLabel?: string;
  intervalDays: number;
  // Najbliższy termin jako RRRR-MM-DD
  nextDueOn: string;
  enabled?: boolean;
};

export type CareTaskInputErrors = {
  customLabel?: "invalidLabel";
  intervalDays?: "invalidInterval";
  nextDueOn?: "invalidDate";
};

export function validateCareTaskInput(
  input: CareTaskInput,
): CareTaskInputErrors {
  const errors: CareTaskInputErrors = {};

  if (input.type === "other") {
    const length = (input.customLabel ?? "").trim().length;
    if (length < 1 || length > MAX_LABEL_LENGTH)
      errors.customLabel = "invalidLabel";
  }

  if (
    !Number.isInteger(input.intervalDays) ||
    input.intervalDays < 1 ||
    input.intervalDays > MAX_INTERVAL_DAYS
  )
    errors.intervalDays = "invalidInterval";

  if (!isValidIsoDate(input.nextDueOn)) errors.nextDueOn = "invalidDate";

  return errors;
}

export type NormalizedCareTaskInput = {
  type: CareType;
  customLabel: string | null;
  intervalDays: number;
  nextDueOn: string;
  enabled: boolean;
};

export function normalizeCareTaskInput(
  input: CareTaskInput,
): NormalizedCareTaskInput {
  return {
    type: input.type,
    // baza pozwala na własną nazwę tylko przy typie "other"
    customLabel:
      input.type === "other" ? (input.customLabel ?? "").trim() : null,
    intervalDays: input.intervalDays,
    nextDueOn: input.nextDueOn,
    enabled: input.enabled ?? true,
  };
}
