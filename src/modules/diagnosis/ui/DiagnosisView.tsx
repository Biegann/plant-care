import { encode } from "base64-arraybuffer";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useUi } from "../../../shared/ui/styles";
import { TextField } from "../../../shared/ui/TextField";
import { createThemedStyles, useColors } from "../../../shared/ui/theme";
import { usePlant } from "../../plants/hooks/usePlant";
import type { PickedPhoto } from "../../plants/pickPhoto";
import { PhotoField } from "../../plants/ui/PhotoField";
import {
  DAILY_DIAGNOSIS_LIMIT,
  DIAGNOSIS_PHOTO,
  MAX_DESCRIPTION_LENGTH,
  type DiagnosisResult,
} from "../api/diagnosisApi";
import {
  diagnosePlantAndRefresh,
  saveDiagnosisToJournal,
} from "../diagnosisActions";
import { useRemainingDiagnoses } from "../hooks/useRemainingDiagnoses";
import { buildJournalNote } from "../journalNote";
import { DiagnosisResultView, type SaveState } from "./DiagnosisResultView";

type Phase = "form" | "loading" | "result";

// Ekran diagnozy AI jednej rośliny: formularz -> czekanie -> wynik.
// Wynik nie jest nigdzie zapisywany, dopóki użytkownik nie wybierze "Zapisz w dzienniku"
export function DiagnosisView({ plantId }: { plantId: string }) {
  const { t, i18n } = useTranslation();
  const ui = useUi();
  const colors = useColors();
  const styles = useStyles();
  const headerHeight = useHeaderHeight();
  const { plant, isLoading } = usePlant(plantId);
  const { data: remaining } = useRemainingDiagnoses();

  const [phase, setPhase] = useState<Phase>("form");
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [description, setDescription] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={ui.screen}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={ui.screen}>
        <Text style={ui.subtitle}>{t("plants.notFound")}</Text>
      </View>
    );
  }

  const limitUsed = remaining === 0;

  const submit = async () => {
    if (phase !== "form") return;
    if (!photo) {
      setErrorKey("noPhoto");
      return;
    }

    setErrorKey(null);
    setPhase("loading");
    const response = await diagnosePlantAndRefresh({
      plantId: plant.id,
      imageBase64: encode(photo.data),
      description,
      language: i18n?.language === "pl" ? "pl" : "en",
    });

    if (response.ok) {
      setResult(response.data.result);
      setPhase("result");
    } else {
      setErrorKey(response.error);
      setPhase("form");
    }
  };

  const save = async () => {
    if (!result || !photo || saveState !== "idle") return;
    setSaveError(null);
    setSaveState("saving");
    const note = buildJournalNote(result, {
      prefix: t("diagnosis.journalPrefix"),
      steps: t("diagnosis.journalSteps"),
    });
    const response = await saveDiagnosisToJournal(
      plant.gardenId,
      plant.id,
      photo.uri,
      note,
    );
    if (response.ok) setSaveState("saved");
    else {
      setSaveError(response.error);
      setSaveState("idle");
    }
  };

  const again = () => {
    setPhoto(null);
    setDescription("");
    setResult(null);
    setErrorKey(null);
    setSaveState("idle");
    setSaveError(null);
    setPhase("form");
  };

  if (phase === "loading" && photo) {
    return (
      <View testID="diagnosis-loading" style={[ui.screen, styles.loading]}>
        <Image source={{ uri: photo.uri }} style={styles.loadingPhoto} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t("diagnosis.analyzing")}</Text>
        <Text style={ui.subtitle}>{t("diagnosis.analyzingHint")}</Text>
      </View>
    );
  }

  return (
    // Zwęża ekran o wysokość klawiatury; nagłówek ekranu trzeba doliczyć osobno
    <KeyboardAvoidingView
      style={ui.grow}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.plantName}>{plant.name}</Text>

        {phase === "result" && result && photo ? (
          <DiagnosisResultView
            result={result}
            photoUri={photo.uri}
            saveState={saveState}
            saveError={saveError}
            onSave={save}
            onAgain={again}
          />
        ) : (
          <>
            <PhotoField
              previewUri={photo?.uri ?? null}
              onPicked={(picked) => {
                setPhoto(picked);
                setErrorKey(null);
              }}
              onRemoved={() => setPhoto(null)}
              square={false}
              size={DIAGNOSIS_PHOTO}
            />
            <Text style={styles.hint}>{t("diagnosis.photoHint")}</Text>

            <View style={styles.field}>
              <Text style={styles.label}>{t("diagnosis.description")}</Text>
              <TextField
                testID="diagnosis-description"
                style={[ui.input, styles.description]}
                placeholder={t("diagnosis.descriptionPlaceholder")}
                maxLength={MAX_DESCRIPTION_LENGTH}
                multiline
                value={description}
                onChangeText={setDescription}
              />
              <Text style={styles.counter}>
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </Text>
            </View>

            {errorKey && (
              <Text testID="diagnosis-error" style={ui.error}>
                {t(`diagnosis.errors.${errorKey}`)}
              </Text>
            )}
            <Pressable
              testID="diagnosis-submit"
              style={[ui.button, limitUsed && ui.buttonDisabled]}
              onPress={submit}
              disabled={limitUsed}
            >
              <Text style={ui.buttonText}>{t("diagnosis.submit")}</Text>
            </Pressable>
            {remaining !== undefined && (
              <Text testID="diagnosis-remaining" style={styles.remaining}>
                {limitUsed
                  ? t("diagnosis.limitReached")
                  : t("diagnosis.remaining", {
                      count: remaining,
                      limit: DAILY_DIAGNOSIS_LIMIT,
                    })}
              </Text>
            )}
            <Text style={styles.disclaimer}>{t("diagnosis.disclaimer")}</Text>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = createThemedStyles((c) =>
  StyleSheet.create({
    content: { padding: 24, gap: 12 },
    plantName: { fontSize: 20, fontWeight: "600", color: c.text },
    hint: { fontSize: 13, color: c.textMuted, textAlign: "center" },
    field: { gap: 4 },
    label: { fontSize: 13, color: c.textMuted },
    description: { minHeight: 96, textAlignVertical: "top" },
    counter: { fontSize: 12, color: c.textMuted, alignSelf: "flex-end" },
    remaining: { fontSize: 13, color: c.textMuted, textAlign: "center" },
    disclaimer: {
      fontSize: 12,
      color: c.textMuted,
      fontStyle: "italic",
      textAlign: "center",
    },
    loading: { alignItems: "center", justifyContent: "center", gap: 16 },
    loadingPhoto: { width: 160, height: 160, borderRadius: 12 },
    loadingText: { fontSize: 17, fontWeight: "600", color: c.text },
  }),
);
