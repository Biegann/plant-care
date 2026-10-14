import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useUi } from "../../../shared/ui/styles";
import { createThemedStyles, useColors } from "../../../shared/ui/theme";
import { shortenName } from "../../../shared/utils/text";
import { usePlant } from "../../plants/hooks/usePlant";
import { useJournal } from "../hooks/useJournal";
import { JournalRow } from "./JournalRow";

// Ekran całego dziennika jednej rośliny; "+" w nagłówku dodaje wpis
export function JournalList({ plantId }: { plantId: string }) {
  const { t } = useTranslation();
  const ui = useUi();
  const colors = useColors();
  const styles = useStyles();
  const router = useRouter();
  const { plant } = usePlant(plantId);
  const { data, isLoading, isError } = useJournal(plantId);

  const title = plant
    ? t("journal.titleWithName", { name: shortenName(plant.name) })
    : t("journal.title");

  const headerRight = () => (
    <Pressable
      testID="journal-list-add"
      accessibilityLabel={t("journal.add")}
      hitSlop={8}
      onPress={() =>
        router.push({ pathname: "/journal/new", params: { plantId } })
      }
    >
      <Ionicons name="add" size={28} color={colors.primary} />
    </Pressable>
  );

  const content = () => {
    if (isLoading) {
      return (
        <View style={ui.screen}>
          <ActivityIndicator />
        </View>
      );
    }

    if (isError) {
      return (
        <View style={ui.screen}>
          <Text style={ui.error}>{t("journal.error")}</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={data ?? []}
        keyExtractor={(entry) => entry.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={ui.subtitle}>{t("journal.empty")}</Text>
        }
        renderItem={({ item }) => (
          <JournalRow
            entry={item}
            onPress={() =>
              router.push({
                pathname: "/journal/entry/[id]",
                params: { id: item.id, plantId },
              })
            }
          />
        )}
      />
    );
  };

  return (
    <>
      <Stack.Screen options={{ title, headerRight }} />
      {content()}
    </>
  );
}

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
    list: { padding: 24, gap: 14 },
  }),
);
