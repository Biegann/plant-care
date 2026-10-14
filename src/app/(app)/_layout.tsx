import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useNotificationTap } from "../../modules/notifications/hooks/useNotificationTap";
import { useColors } from "../../shared/ui/theme";

export default function AppLayout() {
  const { t } = useTranslation();
  useNotificationTap();
  const colors = useColors();

  return (
    <Stack screenOptions={{ headerTintColor: colors.primary }}>
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
      <Stack.Screen
        name="plant/new"
        options={{ title: t("plants.newTitle") }}
      />
      <Stack.Screen
        name="plant/[id]"
        options={{ title: t("plants.detailsTitle") }}
      />
      <Stack.Screen
        name="plant/edit/[id]"
        options={{ title: t("plants.editTitle") }}
      />
      <Stack.Screen name="care/new" options={{ title: t("care.newTitle") }} />
      <Stack.Screen
        name="care/edit/[id]"
        options={{ title: t("care.editTitle") }}
      />
      <Stack.Screen
        name="care/history/[plantId]"
        options={{ title: t("care.history.screenTitle") }}
      />
      <Stack.Screen
        name="journal/new"
        options={{ title: t("journal.newTitle") }}
      />
      <Stack.Screen
        name="journal/all/[plantId]"
        options={{ title: t("journal.title") }}
      />
      <Stack.Screen
        name="journal/entry/[id]"
        options={{ title: t("journal.entryTitle") }}
      />
      <Stack.Screen
        name="journal/edit/[id]"
        options={{ title: t("journal.editTitle") }}
      />
    </Stack>
  );
}
