import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { ui } from "../../../shared/ui/styles";
import { formatDisplayDate } from "../../plants/date";
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
) => Promise<CareResult>;

// Sekcja "Opieka" na karcie rośliny: zadania z terminami i szybkimi akcjami
export function CareSection({ plantId }: { plantId: string }) {
  const { t } = useTranslation();
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
      <Text style={ui.sectionTitle}>{t("care.title")}</Text>
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
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
});
