import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type WelcomeState = {
  seen: boolean;
  // false, dopóki flaga nie zostanie wczytana z pamięci telefonu
  hydrated: boolean;
  markSeen: () => void;
};

// Ekran powitalny pokazujemy raz na telefonie, przed pierwszym logowaniem
export const useWelcomeStore = create<WelcomeState>()(
  persist(
    (set) => ({
      seen: false,
      hydrated: false,
      markSeen: () => set({ seen: true }),
    }),
    {
      name: "welcome",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ seen: state.seen }),
      onRehydrateStorage: () => () => {
        useWelcomeStore.setState({ hydrated: true });
      },
    },
  ),
);
