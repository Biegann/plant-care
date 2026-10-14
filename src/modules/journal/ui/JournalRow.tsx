import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { createThemedStyles, useColors } from "../../../shared/ui/theme";
import { formatDisplayDate } from "../../../shared/utils/date";
import { usePlantPhotoUrl } from "../../plants/hooks/usePlantPhotoUrl";
import type { JournalEntry } from "../api/journalApi";

export function journalMeta(entry: JournalEntry): string {
  const date = formatDisplayDate(entry.entryOn);
  return entry.createdByName ? `${date} · ${entry.createdByName}` : date;
}

// Wiersz dziennika: kwadratowa miniatura (przycięta) albo ikona notatki,
// data z autorem i początek notatki
export function JournalRow({
  entry,
  onPress,
}: {
  entry: JournalEntry;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useStyles();
  const photoUrl = usePlantPhotoUrl(entry.photoPath);

  return (
    <Pressable
      testID={`journal-row-${entry.id}`}
      style={styles.row}
      onPress={onPress}
    >
      <View style={styles.thumb}>
        {photoUrl ? (
          <Image
            testID={`journal-thumb-${entry.id}`}
            source={{ uri: photoUrl }}
            style={styles.image}
          />
        ) : (
          <Ionicons
            name={entry.photoPath ? "image-outline" : "document-text-outline"}
            size={22}
            color={colors.primary}
          />
        )}
      </View>
      <View style={styles.text}>
        <Text style={styles.meta} numberOfLines={1}>
          {journalMeta(entry)}
        </Text>
        <Text
          style={[styles.note, !entry.note && styles.noteEmpty]}
          numberOfLines={2}
        >
          {entry.note ?? t("journal.photoOnly")}
        </Text>
      </View>
    </Pressable>
  );
}

const useStyles = createThemedStyles((c) =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    thumb: {
      width: 56,
      height: 56,
      borderRadius: 8,
      backgroundColor: c.surfaceActive,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    image: { width: "100%", height: "100%" },
    text: { flex: 1, gap: 2 },
    meta: { fontSize: 13, color: c.textMuted },
    note: { fontSize: 15, color: c.text },
    noteEmpty: { color: c.textMuted, fontStyle: "italic" },
  }),
);
