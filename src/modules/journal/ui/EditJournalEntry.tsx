import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";
import { useUi } from "../../../shared/ui/styles";
import { usePlant } from "../../plants/hooks/usePlant";
import { useJournalEntry } from "../hooks/useJournal";
import { updateJournalEntryAndRefresh } from "../journalActions";
import { JournalForm } from "./JournalForm";

export function EditJournalEntry({
  plantId,
  entryId,
}: {
  plantId: string;
  entryId: string;
}) {
  const { t } = useTranslation();
  const ui = useUi();
  const router = useRouter();
  const { plant, isLoading: plantLoading } = usePlant(plantId);
  const { entry, isLoading } = useJournalEntry(plantId, entryId);

  if (plantLoading || isLoading) {
    return (
      <View style={ui.screen}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!plant || !entry) {
    return (
      <View style={ui.screen}>
        <Text style={ui.subtitle}>{t("journal.notFound")}</Text>
      </View>
    );
  }

  return (
    <JournalForm
      initial={entry}
      onSubmit={(input, photo) =>
        updateJournalEntryAndRefresh(plant.gardenId, entry, input, photo)
      }
      onSaved={() => router.back()}
    />
  );
}
