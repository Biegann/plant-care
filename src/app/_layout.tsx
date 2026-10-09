import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
  initAuthListener,
  useAuthInitialized,
  useSession,
} from "../modules/auth/hooks/useSession";
import "../shared/i18n";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const session = useSession();
  const initialized = useAuthInitialized();

  useEffect(() => initAuthListener(), []);

  useEffect(() => {
    if (initialized) SplashScreen.hideAsync();
  }, [initialized]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={initialized && !!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={initialized && !session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
