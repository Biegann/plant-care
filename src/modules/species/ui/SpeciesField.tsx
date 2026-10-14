import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useUi } from "../../../shared/ui/styles";
import { TextField } from "../../../shared/ui/TextField";
import { createThemedStyles, useColors } from "../../../shared/ui/theme";
import { searchSpecies } from "../search";
import { useSpeciesLanguage } from "../useSpeciesLanguage";

type Props = {
  name: string;
  speciesKey: string | null;
  // Wpisanie tekstu kasuje wybór z listy (key = null), wybór podpowiedzi ustawia oba pola
  onChange: (name: string, speciesKey: string | null) => void;
  placeholder: string;
};

// Pole "Gatunek": wolny tekst z podpowiedziami z wbudowanej listy gatunków
export function SpeciesField({
  name,
  speciesKey,
  onChange,
  placeholder,
}: Props) {
  const { t } = useTranslation();
  const ui = useUi();
  const colors = useColors();
  const styles = useStyles();
  const language = useSpeciesLanguage();
  // Po wyborze z listy podpowiedzi znikają, dopóki użytkownik nie zmieni tekstu
  const suggestions = speciesKey ? [] : searchSpecies(name, language);

  return (
    <View style={styles.wrapper}>
      <View>
        <TextField
          testID="plant-species-input"
          style={[ui.input, speciesKey && styles.inputSelected]}
          placeholder={placeholder}
          maxLength={80}
          value={name}
          onChangeText={(text) => onChange(text, null)}
        />
        {speciesKey && (
          <View
            testID="species-selected"
            accessibilityLabel={t("species.fromList")}
            style={styles.check}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.primary}
            />
          </View>
        )}
      </View>
      {suggestions.length > 0 && (
        <View testID="species-suggestions" style={styles.list}>
          {suggestions.map((species) => (
            <Pressable
              key={species.key}
              testID={`species-option-${species.key}`}
              style={styles.option}
              onPress={() => onChange(species.names[language], species.key)}
            >
              <Text style={styles.optionName} numberOfLines={1}>
                {species.names[language]}
              </Text>
              <Text style={styles.optionLatin} numberOfLines={1}>
                {species.latin}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const useStyles = createThemedStyles((c) =>
  StyleSheet.create({
    wrapper: { gap: 4 },
    // Miejsce na znaczek po prawej, żeby tekst na niego nie wchodził
    inputSelected: { paddingRight: 40 },
    check: {
      position: "absolute",
      right: 12,
      top: 0,
      bottom: 0,
      justifyContent: "center",
    },
    list: {
      borderWidth: 1,
      borderColor: c.inputBorder,
      borderRadius: 8,
      overflow: "hidden",
    },
    option: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
    },
    optionName: { fontSize: 15, color: c.text },
    optionLatin: { fontSize: 12, color: c.textMuted, fontStyle: "italic" },
  }),
);
