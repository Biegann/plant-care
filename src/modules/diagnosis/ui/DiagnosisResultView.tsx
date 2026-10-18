import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useUi } from "../../../shared/ui/styles";
import { createThemedStyles, useColors } from "../../../shared/ui/theme";
import type { DiagnosisResult } from "../api/diagnosisApi";

export type SaveState = "idle" | "saving" | "saved";

type Props = {
  result: DiagnosisResult;
  photoUri: string;
  saveState: SaveState;
  saveError: string | null;
  onSave: () => void;
  onAgain: () => void;
};

export function DiagnosisResultView({
  result,
  photoUri,
  saveState,
  saveError,
  onSave,
  onAgain,
}: Props) {
  const { t } = useTranslation();
  const ui = useUi();
  const colors = useColors();
  const styles = useStyles();

  return (
    <View testID="diagnosis-result" style={styles.wrapper}>
      <Image source={{ uri: photoUri }} style={styles.photo} />
      <Text testID="diagnosis-summary" style={styles.summary}>
        {result.summary}
      </Text>

      {result.causes.length > 0 && (
        <View style={styles.section}>
          <Text style={ui.sectionTitle}>{t("diagnosis.causes")}</Text>
          {result.causes.map((cause, i) => (
            <View key={i} testID={`diagnosis-cause-${i}`} style={styles.cause}>
              <Text style={styles.causeName}>{cause.name}</Text>
              <Text
                testID={`diagnosis-confidence-${i}`}
                style={[
                  styles.confidence,
                  cause.confidence === "high" && styles.confidenceHigh,
                  cause.confidence === "low" && styles.confidenceLow,
                ]}
              >
                {t(`diagnosis.confidence.${cause.confidence}`)}
              </Text>
              <Text style={styles.text}>{cause.explanation}</Text>
            </View>
          ))}
        </View>
      )}

      {result.steps.length > 0 && (
        <View style={styles.section}>
          <Text style={ui.sectionTitle}>{t("diagnosis.steps")}</Text>
          {result.steps.map((step, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={styles.marker}>{i + 1}.</Text>
              <Text style={styles.text}>{step}</Text>
            </View>
          ))}
        </View>
      )}

      {result.worryIf.length > 0 && (
        <View style={styles.section}>
          <Text style={ui.sectionTitle}>{t("diagnosis.worryIf")}</Text>
          {result.worryIf.map((sign, i) => (
            <View key={i} style={styles.listRow}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={colors.warning}
              />
              <Text style={styles.text}>{sign}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.disclaimer}>{t("diagnosis.disclaimer")}</Text>

      {saveError && (
        <Text style={ui.error}>{t(`journal.errors.${saveError}`)}</Text>
      )}
      {/* Wynik bez rośliny na zdjęciu nie ma czego zapisywać */}
      {!result.notPlant && (
        <Pressable
          testID="diagnosis-save"
          style={[ui.button, saveState !== "idle" && ui.buttonDisabled]}
          onPress={onSave}
          disabled={saveState !== "idle"}
        >
          {saveState === "saving" ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={ui.buttonText}>
              {t(
                saveState === "saved"
                  ? "diagnosis.savedToJournal"
                  : "diagnosis.saveToJournal",
              )}
            </Text>
          )}
        </Pressable>
      )}
      <Pressable
        testID="diagnosis-again"
        style={ui.secondaryButton}
        onPress={onAgain}
        disabled={saveState === "saving"}
      >
        <Text style={ui.secondaryButtonText}>{t("diagnosis.again")}</Text>
      </Pressable>
    </View>
  );
}

const useStyles = createThemedStyles((c) =>
  StyleSheet.create({
    wrapper: { gap: 12 },
    photo: {
      width: 128,
      height: 128,
      borderRadius: 12,
      alignSelf: "center",
    },
    summary: { fontSize: 17, color: c.text },
    section: { gap: 8 },
    cause: { gap: 2 },
    causeName: { fontSize: 16, fontWeight: "600", color: c.text },
    confidence: { fontSize: 13, color: c.textMuted },
    confidenceHigh: { color: c.primary, fontWeight: "600" },
    confidenceLow: { color: c.danger },
    listRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    marker: { width: 18, fontSize: 15, color: c.primary, fontWeight: "600" },
    text: { flex: 1, fontSize: 15, color: c.text },
    disclaimer: { fontSize: 12, color: c.textMuted, fontStyle: "italic" },
  }),
);
