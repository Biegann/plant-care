import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { ui } from "../../../shared/ui/styles";
import { deleteCareTaskAndRefresh, updateCareTaskAndRefresh } from "../careActions";
import { useCareTask } from "../hooks/useCareTasks";
import { CareTaskForm } from "./CareTaskForm";

export function EditCareTask({ taskId }: { taskId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { gardenId, task, isLoading } = useCareTask(taskId);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const remove = async () => {
    if (!task || !gardenId) return;
    setBusy(true);
    setErrorKey(null);
    const result = await deleteCareTaskAndRefresh(gardenId, task.id);
    if (result.ok) {
      router.back();
      return;
    }
    setBusy(false);
    setErrorKey(result.error);
  };

  const confirmDelete = () => {
    if (!task) return;
    Alert.alert(
      t("care.deleteTitle"),
      t("care.deleteMessage", {
        name: task.customLabel ?? t(`care.types.${task.type}`),
      }),
      [
        { text: t("care.cancel"), style: "cancel" },
        { text: t("care.delete"), style: "destructive", onPress: remove },
      ],
    );
  };

  const headerRight = () =>
    task && gardenId && !busy ? (
      <Pressable
        testID="care-delete"
        accessibilityLabel={t("care.delete")}
        hitSlop={8}
        onPress={confirmDelete}
      >
        <Ionicons name="trash-outline" size={24} color="#c0392b" />
      </Pressable>
    ) : null;

  const content = () => {
    // "busy" sprawdzamy najpierw: po usunięciu zadanie znika z listy, zanim wrócimy
    if (isLoading || busy) {
      return (
        <View style={ui.screen}>
          <ActivityIndicator />
        </View>
      );
    }

    if (!task || !gardenId) {
      return (
        <View style={ui.screen}>
          <Text style={ui.subtitle}>{t("care.notFound")}</Text>
        </View>
      );
    }

    return (
      <View style={ui.grow}>
        {errorKey && (
          <Text style={[ui.error, styles.error]}>
            {t(`care.errors.${errorKey}`)}
          </Text>
        )}
        <CareTaskForm
          initial={task}
          onSubmit={(input) =>
            updateCareTaskAndRefresh(gardenId, task.id, input)
          }
          onSaved={() => router.back()}
        />
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerRight }} />
      {content()}
    </>
  );
}

const styles = StyleSheet.create({
  error: { paddingHorizontal: 24, paddingTop: 16 },
});
