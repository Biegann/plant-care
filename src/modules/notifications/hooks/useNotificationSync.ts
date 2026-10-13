import { useEffect } from "react";
import { AppState } from "react-native";
import { cancelAllScheduled } from "../scheduler";
import { useNotificationStore } from "../store/notificationStore";
import { syncNotifications } from "../sync";

// Pilnuje planu powiadomień: przelicza go przy starcie i po każdym powrocie
// do aplikacji, a po wylogowaniu kasuje zaplanowane powiadomienia
export function useNotificationSync(initialized: boolean, isSignedIn: boolean) {
  const hydrated = useNotificationStore((state) => state.hydrated);

  useEffect(() => {
    if (!initialized || !hydrated) return;
    if (!isSignedIn) {
      cancelAllScheduled();
      return;
    }

    syncNotifications();
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") syncNotifications();
    });
    return () => subscription.remove();
  }, [initialized, hydrated, isSignedIn]);
}
