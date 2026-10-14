import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../../shared/ui/Screen";
import { useUi } from "../../../shared/ui/styles";
import { createThemedStyles, useColors } from "../../../shared/ui/theme";
import { useWelcomeStore } from "../store/welcomeStore";

type IconName = ComponentProps<typeof Ionicons>["name"];

const FEATURES: { key: string; icon: IconName }[] = [
  { key: "shared", icon: "people-outline" },
  { key: "reminders", icon: "notifications-outline" },
  { key: "history", icon: "time-outline" },
];

// Powitanie przy pierwszym uruchomieniu. "Zaczynamy" zapamiętuje, że było
// widziane, a nawigacja sama przechodzi wtedy do logowania
export function WelcomeView() {
  const { t } = useTranslation();
  const ui = useUi();
  const colors = useColors();
  const styles = useStyles();
  const markSeen = useWelcomeStore((state) => state.markSeen);

  return (
    <Screen style={styles.screen} bottomInset>
      <View style={styles.hero}>
        <Ionicons name="leaf" size={64} color={colors.primary} />
        <Text style={styles.title}>{t("welcome.title")}</Text>
        <Text style={styles.tagline}>{t("welcome.tagline")}</Text>
      </View>
      <View style={styles.features}>
        {FEATURES.map(({ key, icon }) => (
          <View key={key} style={styles.feature}>
            <Ionicons name={icon} size={26} color={colors.primary} />
            <Text style={styles.featureText}>
              {t(`welcome.features.${key}`)}
            </Text>
          </View>
        ))}
      </View>
      <Pressable testID="welcome-start" style={ui.button} onPress={markSeen}>
        <Text style={ui.buttonText}>{t("welcome.start")}</Text>
      </Pressable>
    </Screen>
  );
}

const useStyles = createThemedStyles((c) =>
  StyleSheet.create({
    screen: { justifyContent: "space-between", paddingVertical: 32 },
    hero: { alignItems: "center", gap: 8, marginTop: 24 },
    title: { fontSize: 28, fontWeight: "700", color: c.text },
    tagline: { fontSize: 16, color: c.textMuted, textAlign: "center" },
    features: { gap: 18 },
    feature: { flexDirection: "row", alignItems: "center", gap: 14 },
    featureText: { flex: 1, fontSize: 16, color: c.text },
  }),
);
