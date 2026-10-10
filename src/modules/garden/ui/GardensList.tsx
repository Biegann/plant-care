import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { Screen } from "../../../shared/ui/Screen";
import { ui } from "../../../shared/ui/styles";
import { useActiveGarden } from "../hooks/useActiveGarden";

export function GardensList() {
  const { t } = useTranslation();
  const router = useRouter();
  const { gardens, garden, setActiveGardenId, isLoading, isError, refetch } =
    useActiveGarden();

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <Text style={ui.title}>{t("gardens.title")}</Text>
        <Text style={ui.error}>{t("gardens.error")}</Text>
        <Pressable
          testID="retry-button"
          style={ui.secondaryButton}
          onPress={() => refetch()}
        >
          <Text style={ui.secondaryButtonText}>{t("gardens.retry")}</Text>
        </Pressable>
      </Screen>
    );
  }

  const actions = (
    <View style={{ gap: 12 }}>
      <Pressable
        testID="new-garden-button"
        style={ui.button}
        onPress={() => router.push("/garden/new")}
      >
        <Text style={ui.buttonText}>{t("gardens.new")}</Text>
      </Pressable>
      <Pressable
        testID="join-garden-button"
        style={ui.secondaryButton}
        onPress={() => router.push("/garden/join")}
      >
        <Text style={ui.secondaryButtonText}>{t("gardens.join")}</Text>
      </Pressable>
    </View>
  );

  if (gardens.length === 0) {
    return (
      <Screen>
        <Text style={ui.title}>{t("gardens.empty")}</Text>
        <Text style={ui.subtitle}>{t("gardens.emptyHint")}</Text>
        {actions}
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={ui.title}>{t("gardens.title")}</Text>
      <Text style={ui.subtitle}>
        {t("gardens.active")}: {garden?.name}
      </Text>
      <ScrollView contentContainerStyle={{ gap: 10 }}>
        {gardens.map((item) => {
          const isActive = item.id === garden?.id;
          return (
            <View key={item.id} style={[ui.card, isActive && ui.cardActive]}>
              <Pressable
                testID={`garden-${item.id}`}
                style={ui.cardMain}
                onPress={() => setActiveGardenId(item.id)}
              >
                <Ionicons
                  name={isActive ? "radio-button-on" : "radio-button-off"}
                  size={22}
                  color="#2e7d32"
                />
                <View style={ui.grow}>
                  <Text style={ui.cardTitle}>{item.name}</Text>
                  <Text style={ui.cardSubtitle}>
                    {t(`gardens.role.${item.role}`)}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                testID={`garden-details-${item.id}`}
                hitSlop={12}
                onPress={() => router.push(`/garden/${item.id}`)}
              >
                <Ionicons name="chevron-forward" size={22} color="#666" />
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
      {actions}
    </Screen>
  );
}
