import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
  initAuthListener,
  useAuthInitialized,
  useIsSignedIn,
} from "../modules/auth/hooks/useSession";
import { initNotificationHandler } from "../modules/notifications/scheduler";
import { queryClient } from "../shared/api/queryClient";
import "../shared/i18n";

SplashScreen.preventAutoHideAsync();
initNotificationHandler();

export default function RootLayout() {
  const isSignedIn = useIsSignedIn();
  const initialized = useAuthInitialized();

  useEffect(() => initAuthListener(), []);

  useEffect(() => {
    if (initialized) SplashScreen.hideAsync();
  }, [initialized]);

  // po wylogowaniu czyścimy dane pobrane z serwera
  useEffect(() => {
    if (initialized && !isSignedIn) queryClient.clear();
  }, [initialized, isSignedIn]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={initialized && isSignedIn}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={initialized && !isSignedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  );
}
