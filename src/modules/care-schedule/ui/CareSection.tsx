import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useUi } from "../../../shared/ui/styles";
import { createThemedStyles, useColors } from "../../../shared/ui/theme";
import { formatDisplayDate } from "../../../shared/utils/date";
import type { CareResult, CareTask } from "../api/careApi";
import {
  completeCareTaskAndRefresh,
  postponeCareTaskAndRefresh,
} from "../careActions";
import { usePlantCareTasks } from "../hooks/useCareTasks";
import { daysUntil, nextDueAfterDone, todayIso } from "../schedule";
import { CareTaskCard } from "./CareTaskCard";

type TaskAction = (
  gardenId: string,
  task: CareTask,
  today: string,
) => Promise<CareResult<unknown>>;

// Sekcja "Opieka" na karcie rośliny: zadania z terminami i szybkimi akcjami
export function CareSection({ plantId }: { plantId: string }) {
  const { t } = useTranslation();
  const ui = useUi();
  const colors = useColors();
  const styles = useStyles();
  const router = useRouter();
  const { gardenId, tasks, isLoading, isError } = usePlantCareTasks(plantId);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const today = todayIso();

  const run = async (task: CareTask, action: TaskAction) => {
    if (busyId || !gardenId) return;
    setBusyId(task.id);
    setErrorKey(null);
    const result = await action(gardenId, task, today);
    setBusyId(null);
    if (!result.ok) setErrorKey(result.error);
  };

  const complete = (task: CareTask) => {
    if (daysUntil(task.nextDueOn, today) <= 0) {
      run(task, completeCareTaskAndRefresh);
      return;
    }

    // Przed terminem najpierw pytamy, bo wykonanie przesunie harmonogram
    Alert.alert(
      t(`care.early.${task.type}`),
      t("care.early.message", {
        date: formatDisplayDate(task.nextDueOn),
        next: formatDisplayDate(nextDueAfterDone(today, task.intervalDays)),
      }),
      [
        { text: t("care.cancel"), style: "cancel" },
        {
          text: t("care.done"),
          onPress: () => run(task, completeCareTaskAndRefresh),
        },
      ],
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[ui.sectionTitle, ui.grow]}>{t("care.title")}</Text>
        <Pressable
          testID="care-add"
          accessibilityLabel={t("care.add")}
          hitSlop={8}
          onPress={() =>
            router.push({ pathname: "/care/new", params: { plantId } })
          }
        >
          <Ionicons
            name="add-circle-outline"
            size={26}
            color={colors.primary}
          />
        </Pressable>
      </View>
      {errorKey && <Text style={ui.error}>{t(`care.errors.${errorKey}`)}</Text>}

      {isLoading ? (
        <ActivityIndicator />
      ) : isError ? (
        <Text style={ui.error}>{t("care.error")}</Text>
      ) : tasks.length === 0 ? (
        <Text style={ui.subtitle}>{t("care.empty")}</Text>
      ) : (
        tasks.map((task) => (
          <CareTaskCard
            key={task.id}
            task={task}
            today={today}
            busy={busyId !== null}
            onDone={() => complete(task)}
            onPostpone={() => run(task, postponeCareTaskAndRefresh)}
            onEdit={() => router.push(`/care/edit/${task.id}`)}
          />
        ))
      )}
    </View>
  );
}

const useStyles = createThemedStyles((c) =>
  StyleSheet.create({
    section: { gap: 8 },
    header: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  }),
);
