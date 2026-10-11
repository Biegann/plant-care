import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import type { PlantSaved } from "../api/plantsApi";

// Co zrobić po zapisie formularza: wrócić, a gdy nie udało się samo zdjęcie, najpierw o tym powiedzieć
export function usePlantSaved() {
  const { t } = useTranslation();
  const router = useRouter();

  return (saved: PlantSaved) => {
    if (!saved.photoFailed) {
      router.back();
      return;
    }

    Alert.alert(
      t("plants.photo.notSavedTitle"),
      t("plants.photo.notSavedMessage"),
      [{ text: t("plants.photo.ok"), onPress: () => router.back() }],
      { cancelable: false },
    );
  };
}
