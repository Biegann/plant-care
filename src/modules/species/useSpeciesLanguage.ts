import { useTranslation } from "react-i18next";
import { findSpecies } from "./data";
import type { Language } from "./search";

// Bieżący język aplikacji jako "pl" albo "en" (nazwy gatunków są w obu)
export function useSpeciesLanguage(): Language {
  const { i18n } = useTranslation();
  return i18n?.language === "pl" ? "pl" : "en";
}

// Nazwa gatunku do pokazania: z listy w bieżącym języku, a dla gatunku
// spoza listy tekst wpisany przez użytkownika
export function speciesLabel(
  plant: { speciesKey: string | null; speciesName: string | null },
  language: Language,
): string | null {
  return findSpecies(plant.speciesKey)?.names[language] ?? plant.speciesName;
}
