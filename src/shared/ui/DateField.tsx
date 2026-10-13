import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useUi } from "./styles";
import { formatDisplayDate, fromIsoDate, toIsoDate } from "../utils/date";
import { createThemedStyles, useColors } from "./theme";

type Props = {
  // Data jako RRRR-MM-DD albo pusty tekst, gdy nie wybrano
  value: string;
  onChange: (value: string) => void;
  // Domyślnie pole jest na daty przeszłe (zakup): bez przyszłości, z czyszczeniem
  allowFuture?: boolean;
  clearable?: boolean;
  testIDPrefix?: string;
};

export function DateField({
  value,
  onChange,
  allowFuture = false,
  clearable = true,
  testIDPrefix = "date",
}: Props) {
  const { t } = useTranslation();
  const ui = useUi();
  const colors = useColors();
  const styles = useStyles();
  const [open, setOpen] = useState(false);

  const today = new Date();
  const current = fromIsoDate(value) ?? today;
  const maximumDate = allowFuture ? undefined : today;

  const onPress = () => {
    // Android pokazuje kalendarz jako okno systemowe, iOS jako element na ekranie
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: current,
        mode: "date",
        maximumDate,
        onValueChange: (_event, date) => onChange(toIsoDate(date)),
      });
    } else {
      setOpen((shown) => !shown);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={[ui.input, styles.box]}>
        <Pressable
          testID={`${testIDPrefix}-open`}
          style={ui.grow}
          onPress={onPress}
        >
          <Text style={value ? styles.value : styles.placeholder}>
            {value ? formatDisplayDate(value) : t("common.pickDate")}
          </Text>
        </Pressable>
        {clearable && value !== "" && (
          <Pressable
            testID={`${testIDPrefix}-clear`}
            accessibilityLabel={t("common.clearDate")}
            hitSlop={8}
            onPress={() => onChange("")}
          >
            <Ionicons name="close-circle" size={20} color={colors.textFaint} />
          </Pressable>
        )}
      </View>
      {open && Platform.OS !== "android" && (
        <DateTimePicker
          testID={`${testIDPrefix}-picker`}
          value={current}
          mode="date"
          display="inline"
          maximumDate={maximumDate}
          onValueChange={(_event, date) => onChange(toIsoDate(date))}
        />
      )}
    </View>
  );
}

const useStyles = createThemedStyles((c) =>
  StyleSheet.create({
    wrapper: { gap: 4 },
    box: { flexDirection: "row", alignItems: "center", gap: 8 },
    value: { fontSize: 16, color: c.text },
    placeholder: { fontSize: 16, color: c.placeholder },
  }),
);
