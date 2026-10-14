import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { ChoiceChips } from "../../../shared/ui/ChoiceChips";
import { useUi } from "../../../shared/ui/styles";
import {
  useLanguageStore,
  type LanguagePreference,
} from "../store/languageStore";

const OPTIONS: LanguagePreference[] = ["system", "pl", "en"];

// Sekcja "Język" w Profilu: język telefonu, polski albo angielski.
// Nazwy języków są zawsze we własnym języku, żeby dało się wrócić po pomyłce
export function LanguageSettings() {
  const { t } = useTranslation();
  const ui = useUi();
  const { preference, setPreference } = useLanguageStore();

  return (
    <View style={{ gap: 8 }}>
      <Text style={ui.sectionTitle}>{t("language.sectionTitle")}</Text>
      <ChoiceChips
        options={OPTIONS.map((value) => ({
          value,
          label: t(`language.${value}`),
        }))}
        selected={preference}
        onSelect={setPreference}
        testIDPrefix="language"
      />
    </View>
  );
}
