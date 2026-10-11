import { useLocalSearchParams } from "expo-router";
import { EditCareTask } from "../../../../modules/care-schedule/ui/EditCareTask";

export default function EditCareTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditCareTask taskId={id} />;
}
