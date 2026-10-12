import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { CareTask } from "../api/careApi";
import { daysUntil } from "../schedule";
import type { CareType } from "../validation";

export const CARE_ICONS: Record<CareType, ComponentProps<typeof Ionicons>["name"]> = {
  water: "water-outline",
  fertilize: "flask-outline",
  repot: "flower-outline",
  other: "ellipse-outline",
};

type Props = {
  task: CareTask;
  // Dzisiejsza data jako RRRR-MM-DD
  today: string;
  busy: boolean;
  onDone: () => void;
  onPostpone: () => void;
  onEdit: () => void;
};

export function CareTaskCard({
  task,
  today,
  busy,
  onDone,
  onPostpone,
  onEdit,
}: Props) {
  const { t } = useTranslation();
  const days = daysUntil(task.nextDueOn, today);
  const isDue = days <= 0;

  const title =
    task.type === "other" ? task.customLabel : t(`care.types.${task.type}`);
  const interval =
    task.intervalDays === 1
      ? t("care.everyDay")
      : t("care.everyDays", { count: task.intervalDays });

  const dueText = () => {
    if (days < -1) return t("care.due.overdueMany", { count: -days });
    if (days === -1) return t("care.due.overdueOne");
    if (days === 0) return t("care.due.today");
    if (days === 1) return t("care.due.tomorrow");
    return t("care.due.inDays", { count: days });
  };

  return (
    <View
      testID={`care-task-${task.id}`}
      style={[styles.card, !task.enabled && styles.cardDisabled]}
    >
      <View style={styles.header}>
        <Ionicons name={CARE_ICONS[task.type]} size={20} color="#2e7d32" />
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.interval}>{interval}</Text>
        <Pressable
          testID={`care-task-edit-${task.id}`}
          accessibilityLabel={t("care.edit")}
          hitSlop={8}
          onPress={onEdit}
          disabled={busy}
        >
          <Ionicons name="create-outline" size={20} color="#2e7d32" />
        </Pressable>
      </View>

      {task.enabled ? (
        <>
          <Text
            testID={`care-task-due-${task.id}`}
            style={[
              styles.due,
              days < 0 && styles.overdue,
              days === 0 && styles.today,
            ]}
          >
            {dueText()}
          </Text>
          <View style={styles.actions}>
            <Pressable
              testID={`care-task-done-${task.id}`}
              style={[styles.button, busy && styles.buttonDisabled]}
              onPress={onDone}
              disabled={busy}
            >
              <Text style={styles.buttonText}>{t("care.done")}</Text>
            </Pressable>
            {isDue && (
              <Pressable
                testID={`care-task-postpone-${task.id}`}
                style={[styles.secondaryButton, busy && styles.buttonDisabled]}
                onPress={onPostpone}
                disabled={busy}
              >
                <Text style={styles.secondaryButtonText}>
                  {t("care.postpone")}
                </Text>
              </Pressable>
            )}
          </View>
        </>
      ) : (
        <Text style={styles.due}>{t("care.disabled")}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  cardDisabled: { opacity: 0.6 },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: "600" },
  interval: { fontSize: 13, color: "#666" },
  due: { fontSize: 14, color: "#666" },
  overdue: { color: "#c0392b", fontWeight: "600" },
  today: { color: "#2e7d32", fontWeight: "600" },
  actions: { flexDirection: "row", gap: 8 },
  button: {
    backgroundColor: "#2e7d32",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#2e7d32",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  secondaryButtonText: { color: "#2e7d32", fontSize: 14, fontWeight: "600" },
  buttonDisabled: { opacity: 0.6 },
});
