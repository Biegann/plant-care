import { useLocalSearchParams } from "expo-router";
import { GardenDetails } from "../../../modules/garden/ui/GardenDetails";

export default function GardenDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GardenDetails gardenId={id} />;
}
