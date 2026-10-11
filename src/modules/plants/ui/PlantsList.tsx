import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Screen } from "../../../shared/ui/Screen";
import { ui } from "../../../shared/ui/styles";
import { useCareTasks } from "../../care-schedule/hooks/useCareTasks";
import { plantIdsNeedingCare, todayIso } from "../../care-schedule/schedule";
import { useActiveGarden } from "../../garden/hooks/useActiveGarden";
import { filterPlants } from "../filter";
import { usePlants } from "../hooks/usePlants";
import { PlantRow } from "./PlantRow";

export function PlantsList() {
  const { t } = useTranslation();
  const router = useRouter();
  const { garden, isLoading: gardenLoading } = useActiveGarden();
  const plantsQuery = usePlants(garden?.id);
  const careQuery = useCareTasks(garden?.id);
  const [query, setQuery] = useState("");

  const needingCare = plantIdsNeedingCare(careQuery.data ?? [], todayIso());

  const plants = plantsQuery.data;
  const visible = useMemo(
    () => filterPlants(plants ?? [], query),
    [plants, query],
  );

  if (gardenLoading) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (!garden) {
    return (
      <Screen>
        <Text style={ui.title}>{t("plants.title")}</Text>
        <Text style={ui.subtitle}>{t("plants.needGarden")}</Text>
        <Pressable
          testID="go-to-gardens"
          style={ui.button}
          onPress={() => router.navigate("/gardens")}
        >
          <Text style={ui.buttonText}>{t("plants.goToGardens")}</Text>
        </Pressable>
      </Screen>
    );
  }

  const total = plants?.length ?? 0;

  return (
    <Screen style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("plants.title")}</Text>
        <Text style={styles.garden} numberOfLines={1}>
          {garden.name}
        </Text>
      </View>

      {plantsQuery.isPending ? (
        <ActivityIndicator />
      ) : plantsQuery.isError ? (
        <View style={styles.message}>
          <Text style={ui.error}>{t("plants.error")}</Text>
          <Pressable
            testID="retry-plants"
            style={ui.secondaryButton}
            onPress={() => plantsQuery.refetch()}
          >
            <Text style={ui.secondaryButtonText}>{t("plants.retry")}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {total > 0 && (
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color="#888" />
              <TextInput
                testID="plant-search"
                style={styles.searchInput}
                placeholder={t("plants.searchPlaceholder")}
                autoCorrect={false}
                autoCapitalize="none"
                value={query}
                onChangeText={setQuery}
              />
            </View>
          )}
          <FlatList
            data={visible}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PlantRow
                plant={item}
                needsCare={needingCare.has(item.id)}
                onPress={() => router.push(`/plant/${item.id}`)}
              />
            )}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              total === 0 ? (
                <View style={styles.message}>
                  <Text style={styles.emptyTitle}>{t("plants.empty")}</Text>
                  <Text style={styles.emptyHint}>{t("plants.emptyHint")}</Text>
                </View>
              ) : (
                <Text style={[styles.emptyHint, styles.message]}>
                  {t("plants.noResults", { query: query.trim() })}
                </Text>
              )
            }
          />
        </>
      )}

      <Pressable
        testID="add-plant-button"
        accessibilityLabel={t("plants.add")}
        style={styles.fab}
        onPress={() => router.push("/plant/new")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 0, gap: 0 },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  title: { fontSize: 22, fontWeight: "700" },
  garden: { flex: 1, fontSize: 13, color: "#2e7d32" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 6,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  listContent: { paddingBottom: 90 },
  message: { padding: 16, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptyHint: { fontSize: 14, color: "#666" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#2e7d32",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
});
