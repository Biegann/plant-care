import { useColorScheme } from "react-native";

// Wszystkie kolory aplikacji mają nazwę mówiącą, do czego służą,
// a każdy motyw podaje dla tej nazwy własną wartość
export type Palette = {
  background: string;
  // tło pasków nawigacji (nagłówek, zakładki)
  surface: string;
  text: string;
  textMuted: string;
  placeholder: string;
  border: string;
  inputBorder: string;
  primary: string;
  // tekst i ikony na tle w kolorze głównym
  onPrimary: string;
  primarySoft: string;
  // tło zaznaczonej karty
  surfaceActive: string;
  danger: string;
};

// Jasny motyw: dokładnie te kolory, które aplikacja miała przed wprowadzeniem motywów
export const lightPalette: Palette = {
  background: "rgb(242, 242, 242)",
  surface: "#fff",
  text: "#000",
  textMuted: "#666",
  placeholder: "#757575",
  border: "#ddd",
  inputBorder: "#ccc",
  primary: "#2e7d32",
  onPrimary: "#fff",
  primarySoft: "#a5d6a7",
  surfaceActive: "#f1f8f1",
  danger: "#c0392b",
};

export const darkPalette: Palette = {
  background: "#121212",
  surface: "#1e1e1e",
  text: "#e6e6e6",
  textMuted: "#a0a0a0",
  placeholder: "#8a8a8a",
  border: "#333",
  inputBorder: "#444",
  primary: "#66bb6a",
  onPrimary: "#0d1f0e",
  primarySoft: "#2e5e31",
  surfaceActive: "#1b2e1d",
  danger: "#ef6f5e",
};

// Motyw wybrany w Profilu trafia do systemu (Appearance.setColorScheme),
// więc tutaj wystarczy zapytać system
export const useIsDark = () => useColorScheme() === "dark";

export const useColors = () => (useIsDark() ? darkPalette : lightPalette);

// Style zależne od motywu: liczone raz dla każdej palety, a hook wybiera właściwe.
// Użycie: const useStyles = createThemedStyles((c) => StyleSheet.create({ ... }))
export function createThemedStyles<T>(make: (colors: Palette) => T): () => T {
  const light = make(lightPalette);
  const dark = make(darkPalette);
  return () => (useIsDark() ? dark : light);
}
