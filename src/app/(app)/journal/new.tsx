import { useLocalSearchParams } from "expo-router";
import { AddJournalEntry } from "../../../modules/journal/ui/AddJournalEntry";

export default function NewJournalEntryScreen() {
  const { plantId } = useLocalSearchParams<{ plantId: string }>();
  return <AddJournalEntry plantId={plantId} />;
}
