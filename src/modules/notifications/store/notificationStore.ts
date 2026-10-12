import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type NotificationState = {
  enabled: boolean;
  hour: number;
  minute: number;
  hydrated: boolean;
  setEnabled: (enabled: boolean) => void;
  setTime: (hour: number, minute: number) => void;
};

// Ustawienia powiadomień są lokalne dla telefonu (nie dla konta)
export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      enabled: false,
      hour: 9,
      minute: 0,
      hydrated: false,
      setEnabled: (enabled) => set({ enabled }),
      setTime: (hour, minute) => set({ hour, minute }),
    }),
    {
      name: "notification-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        enabled: state.enabled,
        hour: state.hour,
        minute: state.minute,
      }),
      onRehydrateStorage: () => () => {
        useNotificationStore.setState({ hydrated: true });
      },
    },
  ),
);
