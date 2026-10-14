import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useUi } from "../../../shared/ui/styles";
import { createThemedStyles } from "../../../shared/ui/theme";
import { useJournal } from "../hooks/useJournal";
import { JournalRow } from "./JournalRow";

// Tyle najnowszych wpisów pokazujemy na karcie rośliny
export const JOURNAL_PREVIEW = 3;

// Sekcja "Dziennik" na karcie rośliny: kilka ostatnich wpisów i dodawanie
export function JournalSection({ plantId }: { plantId: string }) {
  const { t } = useTranslation();
  const ui = useUi();
  const styles = useStyles();
  const router = useRouter();
  const { data, isLoading, isError } = useJournal(plantId);
  const entries = (data ?? []).slice(0, JOURNAL_PREVIEW);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={ui.sectionTitle}>{t("journal.title")}</Text>
        <Pressable
          testID="journal-add"
          hitSlop={8}
          onPress={() =>
            router.push({ pathname: "/journal/new", params: { plantId } })
          }
        >
          <Text style={ui.link}>{t("journal.add")}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator />
      ) : isError ? (
        <Text style={ui.error}>{t("journal.error")}</Text>
      ) : entries.length === 0 ? (
        <Text style={ui.subtitle}>{t("journal.empty")}</Text>
      ) : (
        entries.map((entry) => (
          <JournalRow
            key={entry.id}
            entry={entry}
            onPress={() =>
              router.push({
                pathname: "/journal/entry/[id]",
                params: { id: entry.id, plantId },
              })
            }
          />
        ))
      )}

      {entries.length > 0 && (
        <Pressable
          testID="journal-all"
          hitSlop={8}
          onPress={() =>
            router.push({
              pathname: "/journal/all/[plantId]",
              params: { plantId },
            })
          }
        >
          <Text style={ui.link}>{t("journal.all")}</Text>
        </Pressable>
      )}
    </View>
  );
}

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
    section: { gap: 10 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
  }),
);
