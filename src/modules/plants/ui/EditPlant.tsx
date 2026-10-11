import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";
import { ui } from "../../../shared/ui/styles";
import { usePlant } from "../hooks/usePlant";
import { usePlantSaved } from "../hooks/usePlantSaved";
import { updatePlantAndRefresh } from "../plantActions";
import { PlantForm } from "./PlantForm";

export function EditPlant({ plantId }: { plantId: string }) {
  const { t } = useTranslation();
  const onSaved = usePlantSaved();
  const { plant, isLoading } = usePlant(plantId);

  if (isLoading) {
    return (
      <View style={ui.screen}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={ui.screen}>
        <Text style={ui.subtitle}>{t("plants.notFound")}</Text>
      </View>
    );
  }

  return (
    <PlantForm
      initial={plant}
      onSubmit={(input, photo) => updatePlantAndRefresh(plant, input, photo)}
      onSaved={onSaved}
    />
  );
}
