import { useLocalSearchParams } from "expo-router";
import { JournalList } from "../../../../modules/journal/ui/JournalList";

export default function JournalScreen() {
  const { plantId } = useLocalSearchParams<{ plantId: string }>();
  return <JournalList plantId={plantId} />;
}
