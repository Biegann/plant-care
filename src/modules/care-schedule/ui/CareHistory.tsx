import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useUi } from "../../../shared/ui/styles";
import { createThemedStyles, useColors } from "../../../shared/ui/theme";
import { formatDisplayDate } from "../../../shared/utils/date";
import { usePlant } from "../../plants/hooks/usePlant";
import type { CareLogEntry } from "../api/careLogApi";
import { deleteCareLogEntryAndRefresh } from "../careActions";
import { useCareLog } from "../hooks/useCareLog";
import { CARE_ICONS } from "./CareTaskCard";

// Tyle znaków nazwy rośliny mieści się w tytule ekranu, reszta to wielokropek
export const TITLE_NAME_MAX = 16;

export function shortenName(name: string, max = TITLE_NAME_MAX): string {
  const chars = Array.from(name);
  if (chars.length <= max) return name;
  return `${chars
    .slice(0, max - 1)
    .join("")
    .trimEnd()}…`;
}

// Ekran pełnej historii opieki jednej rośliny, z usuwaniem wpisów
export function CareHistory({ plantId }: { plantId: string }) {
  const { t } = useTranslation();
  const ui = useUi();
  const colors = useColors();
  const styles = useStyles();
  const { plant } = usePlant(plantId);
  const { data, isLoading, isError } = useCareLog(plantId);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const entryName = (entry: CareLogEntry) =>
    entry.type === "other"
      ? (entry.customLabel ?? t("care.types.other"))
      : t(`care.types.${entry.type}`);

  const remove = async (entry: CareLogEntry) => {
    if (busyId) return;
    setBusyId(entry.id);
    setErrorKey(null);
    const result = await deleteCareLogEntryAndRefresh(plantId, entry.id);
    setBusyId(null);
    if (!result.ok) setErrorKey(result.error);
  };

  const confirmDelete = (entry: CareLogEntry) => {
    Alert.alert(
      t("care.history.deleteTitle"),
      t("care.history.deleteMessage", {
        name: entryName(entry),
        date: formatDisplayDate(entry.doneOn),
      }),
      [
        { text: t("care.cancel"), style: "cancel" },
        {
          text: t("care.history.delete"),
          style: "destructive",
          onPress: () => remove(entry),
        },
      ],
    );
  };

  const title = plant
    ? t("care.history.titleWithName", { name: shortenName(plant.name) })
    : t("care.history.screenTitle");

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
          <Text style={ui.error}>{t("care.history.error")}</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={data ?? []}
        keyExtractor={(entry) => entry.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          errorKey ? (
            <Text style={ui.error}>{t(`care.errors.${errorKey}`)}</Text>
          ) : null
        }
        ListEmptyComponent={
          <Text style={ui.subtitle}>{t("care.history.empty")}</Text>
        }
        renderItem={({ item }) => (
          <View testID={`care-history-${item.id}`} style={styles.row}>
            <Ionicons
              name={CARE_ICONS[item.type]}
              size={20}
              color={colors.primary}
            />
            <View style={ui.grow}>
              <Text style={styles.title} numberOfLines={1}>
                {entryName(item)}
              </Text>
              <Text
                testID={`care-history-meta-${item.id}`}
                style={ui.cardSubtitle}
                numberOfLines={1}
              >
                {item.doneByName
                  ? `${formatDisplayDate(item.doneOn)} · ${item.doneByName}`
                  : formatDisplayDate(item.doneOn)}
              </Text>
            </View>
            <Pressable
              testID={`care-history-delete-${item.id}`}
              accessibilityLabel={t("care.history.delete")}
              hitSlop={8}
              onPress={() => confirmDelete(item)}
              disabled={busyId !== null}
              style={busyId !== null && ui.buttonDisabled}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>
        )}
      />
    );
  };

  return (
    <>
      <Stack.Screen options={{ title }} />
      {content()}
    </>
  );
}

const useStyles = createThemedStyles((c) =>
  StyleSheet.create({
    list: { padding: 24, gap: 14 },
    row: { flexDirection: "row", alignItems: "center", gap: 12 },
    title: { fontSize: 16, fontWeight: "600", color: c.text },
  }),
);
