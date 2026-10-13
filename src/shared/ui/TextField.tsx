import { TextInput, type TextInputProps } from "react-native";
import { useColors } from "./theme";

// Pole tekstowe aplikacji: zwykły TextInput z czytelną podpowiedzią.
// Systemowy kolor podpowiedzi nie pasuje do naszego tła, więc ustawiamy go sami
export function TextField(props: TextInputProps) {
  const colors = useColors();

  return <TextInput placeholderTextColor={colors.placeholder} {...props} />;
}
