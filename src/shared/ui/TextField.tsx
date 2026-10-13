import { TextInput, type TextInputProps } from "react-native";

// Systemowy kolor podpowiedzi bywa prawie biały (np. w ciemnym motywie telefonu),
// a tło aplikacji jest białe, więc ustawiamy go sami
export const PLACEHOLDER_COLOR = "#757575";

// Pole tekstowe aplikacji: zwykły TextInput z czytelną podpowiedzią
export function TextField(props: TextInputProps) {
  return <TextInput placeholderTextColor={PLACEHOLDER_COLOR} {...props} />;
}
