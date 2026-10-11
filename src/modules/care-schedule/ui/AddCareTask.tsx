import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";
import { ui } from "../../../shared/ui/styles";
import { createCareTaskAndRefresh } from "../careActions";
import { usePlantCareTasks } from "../hooks/useCareTasks";
import { CareTaskForm } from "./CareTaskForm";

export function AddCareTask({ plantId }: { plantId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { gardenId, tasks, isLoading, isError } = usePlantCareTasks(plantId);

  // Formularz potrzebuje listy zadań od razu, bo z niej wynika domyślny rodzaj
  if (isLoading) {
    return (
      <View style={ui.screen}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || !gardenId) {
    return (
      <View style={ui.screen}>
        <Text style={ui.error}>{t("care.error")}</Text>
      </View>
    );
  }

  return (
    <CareTaskForm
      takenTypes={tasks.map((task) => task.type)}
      onSubmit={(input) => createCareTaskAndRefresh(gardenId, plantId, input)}
      onSaved={() => router.back()}
    />
  );
}
