import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text } from "react-native";
import { useActiveGarden } from "../../../modules/garden/hooks/useActiveGarden";
import { Screen } from "../../../shared/ui/Screen";
import { ui } from "../../../shared/ui/styles";

export default function GardensTab() {
  const { t } = useTranslation();
  const { gardens, garden, isLoading, isError } = useActiveGarden();

  return (
    <Screen>
      <Text style={ui.title}>{t("gardens.title")}</Text>
      {isLoading ? (
        <ActivityIndicator />
      ) : isError ? (
        <Text style={ui.error}>{t("gardens.error")}</Text>
      ) : gardens.length === 0 ? (
        <Text style={ui.subtitle}>{t("gardens.empty")}</Text>
      ) : (
        <>
          <Text style={ui.subtitle}>
            {t("gardens.active")}: {garden?.name}
          </Text>
          {gardens.map((item) => (
            <Text key={item.id}>{item.name}</Text>
          ))}
        </>
      )}
    </Screen>
  );
}
