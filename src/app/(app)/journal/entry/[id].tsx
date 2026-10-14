import { useLocalSearchParams } from "expo-router";
import { JournalEntryView } from "../../../../modules/journal/ui/JournalEntryView";

export default function JournalEntryScreen() {
  const { id, plantId } = useLocalSearchParams<{
    id: string;
    plantId: string;
  }>();
  return <JournalEntryView plantId={plantId} entryId={id} />;
}
