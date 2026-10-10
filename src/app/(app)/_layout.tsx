import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function AppLayout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={{ headerTintColor: "#2e7d32" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="garden/new"
        options={{ title: t("gardens.newTitle") }}
      />
      <Stack.Screen
        name="garden/join"
        options={{ title: t("gardens.joinTitle") }}
      />
      <Stack.Screen
        name="garden/[id]"
        options={{ title: t("gardens.detailsTitle") }}
      />
    </Stack>
  );
}
