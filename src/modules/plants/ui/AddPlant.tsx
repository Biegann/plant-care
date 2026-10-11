import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { ui } from "../../../shared/ui/styles";
import { useActiveGarden } from "../../garden/hooks/useActiveGarden";
import type { PlantSaved } from "../api/plantsApi";
import { createPlantAndRefresh } from "../plantActions";
import { PlantForm } from "./PlantForm";

export function AddPlant() {
  const { t } = useTranslation();
  const router = useRouter();
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

  const onSaved = (saved: PlantSaved) => {
    if (!saved.photoFailed) {
      router.back();
      return;
    }

    // Roślina jest zapisana, nie udało się tylko zdjęcie: mówimy o tym i wracamy do listy
    Alert.alert(
      t("plants.photo.notSavedTitle"),
      t("plants.photo.notSavedMessage"),
      [{ text: t("plants.photo.ok"), onPress: () => router.back() }],
      { cancelable: false },
    );
  };

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
