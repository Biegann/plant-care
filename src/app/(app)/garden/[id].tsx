import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { ui } from "../../../shared/ui/styles";

export default function GardenDetailsPlaceholder() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={ui.screen}>
      <Text style={ui.subtitle}>{id}</Text>
    </View>
  );
}
