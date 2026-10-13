import { useEffect } from "react";
import { AppState } from "react-native";
import { cancelAllScheduled } from "../scheduler";
import { useNotificationStore } from "../store/notificationStore";
import { syncNotifications } from "../sync";

// Pilnuje planu powiadomień: przelicza go przy starcie i po każdym powrocie
// do aplikacji, a po wylogowaniu kasuje zaplanowane powiadomienia.
// userId to zalogowany użytkownik albo null
export function useNotificationSync(
  initialized: boolean,
  userId: string | null,
) {
  const hydrated = useNotificationStore((state) => state.hydrated);

  useEffect(() => {
    if (!initialized || !hydrated) return;
    if (!userId) {
      cancelAllScheduled();
      return;
    }

    // Inne konto niż poprzednio: ustawienia wracają do domyślnych przed przeliczeniem
    useNotificationStore.getState().claimFor(userId);
    syncNotifications();
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") syncNotifications();
    });
    return () => subscription.remove();
  }, [initialized, hydrated, userId]);
}
