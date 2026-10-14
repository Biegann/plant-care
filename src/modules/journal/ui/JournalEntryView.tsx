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
import { formatDisplayDate } from "../../../shared/utils/date";
import { usePlantPhotoUrl } from "../../plants/hooks/usePlantPhotoUrl";
import { useJournalEntry } from "../hooks/useJournal";
import { deleteJournalEntryAndRefresh } from "../journalActions";
import { journalMeta } from "./JournalRow";

// Podgląd wpisu: całe zdjęcie (bez przycinania), data z autorem i pełna notatka.
// Edycja i usuwanie to ikony w nagłówku, jak na karcie rośliny
export function JournalEntryView({
  plantId,
  entryId,
}: {
  plantId: string;
  entryId: string;
}) {
  const { t } = useTranslation();
  const ui = useUi();
  const colors = useColors();
  const styles = useStyles();
  const router = useRouter();
  const { entry, isLoading } = useJournalEntry(plantId, entryId);
  const photoUrl = usePlantPhotoUrl(entry?.photoPath ?? null);
  // Proporcje zdjęcia znamy dopiero po wczytaniu; do tego czasu kwadrat
  const [aspectRatio, setAspectRatio] = useState(1);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const remove = async () => {
    if (!entry) return;
    setBusy(true);
    setErrorKey(null);
    const result = await deleteJournalEntryAndRefresh(entry);
    if (result.ok) {
      router.back();
      return;
    }
    setBusy(false);
    setErrorKey(result.error);
  };

  const confirmDelete = () => {
    if (!entry) return;
    Alert.alert(
      t("journal.deleteTitle"),
      t("journal.deleteMessage", { date: formatDisplayDate(entry.entryOn) }),
      [
        { text: t("journal.cancel"), style: "cancel" },
        { text: t("journal.delete"), style: "destructive", onPress: remove },
      ],
    );
  };

  const headerRight = () =>
    entry && !busy ? (
      <View style={styles.headerIcons}>
        <Pressable
          testID="journal-edit"
          accessibilityLabel={t("journal.edit")}
          hitSlop={8}
          onPress={() =>
            router.push({
              pathname: "/journal/edit/[id]",
              params: { id: entry.id, plantId },
            })
          }
        >
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </Pressable>
        <Pressable
          testID="journal-delete"
          accessibilityLabel={t("journal.delete")}
          hitSlop={8}
          onPress={confirmDelete}
        >
          <Ionicons name="trash-outline" size={24} color={colors.danger} />
        </Pressable>
      </View>
    ) : null;

  const content = () => {
    // "busy" najpierw: po usunięciu wpis znika z listy, zanim wrócimy
    if (isLoading || busy) {
      return (
        <View style={ui.screen}>
          <ActivityIndicator />
        </View>
      );
    }

    if (!entry) {
      return (
        <View style={ui.screen}>
          <Text style={ui.subtitle}>{t("journal.notFound")}</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.content}>
        {entry.photoPath &&
          (photoUrl ? (
            <Image
              testID="journal-entry-photo"
              source={{ uri: photoUrl }}
              style={[styles.photo, { aspectRatio }]}
              resizeMode="contain"
              onLoad={(event) => {
                const { width, height } = event.nativeEvent.source;
                if (width > 0 && height > 0) setAspectRatio(width / height);
              }}
            />
          ) : (
            <View style={[styles.photo, styles.photoLoading]}>
              <ActivityIndicator />
            </View>
          ))}
        <View style={styles.body}>
          <Text testID="journal-entry-meta" style={styles.meta}>
            {journalMeta(entry)}
          </Text>
          {errorKey && (
            <Text style={ui.error}>{t(`journal.errors.${errorKey}`)}</Text>
          )}
          {entry.note && <Text style={styles.note}>{entry.note}</Text>}
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
    photo: { width: "100%", backgroundColor: c.surfaceActive },
    photoLoading: {
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    body: { padding: 24, gap: 12 },
    meta: { fontSize: 14, color: c.textMuted },
    note: { fontSize: 16, color: c.text, lineHeight: 22 },
  }),
);
