import { useLocalSearchParams } from "expo-router";
import { AddCareTask } from "../../../modules/care-schedule/ui/AddCareTask";

export default function NewCareTaskScreen() {
  const { plantId } = useLocalSearchParams<{ plantId: string }>();
  return <AddCareTask plantId={plantId} />;
}
