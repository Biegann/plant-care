import { isValidIsoDate } from "../../shared/utils/date";

export type PlantInput = {
  name: string;
  speciesName?: string;
  locationNote?: string;
  purchaseDate?: string;
  notes?: string;
};

export type PlantInputErrors = {
  name?: "invalidName";
  speciesName?: "tooLong";
  locationNote?: "tooLong";
  purchaseDate?: "invalidDate";
  notes?: "tooLong";
};

export function validatePlantInput(input: PlantInput): PlantInputErrors {
  const errors: PlantInputErrors = {};

  const nameLength = input.name.trim().length;
  if (nameLength < 1 || nameLength > 60) errors.name = "invalidName";
  if ((input.speciesName ?? "").trim().length > 80)
    errors.speciesName = "tooLong";
  if ((input.locationNote ?? "").trim().length > 80)
    errors.locationNote = "tooLong";
  if ((input.notes ?? "").trim().length > 1000) errors.notes = "tooLong";

  const date = (input.purchaseDate ?? "").trim();
  if (date !== "" && !isValidIsoDate(date)) errors.purchaseDate = "invalidDate";

  return errors;
}

export type NormalizedPlantInput = {
  name: string;
  speciesName: string | null;
  locationNote: string | null;
  purchaseDate: string | null;
  notes: string | null;
};

const clean = (value?: string): string | null => {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
};

export function normalizePlantInput(input: PlantInput): NormalizedPlantInput {
  return {
    name: input.name.trim(),
    speciesName: clean(input.speciesName),
    locationNote: clean(input.locationNote),
    purchaseDate: clean(input.purchaseDate),
    notes: clean(input.notes),
  };
}
