import { Pressable, StyleSheet, Text, View } from "react-native";
import { createThemedStyles } from "./theme";

type Props<T extends string> = {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
  // testID każdej opcji to `${testIDPrefix}-${value}`
  testIDPrefix: string;
};

// Rząd przycisków-"pigułek" z jedną zaznaczoną opcją (np. Wygląd, Język w Profilu)
export function ChoiceChips<T extends string>({
  options,
  selected,
  onSelect,
  testIDPrefix,
}: Props<T>) {
  const styles = useStyles();

  return (
    <View style={styles.chips}>
      {options.map(({ value, label }) => {
        const isSelected = value === selected;
        return (
          <Pressable
            key={value}
            testID={`${testIDPrefix}-${value}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(value)}
          >
            <Text
              style={[styles.chipText, isSelected && styles.chipTextSelected]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createThemedStyles((c) =>
  StyleSheet.create({
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 16,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    chipSelected: { backgroundColor: c.primary },
    chipText: { color: c.primary, fontSize: 14, fontWeight: "600" },
    chipTextSelected: { color: c.onPrimary },
  }),
);
