import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useUi } from "../../../shared/ui/styles";
import { createThemedStyles, useColors } from "../../../shared/ui/theme";
import { findSpecies } from "../data";

type IconName = ComponentProps<typeof Ionicons>["name"];

// Sekcja "Wskazówki" na karcie rośliny; roślina bez gatunku z listy jej nie ma
export function SpeciesTips({ speciesKey }: { speciesKey: string | null }) {
  const { t } = useTranslation();
  const ui = useUi();
  const colors = useColors();
  const styles = useStyles();
  const species = findSpecies(speciesKey);
  if (!species) return null;

  const tips: { key: string; icon: IconName; text: string; warn?: boolean }[] =
    [
      {
        key: "light",
        icon: "sunny-outline",
        text: t(`species.light.${species.light}`),
      },
      {
        key: "water",
        icon: "water-outline",
        text: t("species.watering.line", {
          days: species.waterDays,
          hint: t(`species.watering.${species.waterHint}`),
        }),
      },
      {
        key: "fertilize",
        icon: "flask-outline",
        text: t("species.fertilize", { days: species.fertilizeDays }),
      },
      {
        key: "humidity",
        icon: "rainy-outline",
        text: t(`species.humidity.${species.humidity}`),
      },
      {
        key: "toxic",
        icon: species.toxicPets ? "warning-outline" : "paw-outline",
        text: t(`species.toxic.${species.toxicPets ? "yes" : "no"}`),
        warn: species.toxicPets,
      },
    ];

  return (
    <View testID="species-tips" style={styles.section}>
      <Text style={ui.sectionTitle}>{t("species.tipsTitle")}</Text>
      {tips.map((tip) => (
        <View
          key={tip.key}
          testID={`species-tip-${tip.key}`}
          style={styles.row}
        >
          <Ionicons
            name={tip.icon}
            size={18}
            color={tip.warn ? colors.warning : colors.primary}
          />
          <Text style={styles.text}>{tip.text}</Text>
        </View>
      ))}
      <Text style={styles.disclaimer}>{t("species.disclaimer")}</Text>
    </View>
  );
}

const useStyles = createThemedStyles((c) =>
  StyleSheet.create({
    section: { gap: 8 },
    row: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    text: { flex: 1, fontSize: 15, color: c.text },
    disclaimer: { fontSize: 12, color: c.textMuted, fontStyle: "italic" },
  }),
);
