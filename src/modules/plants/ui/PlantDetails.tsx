import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useUi } from "../../../shared/ui/styles";
import { createThemedStyles, useColors } from "../../../shared/ui/theme";
import { CareHistorySection } from "../../care-schedule/ui/CareHistorySection";
import { JournalSection } from "../../journal/ui/JournalSection";
import { SpeciesTips } from "../../species/ui/SpeciesTips";
import {
  speciesLabel,
  useSpeciesLanguage,
} from "../../species/useSpeciesLanguage";
import { CareSection } from "../../care-schedule/ui/CareSection";
import { formatDisplayDate } from "../../../shared/utils/date";
import { usePlant } from "../hooks/usePlant";
import { usePlantPhotoUrl } from "../hooks/usePlantPhotoUrl";
import { deletePlantAndRefresh } from "../plantActions";

export function PlantDetails({ plantId }: { plantId: string }) {
  const { t } = useTranslation();
  const ui = useUi();
  const colors = useColors();
  const styles = useStyles();
  const router = useRouter();
  const { plant, isLoading } = usePlant(plantId);
  const photoUrl = usePlantPhotoUrl(plant?.photoPath ?? null);
  const language = useSpeciesLanguage();
  const species = plant ? speciesLabel(plant, language) : null;
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const remove = async () => {
    if (!plant) return;
    setBusy(true);
    setErrorKey(null);
    const result = await deletePlantAndRefresh(plant);
    if (result.ok) {
      router.back();
      return;
    }
    setBusy(false);
    setErrorKey(result.error);
  };

  const confirmDelete = () => {
    if (!plant) return;
    Alert.alert(
      t("plants.deleteTitle"),
      t("plants.deleteMessage", { name: plant.name }),
      [
        { text: t("plants.cancel"), style: "cancel" },
        { text: t("plants.delete"), style: "destructive", onPress: remove },
      ],
    );
  };

  // Ikony w nagłówku: edycja, a skrajnie po prawej kosz
  const headerRight = () =>
    plant && !busy ? (
      <View style={styles.headerIcons}>
        <Pressable
          testID="plant-edit"
          accessibilityLabel={t("plants.edit")}
          hitSlop={8}
          onPress={() => router.push(`/plant/edit/${plant.id}`)}
        >
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </Pressable>
        <Pressable
          testID="plant-delete"
          accessibilityLabel={t("plants.delete")}
          hitSlop={8}
          onPress={confirmDelete}
        >
          <Ionicons name="trash-outline" size={24} color={colors.danger} />
        </Pressable>
      </View>
    ) : null;

  const content = () => {
    if (isLoading || busy) {
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

    return (
      <ScrollView contentContainerStyle={styles.content}>
        {photoUrl ? (
          <Image
            testID="plant-details-photo"
            source={{ uri: photoUrl }}
            style={styles.photo}
          />
        ) : (
          <View style={[styles.photo, styles.photoEmpty]}>
            <Ionicons name="leaf" size={64} color={colors.primary} />
          </View>
        )}

        <View style={styles.body}>
          <Text style={ui.title}>{plant.name}</Text>
          {species && <Text style={styles.species}>{species}</Text>}
          {errorKey && (
            <Text style={ui.error}>{t(`plants.errors.${errorKey}`)}</Text>
          )}

          {plant.locationNote && (
            <View style={styles.row}>
              <Text style={styles.label}>{t("plants.form.location")}</Text>
              <Text style={styles.value}>{plant.locationNote}</Text>
            </View>
          )}
          {plant.purchaseDate && (
            <View style={styles.row}>
              <Text style={styles.label}>{t("plants.form.purchaseDate")}</Text>
              <Text style={styles.value}>
                {formatDisplayDate(plant.purchaseDate)}
              </Text>
            </View>
          )}
          {plant.notes && (
            <View style={styles.notes}>
              <Text style={styles.label}>{t("plants.form.notes")}</Text>
              <Text style={styles.value}>{plant.notes}</Text>
            </View>
          )}

          <SpeciesTips speciesKey={plant.speciesKey} />
          <Pressable
            testID="plant-diagnose"
            style={[ui.secondaryButton, styles.diagnose]}
            onPress={() => router.push(`/diagnosis/${plant.id}`)}
          >
            <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
            <Text style={ui.secondaryButtonText}>{t("diagnosis.open")}</Text>
          </Pressable>
          <CareSection plantId={plant.id} />
          <CareHistorySection plantId={plant.id} />
          <JournalSection plantId={plant.id} />
        </View>
      </ScrollView>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerRight }} />
      {content()}
    </>
  );
}

const useStyles = createThemedStyles((c) =>
  StyleSheet.create({
    headerIcons: { flexDirection: "row", alignItems: "center", gap: 20 },
    content: { paddingBottom: 32 },
    photo: { width: "100%", aspectRatio: 1 },
    photoEmpty: {
      backgroundColor: c.surfaceActive,
      alignItems: "center",
      justifyContent: "center",
    },
    body: { padding: 24, gap: 12 },
    species: { fontSize: 16, color: c.textMuted, fontStyle: "italic" },
    row: { flexDirection: "row", gap: 12 },
    label: { width: 110, fontSize: 14, color: c.textMuted },
    value: { flex: 1, fontSize: 16, color: c.text },
    notes: { gap: 4 },
    diagnose: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginTop: 12,
    },
  }),
);
