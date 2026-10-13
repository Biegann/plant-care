import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";

// Dotknięcie powiadomienia (także takie, które uruchomiło aplikację) otwiera ekran "Dziś"
export function useNotificationTap() {
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (response?.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
      return;
    }
    // Bez wyczyszczenia to samo dotknięcie zadziałałoby ponownie, np. po zalogowaniu
    Notifications.clearLastNotificationResponseAsync();

    // Zamykamy otwarte ekrany (np. kartę rośliny) i przechodzimy na zakładkę startową
    if (router.canDismiss()) router.dismissAll();
    router.navigate("/");
  }, [response, router]);
}
