import { SPECIES, type Species } from "./data";

export type Language = "pl" | "en";

// Małe litery bez polskich znaków: "Skrzydłokwiat" -> "skrzydlokwiat".
// "ł" nie rozkłada się na literę i znak diakrytyczny, więc zamieniamy je osobno
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export function speciesName(species: Species, language: Language): string {
  return species.names[language];
}

// Szuka po nazwie polskiej, angielskiej i łacińskiej. Najpierw gatunki, których
// nazwa w bieżącym języku zaczyna się od wpisanego tekstu, potem pozostałe trafienia
export function searchSpecies(
  query: string,
  language: Language,
  limit = 6,
): Species[] {
  const needle = normalize(query);
  if (needle.length < 2) return [];

  const matches = SPECIES.filter((species) =>
    [species.names.pl, species.names.en, species.latin].some((name) =>
      normalize(name).includes(needle),
    ),
  );
  const startsWith = (species: Species) =>
    normalize(speciesName(species, language)).startsWith(needle);

  return [
    ...matches.filter(startsWith),
    ...matches.filter((species) => !startsWith(species)),
  ].slice(0, limit);
}
