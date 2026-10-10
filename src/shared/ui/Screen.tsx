import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ui } from "./styles";

type Props = { children: ReactNode; style?: StyleProp<ViewStyle> };

// Ekran z odstępem od paska stanu telefonu u góry
export function Screen({ children, style }: Props) {
  return (
    <SafeAreaView style={[ui.screen, style]} edges={["top"]}>
      {children}
    </SafeAreaView>
  );
}
