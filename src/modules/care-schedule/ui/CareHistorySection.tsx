import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { ui } from "../../../shared/ui/styles";
import { formatDisplayDate } from "../../../shared/utils/date";
import { useCareLog } from "../hooks/useCareLog";
import { CARE_ICONS } from "./CareTaskCard";

// Tyle najnowszych wpisów pokazujemy na karcie rośliny
export const HISTORY_PREVIEW = 3;

// Sekcja "Historia" na karcie rośliny: kilka ostatnich wykonanych zadań
export function CareHistorySection({ plantId }: { plantId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError } = useCareLog(plantId);
  const entries = (data ?? []).slice(0, HISTORY_PREVIEW);

  return (
    <View style={styles.section}>
      <Text style={ui.sectionTitle}>{t("care.history.title")}</Text>

      {isLoading ? (
        <ActivityIndicator />
      ) : isError ? (
        <Text style={ui.error}>{t("care.history.error")}</Text>
      ) : entries.length === 0 ? (
        <Text style={ui.subtitle}>{t("care.history.empty")}</Text>
      ) : (
        entries.map((entry) => (
          <View
            key={entry.id}
            testID={`care-log-${entry.id}`}
            style={styles.row}
          >
            <Ionicons name={CARE_ICONS[entry.type]} size={18} color="#2e7d32" />
            <Text style={styles.title} numberOfLines={1}>
              {entry.type === "other"
                ? entry.customLabel
                : t(`care.types.${entry.type}`)}
            </Text>
            <Text
              testID={`care-log-meta-${entry.id}`}
              style={styles.meta}
              numberOfLines={1}
            >
              {entry.doneByName
                ? `${formatDisplayDate(entry.doneOn)} · ${entry.doneByName}`
                : formatDisplayDate(entry.doneOn)}
            </Text>
          </View>
        ))
      )}

      {entries.length > 0 && (
        <Pressable
          testID="care-history-all"
          hitSlop={8}
          onPress={() =>
            router.push({
              pathname: "/care/history/[plantId]",
              params: { plantId },
            })
          }
        >
          <Text style={ui.link}>{t("care.history.all")}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, fontSize: 15 },
  // Długa nazwa osoby jest ucinana, żeby nie wypchnęła rodzaju zadania
  meta: { maxWidth: "60%", fontSize: 13, color: "#666" },
});
