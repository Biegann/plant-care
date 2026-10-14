import { QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import {
  initAuthListener,
  useAuthInitialized,
  useIsSignedIn,
  useSignedInUserId,
} from "../modules/auth/hooks/useSession";
import { useNotificationSync } from "../modules/notifications/hooks/useNotificationSync";
import { initNotificationHandler } from "../modules/notifications/scheduler";
import "../modules/language/store/languageStore";
import "../modules/theme/store/themeStore";
import { useWelcomeStore } from "../modules/welcome/store/welcomeStore";
import { queryClient } from "../shared/api/queryClient";
import "../shared/i18n";
import { darkPalette, useIsDark } from "../shared/ui/theme";

SplashScreen.preventAutoHideAsync();
initNotificationHandler();

// Kolory nawigacji (tło ekranów, nagłówki, pasek zakładek) w ciemnym motywie.
// Jasny motyw zostaje przy domyślnych kolorach nawigacji
const darkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: darkPalette.primary,
    background: darkPalette.background,
    card: darkPalette.surface,
    text: darkPalette.text,
    border: darkPalette.border,
  },
};

export default function RootLayout() {
  const isSignedIn = useIsSignedIn();
  const userId = useSignedInUserId();
  const initialized = useAuthInitialized();
  const isDark = useIsDark();
  const welcomeHydrated = useWelcomeStore((state) => state.hydrated);

  useEffect(() => initAuthListener(), []);
  useNotificationSync(initialized, userId);

  // Splash czeka też na flagę powitania, żeby nie mignęło komuś, kto je już widział
  useEffect(() => {
    if (initialized && welcomeHydrated) SplashScreen.hideAsync();
  }, [initialized, welcomeHydrated]);

  // Kto już się logował na tym telefonie, nie potrzebuje powitania po wylogowaniu
  useEffect(() => {
    if (welcomeHydrated && isSignedIn) useWelcomeStore.getState().markSeen();
  }, [welcomeHydrated, isSignedIn]);

  // po wylogowaniu czyścimy dane pobrane z serwera
  useEffect(() => {
    if (initialized && !isSignedIn) queryClient.clear();
  }, [initialized, isSignedIn]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={isDark ? darkNavigationTheme : DefaultTheme}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={initialized && isSignedIn}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
          <Stack.Protected guard={initialized && !isSignedIn}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
