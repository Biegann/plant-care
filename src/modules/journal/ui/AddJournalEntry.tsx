import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";
import { useUi } from "../../../shared/ui/styles";
import { usePlant } from "../../plants/hooks/usePlant";
import { createJournalEntryAndRefresh } from "../journalActions";
import { JournalForm } from "./JournalForm";

export function AddJournalEntry({ plantId }: { plantId: string }) {
  const { t } = useTranslation();
  const ui = useUi();
  const router = useRouter();
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
    <JournalForm
      onSubmit={(input, photo) =>
        createJournalEntryAndRefresh(
          plant.gardenId,
          plant.id,
          input,
          photo instanceof ArrayBuffer ? photo : undefined,
        )
      }
      onSaved={() => router.back()}
    />
  );
}
