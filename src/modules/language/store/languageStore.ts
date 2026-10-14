import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import i18n from "../../../shared/i18n";
import { syncNotifications } from "../../notifications/sync";

export type LanguagePreference = "system" | "pl" | "en";
export type Language = "pl" | "en";

// "Systemowy" = polski dla telefonu po polsku, w każdym innym przypadku angielski
export function resolveLanguage(
  preference: LanguagePreference,
  deviceLanguage: string | null | undefined,
): Language {
  if (preference !== "system") return preference;
  return deviceLanguage === "pl" ? "pl" : "en";
}

// Zmienia język ekranów i przelicza plan powiadomień, bo ich treść
// jest gotowym tekstem zaplanowanym z wyprzedzeniem
const apply = async (preference: LanguagePreference) => {
  const language = resolveLanguage(preference, getLocales()[0]?.languageCode);
  if (i18n.language === language) return;
  await i18n.changeLanguage(language);
  await syncNotifications();
};

type LanguageState = {
  preference: LanguagePreference;
  setPreference: (preference: LanguagePreference) => void;
};

// Język jest ustawieniem telefonu (nie konta), działa też przed zalogowaniem
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      preference: "system",
      setPreference: (preference) => {
        set({ preference });
        void apply(preference);
      },
    }),
    {
      name: "language-preference",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ preference: state.preference }),
      onRehydrateStorage: () => (state) => {
        if (state) void apply(state.preference);
      },
    },
  ),
);
