import { useLocalSearchParams } from "expo-router";
import { PlantDetails } from "../../../modules/plants/ui/PlantDetails";

export default function PlantDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PlantDetails plantId={id} />;
}
