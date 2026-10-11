import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";
import { ui } from "../../../shared/ui/styles";
import { updateCareTaskAndRefresh } from "../careActions";
import { useCareTask } from "../hooks/useCareTasks";
import { CareTaskForm } from "./CareTaskForm";

export function EditCareTask({ taskId }: { taskId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { gardenId, task, isLoading } = useCareTask(taskId);

  if (isLoading) {
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
    <CareTaskForm
      initial={task}
      onSubmit={(input) => updateCareTaskAndRefresh(gardenId, task.id, input)}
      onSaved={() => router.back()}
    />
  );
}
