import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { ui } from "../../../shared/ui/styles";
import { formatDisplayDate, fromIsoDate, toIsoDate } from "../date";

type Props = {
  // Data jako RRRR-MM-DD albo pusty tekst, gdy nie wybrano
  value: string;
  onChange: (value: string) => void;
};

export function DateField({ value, onChange }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const today = new Date();
  const current = fromIsoDate(value) ?? today;

  const onPress = () => {
    // Android pokazuje kalendarz jako okno systemowe, iOS jako element na ekranie
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: current,
        mode: "date",
        maximumDate: today,
        onValueChange: (_event, date) => onChange(toIsoDate(date)),
      });
    } else {
      setOpen((shown) => !shown);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={[ui.input, styles.box]}>
        <Pressable testID="plant-date-open" style={ui.grow} onPress={onPress}>
          <Text style={value ? styles.value : styles.placeholder}>
            {value ? formatDisplayDate(value) : t("plants.form.pickDate")}
          </Text>
        </Pressable>
        {value !== "" && (
          <Pressable
            testID="plant-date-clear"
            accessibilityLabel={t("plants.form.clearDate")}
            hitSlop={8}
            onPress={() => onChange("")}
          >
            <Ionicons name="close-circle" size={20} color="#888" />
          </Pressable>
        )}
      </View>
      {open && Platform.OS !== "android" && (
        <DateTimePicker
          testID="plant-date-picker"
          value={current}
          mode="date"
          display="inline"
          maximumDate={today}
          onValueChange={(_event, date) => onChange(toIsoDate(date))}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  box: { flexDirection: "row", alignItems: "center", gap: 8 },
  value: { fontSize: 16 },
  placeholder: { fontSize: 16, color: "#999" },
});
