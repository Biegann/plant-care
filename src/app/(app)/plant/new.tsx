import { Text, View } from "react-native";
import { ui } from "../../../shared/ui/styles";

export default function NewPlantPlaceholder() {
  return (
    <View style={ui.screen}>
      <Text style={ui.subtitle}>Formularz pojawi się w następnym kroku</Text>
    </View>
  );
}
