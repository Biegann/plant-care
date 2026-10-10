import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type GardenState = {
  activeGardenId: string | null;
  hydrated: boolean;
  setActiveGardenId: (id: string | null) => void;
};

export const useGardenStore = create<GardenState>()(
  persist(
    (set) => ({
      activeGardenId: null,
      hydrated: false,
      setActiveGardenId: (id) => set({ activeGardenId: id }),
    }),
    {
      name: "active-garden",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ activeGardenId: state.activeGardenId }),
      onRehydrateStorage: () => () => {
        useGardenStore.setState({ hydrated: true });
      },
    },
  ),
);
