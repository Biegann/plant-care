import { useHeaderHeight } from "expo-router/react-navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { ui } from "../../../shared/ui/styles";
import { DateField } from "../../../shared/ui/DateField";
import type { CareResult, CareTask } from "../api/careApi";
import { DEFAULT_INTERVAL_DAYS, todayIso } from "../schedule";
import {
    CARE_TYPES,
    MAX_LABEL_LENGTH,
    validateCareTaskInput,
    type CareTaskInput,
    type CareTaskInputErrors,
    type CareType,
} from "../validation";

type Props = {
  // Zadanie do edycji; bez niego formularz dodaje nowe
  initial?: CareTask;
  // Rodzaje, które roślina już ma (nie można ich dodać drugi raz)
  takenTypes?: CareType[];
  onSubmit: (input: CareTaskInput) => Promise<CareResult<unknown>>;
  onSaved: () => void;
};

export function CareTaskForm({
  initial,
  takenTypes = [],
  onSubmit,
  onSaved,
}: Props) {
  const { t } = useTranslation();
  const headerHeight = useHeaderHeight();

  // "Inne" można dodawać wielokrotnie, więc nigdy nie jest zajęte
  const isTaken = (candidate: CareType) =>
    candidate !== "other" && takenTypes.includes(candidate);
  const firstFree = CARE_TYPES.find((candidate) => !isTaken(candidate));

  const [type, setType] = useState<CareType>(
    initial?.type ?? firstFree ?? "other",
  );
  const [customLabel, setCustomLabel] = useState(initial?.customLabel ?? "");
  const [intervalText, setIntervalText] = useState(
    String(initial?.intervalDays ?? DEFAULT_INTERVAL_DAYS[type]),
  );
  // Po ręcznej zmianie interwału wybór rodzaju już go nie nadpisuje
  const [intervalEdited, setIntervalEdited] = useState(false);
  const [nextDueOn, setNextDueOn] = useState(initial?.nextDueOn ?? todayIso());
  const [errors, setErrors] = useState<CareTaskInputErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const chooseType = (chosen: CareType) => {
    setType(chosen);
    if (!intervalEdited) setIntervalText(String(DEFAULT_INTERVAL_DAYS[chosen]));
  };

  const changeInterval = (text: string) => {
    setIntervalText(text);
    setIntervalEdited(true);
  };

  const submit = async () => {
    if (loading) return;

    const input: CareTaskInput = {
      type,
      customLabel,
      // Tylko same cyfry; wszystko inne walidacja odrzuci jako NaN
      intervalDays: /^\d+$/.test(intervalText.trim()) ? Number(intervalText) : NaN,
      nextDueOn,
      enabled: initial?.enabled ?? true,
    };
    const found = validateCareTaskInput(input);
    setErrors(found);
    setSubmitError(null);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    const result = await onSubmit(input);
    setLoading(false);

    if (result.ok) onSaved();
    else setSubmitError(result.error);
  };

  const fieldError = (code?: string) =>
    code ? <Text style={ui.error}>{t(`care.errors.${code}`)}</Text> : null;

  return (
    <KeyboardAvoidingView
      style={ui.grow}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>{t("care.form.type")}</Text>
          {initial ? (
            // Rodzaju istniejącego zadania nie da się zmienić
            <Text testID="care-type-fixed" style={styles.fixedType}>
              {t(`care.types.${type}`)}
            </Text>
          ) : (
            <View style={styles.chips}>
              {CARE_TYPES.map((candidate) => {
                const taken = isTaken(candidate);
                const selected = candidate === type;
                return (
                  <Pressable
                    key={candidate}
                    testID={`care-type-${candidate}`}
                    accessibilityState={{ selected, disabled: taken }}
                    style={[
                      styles.chip,
                      selected && styles.chipSelected,
                      taken && styles.chipTaken,
                    ]}
                    onPress={() => chooseType(candidate)}
                    disabled={taken}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {t(`care.types.${candidate}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {type === "other" && (
          <View style={styles.field}>
            <Text style={styles.label}>{t("care.form.label")}</Text>
            <TextInput
              testID="care-label-input"
              style={ui.input}
              placeholder={t("care.form.labelPlaceholder")}
              maxLength={MAX_LABEL_LENGTH}
              value={customLabel}
              onChangeText={setCustomLabel}
            />
            {fieldError(errors.customLabel)}
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>{t("care.form.interval")}</Text>
          <View style={styles.intervalRow}>
            <TextInput
              testID="care-interval-input"
              style={[ui.input, styles.intervalInput]}
              keyboardType="number-pad"
              maxLength={3}
              value={intervalText}
              onChangeText={changeInterval}
            />
            <Text style={styles.unit}>{t("care.form.days")}</Text>
          </View>
          {fieldError(errors.intervalDays)}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("care.form.nextDue")}</Text>
          <DateField
            value={nextDueOn}
            onChange={setNextDueOn}
            allowFuture
            clearable={false}
            testIDPrefix="care-date"
          />
          {fieldError(errors.nextDueOn)}
        </View>

        {submitError && (
          <Text style={ui.error}>{t(`care.errors.${submitError}`)}</Text>
        )}
        <Pressable
          testID="care-form-submit"
          style={[ui.button, loading && ui.buttonDisabled]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={ui.buttonText}>{t("care.form.save")}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 12 },
  field: { gap: 4 },
  label: { fontSize: 13, color: "#666" },
  fixedType: { fontSize: 16, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#2e7d32",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipSelected: { backgroundColor: "#2e7d32" },
  chipTaken: { opacity: 0.35 },
  chipText: { color: "#2e7d32", fontSize: 14, fontWeight: "600" },
  chipTextSelected: { color: "#fff" },
  intervalRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  intervalInput: { width: 80, textAlign: "center" },
  unit: { fontSize: 16, color: "#666" },
});
