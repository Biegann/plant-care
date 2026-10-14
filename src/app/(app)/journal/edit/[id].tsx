import { useLocalSearchParams } from "expo-router";
import { EditJournalEntry } from "../../../../modules/journal/ui/EditJournalEntry";

export default function EditJournalEntryScreen() {
  const { id, plantId } = useLocalSearchParams<{
    id: string;
    plantId: string;
  }>();
  return <EditJournalEntry plantId={plantId} entryId={id} />;
}
