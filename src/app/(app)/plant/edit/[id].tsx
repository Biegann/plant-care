import { useLocalSearchParams } from "expo-router";
import { EditPlant } from "../../../../modules/plants/ui/EditPlant";

export default function EditPlantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditPlant plantId={id} />;
}
