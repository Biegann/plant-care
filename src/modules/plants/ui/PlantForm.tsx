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
import type {
    PhotoChange,
    Plant,
    PlantResult,
    PlantSaved,
} from "../api/plantsApi";
import { usePlantPhotoUrl } from "../hooks/usePlantPhotoUrl";
import type { PickedPhoto } from "../pickPhoto";
import {
    validatePlantInput,
    type PlantInput,
    type PlantInputErrors,
} from "../validation";
import { DateField } from "./DateField";
import { PhotoField } from "./PhotoField";

type Props = {
  // Roślina do edycji; bez niej formularz jest pusty (dodawanie)
  initial?: Plant;
  onSubmit: (
    input: PlantInput,
    photo: PhotoChange,
  ) => Promise<PlantResult<PlantSaved>>;
  onSaved: (saved: PlantSaved) => void;
};

export function PlantForm({ initial, onSubmit, onSaved }: Props) {
  const { t } = useTranslation();
  const headerHeight = useHeaderHeight();

  const [name, setName] = useState(initial?.name ?? "");
  const [speciesName, setSpeciesName] = useState(initial?.speciesName ?? "");
  const [locationNote, setLocationNote] = useState(initial?.locationNote ?? "");
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  // undefined = zdjęcie bez zmian, "remove" = usuń obecne, dane = wyślij nowe
  const [photo, setPhoto] = useState<PhotoChange>(undefined);
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<PlantInputErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const savedPhotoUrl = usePlantPhotoUrl(initial?.photoPath ?? null);
  const previewUri = photo === "remove" ? null : (pickedUri ?? savedPhotoUrl);

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

    const input: PlantInput = {
      name,
      speciesName,
      locationNote,
      purchaseDate,
      notes,
    };
    const found = validatePlantInput(input);
    setErrors(found);
    setSubmitError(null);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    const result = await onSubmit(input, photo);
    setLoading(false);

    if (result.ok) onSaved(result.data);
    else setSubmitError(result.error);
  };

  const fieldError = (code?: string) =>
    code ? <Text style={ui.error}>{t(`plants.errors.${code}`)}</Text> : null;

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
        />

        <View style={styles.field}>
          <Text style={styles.label}>{t("plants.form.name")}</Text>
          <TextInput
            testID="plant-name-input"
            style={ui.input}
            placeholder={t("plants.form.namePlaceholder")}
            maxLength={60}
            value={name}
            onChangeText={setName}
          />
          {fieldError(errors.name)}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("plants.form.species")}</Text>
          <TextInput
            testID="plant-species-input"
            style={ui.input}
            placeholder={t("plants.form.speciesPlaceholder")}
            maxLength={80}
            value={speciesName}
            onChangeText={setSpeciesName}
          />
          {fieldError(errors.speciesName)}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("plants.form.location")}</Text>
          <TextInput
            testID="plant-location-input"
            style={ui.input}
            placeholder={t("plants.form.locationPlaceholder")}
            maxLength={80}
            value={locationNote}
            onChangeText={setLocationNote}
          />
          {fieldError(errors.locationNote)}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("plants.form.purchaseDate")}</Text>
          <DateField value={purchaseDate} onChange={setPurchaseDate} />
          {fieldError(errors.purchaseDate)}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("plants.form.notes")}</Text>
          <TextInput
            testID="plant-notes-input"
            style={[ui.input, styles.notes]}
            placeholder={t("plants.form.notesPlaceholder")}
            maxLength={1000}
            multiline
            value={notes}
            onChangeText={setNotes}
          />
          {fieldError(errors.notes)}
        </View>

        {submitError && (
          <Text style={ui.error}>{t(`plants.errors.${submitError}`)}</Text>
        )}
        <Pressable
          testID="plant-form-submit"
          style={[ui.button, loading && ui.buttonDisabled]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={ui.buttonText}>{t("plants.form.save")}</Text>
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
  notes: { minHeight: 96, textAlignVertical: "top" },
});
