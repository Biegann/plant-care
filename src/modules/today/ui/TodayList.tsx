import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    AppState,
    Pressable,
    SectionList,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Screen } from "../../../shared/ui/Screen";
import { ui } from "../../../shared/ui/styles";
import type { CareResult, CareTask } from "../../care-schedule/api/careApi";
import {
    completeCareTaskAndRefresh,
    postponeCareTaskAndRefresh,
} from "../../care-schedule/careActions";
import { todayIso } from "../../care-schedule/schedule";
import { useGardenStore } from "../../garden/store/gardenStore";
import type { TodayTask } from "../api/todayApi";
import { groupByGarden } from "../groups";
import { useTodayTasks } from "../hooks/useTodayTasks";
import { TodayRow } from "./TodayRow";

type TaskAction = (
  gardenId: string,
  task: CareTask,
  today: string,
) => Promise<CareResult<unknown>>;

// Ekran "Dziś": zadania na dziś i zaległe ze wszystkich ogrodów
export function TodayList() {
  const { t } = useTranslation();
  const { data, isPending, isError, refetch } = useTodayTasks();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  // Lista ma być aktualna po każdym wejściu na zakładkę i po powrocie do aplikacji
  // (zmiany innych członków ogrodu, nowy dzień)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") refetch();
    });
    return () => subscription.remove();
  }, [refetch]);

  const sections = useMemo(
    () =>
      groupByGarden(data ?? []).map((group) => ({
        gardenId: group.gardenId,
        title: group.gardenName,
        data: group.tasks,
      })),
    [data],
  );

  const run = async (item: TodayTask, action: TaskAction) => {
    if (busyId) return;
    setBusyId(item.task.id);
    setErrorKey(null);
    const result = await action(item.gardenId, item.task, todayIso());
    setBusyId(null);
    if (!result.ok) setErrorKey(result.error);
  };

  // Karta rośliny czyta dane z aktywnego ogrodu, więc najpierw przełączamy go na ogród rośliny
  const openPlant = (item: TodayTask) => {
    useGardenStore.getState().setActiveGardenId(item.gardenId);
    router.push(`/plant/${item.task.plantId}`);
  };

  const pullToRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const total = data?.length ?? 0;
  const today = todayIso();

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("today.title")}</Text>
        {total > 0 && (
          <Text testID="today-count" style={styles.count}>
            {t("today.count", { count: total })}
          </Text>
        )}
      </View>

      {errorKey && (
        <Text testID="today-action-error" style={[ui.error, styles.actionError]}>
          {t(`care.errors.${errorKey}`)}
        </Text>
      )}

      {isPending ? (
        <ActivityIndicator />
      ) : isError ? (
        <View style={styles.message}>
          <Text style={ui.error}>{t("today.error")}</Text>
          <Pressable
            testID="retry-today"
            style={ui.secondaryButton}
            onPress={() => refetch()}
          >
            <Text style={ui.secondaryButtonText}>{t("today.retry")}</Text>
          </Pressable>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.task.id}
          renderItem={({ item }) => (
            <TodayRow
              item={item}
              today={today}
              busy={busyId !== null}
              onPress={() => openPlant(item)}
              onDone={() => run(item, completeCareTaskAndRefresh)}
              onPostpone={() => run(item, postponeCareTaskAndRefresh)}
            />
          )}
          // Nazwa ogrodu ma sens dopiero, gdy zadania są w kilku ogrodach
          renderSectionHeader={({ section }) =>
            sections.length > 1 ? (
              <Text
                testID={`today-garden-${section.gardenId}`}
                style={styles.garden}
                numberOfLines={1}
              >
                {section.title}
              </Text>
            ) : null
          }
          stickySectionHeadersEnabled={false}
          refreshing={refreshing}
          onRefresh={pullToRefresh}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View testID="today-empty" style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#2e7d32" />
              <Text style={styles.emptyTitle}>{t("today.empty")}</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 0, gap: 0 },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  title: { fontSize: 22, fontWeight: "700" },
  count: { fontSize: 13, color: "#2e7d32" },
  garden: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  listContent: { flexGrow: 1, paddingBottom: 24 },
  message: { padding: 16, gap: 8 },
  actionError: { paddingHorizontal: 16, paddingBottom: 6 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
});
