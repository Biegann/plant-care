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
import { ui } from "../../../shared/ui/styles";
import { formatDisplayDate } from "../date";
import { usePlant } from "../hooks/usePlant";
import { usePlantPhotoUrl } from "../hooks/usePlantPhotoUrl";
import { deletePlantAndRefresh } from "../plantActions";

export function PlantDetails({ plantId }: { plantId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { plant, isLoading } = usePlant(plantId);
  const photoUrl = usePlantPhotoUrl(plant?.photoPath ?? null);
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
          <Ionicons name="create-outline" size={24} color="#2e7d32" />
        </Pressable>
        <Pressable
          testID="plant-delete"
          accessibilityLabel={t("plants.delete")}
          hitSlop={8}
          onPress={confirmDelete}
        >
          <Ionicons name="trash-outline" size={24} color="#c0392b" />
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
            <Ionicons name="leaf" size={64} color="#2e7d32" />
          </View>
        )}

        <View style={styles.body}>
          <Text style={ui.title}>{plant.name}</Text>
          {plant.speciesName && (
            <Text style={styles.species}>{plant.speciesName}</Text>
          )}
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

const styles = StyleSheet.create({
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 20 },
  content: { paddingBottom: 32 },
  photo: { width: "100%", aspectRatio: 1 },
  photoEmpty: {
    backgroundColor: "#f1f8f1",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 24, gap: 12 },
  species: { fontSize: 16, color: "#666", fontStyle: "italic" },
  row: { flexDirection: "row", gap: 12 },
  label: { width: 110, fontSize: 14, color: "#666" },
  value: { flex: 1, fontSize: 16 },
  notes: { gap: 4 },
});
