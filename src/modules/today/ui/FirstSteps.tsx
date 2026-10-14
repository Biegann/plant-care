import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useUi } from "../../../shared/ui/styles";
import { createThemedStyles, useColors } from "../../../shared/ui/theme";

// "Pierwsze kroki" na ekranie Dziś: użytkownik nie ma jeszcze żadnego ogrodu,
// więc zamiast pustej listy zadań podpowiadamy, od czego zacząć
export function FirstSteps() {
  const { t } = useTranslation();
  const ui = useUi();
  const colors = useColors();
  const styles = useStyles();
  const router = useRouter();

  return (
    <View testID="today-first-steps" style={styles.container}>
      <Ionicons name="leaf-outline" size={48} color={colors.primary} />
      <Text style={styles.title}>{t("today.firstSteps.title")}</Text>
      <Text style={styles.text}>{t("today.firstSteps.text")}</Text>
      <View style={styles.actions}>
        <Pressable
          testID="first-steps-new-garden"
          style={ui.button}
          onPress={() => router.push("/garden/new")}
        >
          <Text style={ui.buttonText}>{t("gardens.new")}</Text>
        </Pressable>
        <Pressable
          testID="first-steps-join-garden"
          style={ui.secondaryButton}
          onPress={() => router.push("/garden/join")}
        >
          <Text style={ui.secondaryButtonText}>{t("gardens.join")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((c) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 24,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: c.text,
      textAlign: "center",
    },
    text: { fontSize: 15, color: c.textMuted, textAlign: "center" },
    actions: { alignSelf: "stretch", gap: 10, marginTop: 12 },
  }),
);
