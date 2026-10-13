import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";
import { useUi } from "../../../shared/ui/styles";
import { useActiveGarden } from "../../garden/hooks/useActiveGarden";
import { usePlantSaved } from "../hooks/usePlantSaved";
import { createPlantAndRefresh } from "../plantActions";
import { PlantForm } from "./PlantForm";

export function AddPlant() {
  const { t } = useTranslation();
  const ui = useUi();
  const onSaved = usePlantSaved();
  const { garden, isLoading } = useActiveGarden();

  if (isLoading) {
    return (
      <View style={ui.screen}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!garden) {
    return (
      <View style={ui.screen}>
        <Text style={ui.subtitle}>{t("plants.needGarden")}</Text>
      </View>
    );
  }

  return (
    <PlantForm
      onSubmit={(input, photo) =>
        createPlantAndRefresh(
          garden.id,
          input,
          photo instanceof ArrayBuffer ? photo : undefined,
        )
      }
      onSaved={onSaved}
    />
  );
}
