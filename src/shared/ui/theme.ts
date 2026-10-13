import { useColorScheme } from "react-native";

// Wszystkie kolory aplikacji mają nazwę mówiącą, do czego służą,
// a każdy motyw podaje dla tej nazwy własną wartość
export type Palette = {
  background: string;
  // tło pasków nawigacji (nagłówek, zakładki)
  surface: string;
  text: string;
  textMuted: string;
  // najmniej ważne ikony (strzałki, lupa)
  textFaint: string;
  placeholder: string;
  border: string;
  divider: string;
  inputBorder: string;
  primary: string;
  // tekst i ikony na tle w kolorze głównym
  onPrimary: string;
  primarySoft: string;
  // tło miniatury bez zdjęcia
  primaryTint: string;
  // tło zaznaczonej karty
  surfaceActive: string;
  danger: string;
  warning: string;
};

// Jasny motyw: dokładnie te kolory, które aplikacja miała przed wprowadzeniem motywów
export const lightPalette: Palette = {
  background: "rgb(242, 242, 242)",
  surface: "#fff",
  text: "#000",
  textMuted: "#666",
  textFaint: "#888",
  placeholder: "#757575",
  border: "#ddd",
  divider: "#eee",
  inputBorder: "#ccc",
  primary: "#2e7d32",
  onPrimary: "#fff",
  primarySoft: "#a5d6a7",
  primaryTint: "#e8f5e9",
  surfaceActive: "#f1f8f1",
  danger: "#c0392b",
  warning: "#e67e22",
};

export const darkPalette: Palette = {
  background: "#121212",
  surface: "#1e1e1e",
  text: "#e6e6e6",
  textMuted: "#a0a0a0",
  textFaint: "#7a7a7a",
  placeholder: "#8a8a8a",
  border: "#333",
  divider: "#2a2a2a",
  inputBorder: "#444",
  primary: "#66bb6a",
  onPrimary: "#0d1f0e",
  primarySoft: "#2e5e31",
  primaryTint: "#1f3322",
  surfaceActive: "#1b2e1d",
  danger: "#ef6f5e",
  warning: "#f0a04b",
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
