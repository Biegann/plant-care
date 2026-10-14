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
  View,
} from "react-native";
import { DateField } from "../../../shared/ui/DateField";
import { useUi } from "../../../shared/ui/styles";
import { TextField } from "../../../shared/ui/TextField";
import { createThemedStyles, useColors } from "../../../shared/ui/theme";
import { toIsoDate } from "../../../shared/utils/date";
import type { PhotoChange } from "../../plants/api/plantsApi";
import { usePlantPhotoUrl } from "../../plants/hooks/usePlantPhotoUrl";
import type { PickedPhoto } from "../../plants/pickPhoto";
import { PhotoField } from "../../plants/ui/PhotoField";
import type { JournalEntry, JournalResult } from "../api/journalApi";
import {
  MAX_NOTE_LENGTH,
  validateJournalInput,
  type JournalInput,
  type JournalInputErrors,
} from "../validation";

type Props = {
  initial?: JournalEntry;
  onSubmit: (
    input: JournalInput,
    photo: PhotoChange,
  ) => Promise<JournalResult<unknown>>;
  onSaved: () => void;
};

export function JournalForm({ initial, onSubmit, onSaved }: Props) {
  const { t } = useTranslation();
  const ui = useUi();
  const colors = useColors();
  const styles = useStyles();
  const headerHeight = useHeaderHeight();

  const [entryOn, setEntryOn] = useState(
    initial?.entryOn ?? toIsoDate(new Date()),
  );
  const [note, setNote] = useState(initial?.note ?? "");
  // undefined = zdjęcie bez zmian, "remove" = usuń obecne, dane = wyślij nowe
  const [photo, setPhoto] = useState<PhotoChange>(undefined);
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<JournalInputErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const savedPhotoUrl = usePlantPhotoUrl(initial?.photoPath ?? null);
  const previewUri = photo === "remove" ? null : (pickedUri ?? savedPhotoUrl);
  const hasPhoto =
    photo === undefined ? !!initial?.photoPath : photo !== "remove";

  const onPhotoPicked = (picked: PickedPhoto) => {
    setPhoto(picked.data);
    setPickedUri(picked.uri);
  };

  const onPhotoRemoved = () => {
    setPhoto(initial?.photoPath ? "remove" : undefined);
    setPickedUri(null);
  };

  const submit = async () => {
    if (loading) return;

    const input: JournalInput = { entryOn, note, hasPhoto };
    const found = validateJournalInput(input, toIsoDate(new Date()));
    setErrors(found);
    setSubmitError(null);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    const result = await onSubmit(input, photo);
    setLoading(false);

    if (result.ok) onSaved();
    else setSubmitError(result.error);
  };

  const fieldError = (code?: string) =>
    code ? <Text style={ui.error}>{t(`journal.errors.${code}`)}</Text> : null;

  return (
    // Zwęża formularz o wysokość klawiatury; nagłówek ekranu trzeba doliczyć osobno
    <KeyboardAvoidingView
      style={ui.grow}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <PhotoField
          previewUri={previewUri}
          onPicked={onPhotoPicked}
          onRemoved={onPhotoRemoved}
          square={false}
        />

        <View style={styles.field}>
          <Text style={styles.label}>{t("journal.form.date")}</Text>
          <DateField
            value={entryOn}
            onChange={setEntryOn}
            clearable={false}
            testIDPrefix="journal-date"
          />
          {fieldError(errors.entryOn)}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("journal.form.note")}</Text>
          <TextField
            testID="journal-note-input"
            style={[ui.input, styles.note]}
            placeholder={t("journal.form.notePlaceholder")}
            maxLength={MAX_NOTE_LENGTH}
            multiline
            value={note}
            onChangeText={setNote}
          />
          {fieldError(errors.note)}
        </View>

        {fieldError(errors.entry)}
        {submitError && (
          <Text style={ui.error}>{t(`journal.errors.${submitError}`)}</Text>
        )}
        <Pressable
          testID="journal-form-submit"
          style={[ui.button, loading && ui.buttonDisabled]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={ui.buttonText}>{t("journal.form.save")}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = createThemedStyles((c) =>
  StyleSheet.create({
    content: { padding: 24, gap: 12 },
    field: { gap: 4 },
    label: { fontSize: 13, color: c.textMuted },
    note: { minHeight: 120, textAlignVertical: "top" },
  }),
);
