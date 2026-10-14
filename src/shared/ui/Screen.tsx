import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUi } from "./styles";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  // Odstęp także od dolnego paska nawigacji telefonu: dla ekranów bez paska zakładek
  // z przyciskiem na samym dole
  bottomInset?: boolean;
};

// Ekran z odstępem od paska stanu telefonu u góry
export function Screen({ children, style, bottomInset = false }: Props) {
  const ui = useUi();

  return (
    <SafeAreaView
      style={[ui.screen, style]}
      edges={bottomInset ? ["top", "bottom"] : ["top"]}
    >
      {children}
    </SafeAreaView>
  );
}
