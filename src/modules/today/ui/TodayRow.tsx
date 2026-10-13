import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { dueText } from "../../care-schedule/dueText";
import { daysUntil } from "../../care-schedule/schedule";
import { CARE_ICONS } from "../../care-schedule/ui/CareTaskCard";
import type { TodayTask } from "../api/todayApi";
import { createThemedStyles, useColors } from "../../../shared/ui/theme";

type Props = {
  item: TodayTask;
  // Dzisiejsza data jako RRRR-MM-DD
  today: string;
  busy: boolean;
  onPress: () => void;
  onDone: () => void;
  onPostpone: () => void;
};

// Zwarty wiersz zadania na ekranie "Dziś": rodzaj opieki, roślina, termin i szybkie akcje
export function TodayRow({
  item,
  today,
  busy,
  onPress,
  onDone,
  onPostpone,
}: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useStyles();
  const { task, plantName } = item;
  const days = daysUntil(task.nextDueOn, today);
  const label =
    task.type === "other"
      ? (task.customLabel ?? t("care.types.other"))
      : t(`care.types.${task.type}`);

  return (
    <View style={styles.row}>
      <Pressable
        testID={`today-task-${task.id}`}
        style={styles.main}
        onPress={onPress}
      >
        <Ionicons
          name={CARE_ICONS[task.type]}
          size={20}
          color={colors.primary}
        />
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            {label}
            <Text style={styles.plant}>{` · ${plantName}`}</Text>
          </Text>
          <Text
            testID={`today-task-due-${task.id}`}
            style={[styles.due, days < 0 ? styles.overdue : styles.today]}
          >
            {dueText(days, t)}
          </Text>
        </View>
      </Pressable>
      <Pressable
        testID={`today-task-done-${task.id}`}
        accessibilityLabel={t("care.done")}
        style={[styles.done, busy && styles.disabled]}
        hitSlop={4}
        onPress={onDone}
        disabled={busy}
      >
        <Ionicons name="checkmark" size={20} color={colors.onPrimary} />
      </Pressable>
      <Pressable
        testID={`today-task-postpone-${task.id}`}
        accessibilityLabel={t("care.postpone")}
        style={[styles.postpone, busy && styles.disabled]}
        hitSlop={4}
        onPress={onPostpone}
        disabled={busy}
      >
        <Text style={styles.postponeText}>{t("today.postponeShort")}</Text>
      </Pressable>
    </View>
  );
}

const useStyles = createThemedStyles((c) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    main: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
    text: { flex: 1 },
    title: { fontSize: 15, fontWeight: "600", color: c.text },
    plant: { fontWeight: "400" },
    due: { fontSize: 12, color: c.text },
    overdue: { color: c.danger, fontWeight: "600" },
    today: { color: c.primary },
    done: {
      width: 40,
      height: 36,
      borderRadius: 8,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    postpone: {
      width: 44,
      height: 36,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    postponeText: { color: c.primary, fontSize: 13, fontWeight: "600" },
    disabled: { opacity: 0.6 },
  }),
);
