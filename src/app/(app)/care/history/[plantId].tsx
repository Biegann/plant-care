import { useLocalSearchParams } from "expo-router";
import { CareHistory } from "../../../../modules/care-schedule/ui/CareHistory";

export default function CareHistoryScreen() {
  const { plantId } = useLocalSearchParams<{ plantId: string }>();
  return <CareHistory plantId={plantId} />;
}
