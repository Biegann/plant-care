import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useUi } from "../../../shared/ui/styles";
import { createThemedStyles } from "../../../shared/ui/theme";
import { useThemeStore, type ThemePreference } from "../store/themeStore";

const OPTIONS: ThemePreference[] = ["system", "light", "dark"];

// Sekcja "Wygląd" w Profilu: motyw systemowy, jasny albo ciemny
export function ThemeSettings() {
  const { t } = useTranslation();
  const ui = useUi();
  const styles = useStyles();
  const { preference, setPreference } = useThemeStore();

  return (
    <View style={styles.section}>
      <Text style={ui.sectionTitle}>{t("theme.sectionTitle")}</Text>
      <View style={styles.chips}>
        {OPTIONS.map((option) => {
          const selected = option === preference;
          return (
            <Pressable
              key={option}
              testID={`theme-${option}`}
              accessibilityState={{ selected }}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setPreference(option)}
            >
              <Text
                style={[styles.chipText, selected && styles.chipTextSelected]}
              >
                {t(`theme.${option}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((c) =>
  StyleSheet.create({
    section: { gap: 8 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 16,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    chipSelected: { backgroundColor: c.primary },
    chipText: { color: c.primary, fontSize: 14, fontWeight: "600" },
    chipTextSelected: { color: c.onPrimary },
  }),
);
