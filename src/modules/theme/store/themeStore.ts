import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemePreference = "system" | "light" | "dark";

type ThemeState = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

// Wybór trafia do systemu, dzięki czemu za motywem idą też elementy systemowe
// (kalendarz, okna potwierdzeń), a aplikacja czyta go przez useColorScheme
const apply = (preference: ThemePreference) =>
  Appearance.setColorScheme(
    preference === "system" ? "unspecified" : preference,
  );

// Motyw jest ustawieniem telefonu (nie konta)
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: "system",
      setPreference: (preference) => {
        set({ preference });
        apply(preference);
      },
    }),
    {
      name: "theme-preference",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ preference: state.preference }),
      onRehydrateStorage: () => (state) => {
        if (state) apply(state.preference);
      },
    },
  ),
);
