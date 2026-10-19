import { Stack } from "expo-router";
import { useWelcomeStore } from "../../modules/welcome/store/welcomeStore";

export default function Layout() {
  const seen = useWelcomeStore((state) => state.seen);

  // Powitanie jest dostępne tylko do pierwszego "Zaczynamy"; potem nawigacja
  // przechodzi na pierwszy dostępny ekran, czyli logowanie
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!seen}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
      <Stack.Protected guard={seen}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="verify-email" />
      </Stack.Protected>
    </Stack>
  );
}
