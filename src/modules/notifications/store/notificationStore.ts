import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type NotificationState = {
  enabled: boolean;
  hour: number;
  minute: number;
  // konto, do którego należą ustawienia zapisane na tym telefonie
  ownerUserId: string | null;
  hydrated: boolean;
  setEnabled: (enabled: boolean) => void;
  setTime: (hour: number, minute: number) => void;
  claimFor: (userId: string) => void;
};

const defaults = { enabled: false, hour: 9, minute: 0 };

// Ustawienia powiadomień są zapisane na telefonie (nie na koncie),
// ale pamiętamy, czyje są: inne konto zaczyna od domyślnych
export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      ...defaults,
      ownerUserId: null,
      hydrated: false,
      setEnabled: (enabled) => set({ enabled }),
      setTime: (hour, minute) => set({ hour, minute }),
      claimFor: (userId) => {
        const { ownerUserId } = get();
        if (ownerUserId === userId) return;
        // Brak właściciela: ustawienia sprzed tej zmiany, zostają u zalogowanego
        set(
          ownerUserId === null
            ? { ownerUserId: userId }
            : { ...defaults, ownerUserId: userId },
        );
      },
    }),
    {
      name: "notification-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        enabled: state.enabled,
        hour: state.hour,
        minute: state.minute,
        ownerUserId: state.ownerUserId,
      }),
      onRehydrateStorage: () => () => {
        useNotificationStore.setState({ hydrated: true });
      },
    },
  ),
);
