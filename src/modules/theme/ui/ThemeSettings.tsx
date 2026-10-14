import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { ChoiceChips } from "../../../shared/ui/ChoiceChips";
import { useUi } from "../../../shared/ui/styles";
import { useThemeStore, type ThemePreference } from "../store/themeStore";

const OPTIONS: ThemePreference[] = ["system", "light", "dark"];

// Sekcja "Wygląd" w Profilu: motyw systemowy, jasny albo ciemny
export function ThemeSettings() {
  const { t } = useTranslation();
  const ui = useUi();
  const { preference, setPreference } = useThemeStore();

  return (
    <View style={{ gap: 8 }}>
      <Text style={ui.sectionTitle}>{t("theme.sectionTitle")}</Text>
      <ChoiceChips
        options={OPTIONS.map((value) => ({ value, label: t(`theme.${value}`) }))}
        selected={preference}
        onSelect={setPreference}
        testIDPrefix="theme"
      />
    </View>
  );
}
