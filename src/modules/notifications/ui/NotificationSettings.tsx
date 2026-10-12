import DateTimePicker, {
    DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    AppState,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";
import { ui } from "../../../shared/ui/styles";
import { getPermissionState, requestPermission } from "../scheduler";
import { useNotificationStore } from "../store/notificationStore";
import { syncNotifications } from "../sync";

const pad = (value: number) => String(value).padStart(2, "0");

// Sekcja "Powiadomienia" w Profilu: włącznik codziennego przypomnienia i jego godzina
export function NotificationSettings() {
  const { t } = useTranslation();
  const { enabled, hour, minute, hydrated, setEnabled, setTime } =
    useNotificationStore();
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Zgodę można cofnąć w ustawieniach telefonu już po włączeniu przypomnienia
  useEffect(() => {
    if (!hydrated || !enabled) return;
    let active = true;
    getPermissionState().then((state) => {
      if (active) setDenied(state !== "granted");
    });
    return () => {
      active = false;
    };
  }, [hydrated, enabled]);

  const resync = async () => {
    const outcome = await syncNotifications();
    setFailed(outcome === "failed");
    setDenied(outcome === "noPermission");
  };

  const apply = async (next: boolean) => {
    setDenied(false);
    setEnabled(next);
    await resync();
  };

  const toggle = async (next: boolean) => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    if (next) {
      const state = await requestPermission(t("notifications.channelName"));
      if (state !== "granted") {
        setDenied(true);
        setBusy(false);
        return;
      }
    }
    await apply(next);
    setBusy(false);
  };

  // Po powrocie z ustawień telefonu sprawdzamy zgodę ponownie i kończymy włączanie
  useEffect(() => {
    if (!denied) return;
    const subscription = AppState.addEventListener("change", async (status) => {
      if (status !== "active") return;
      if ((await getPermissionState()) !== "granted") return;
      setBusy(true);
      await apply(true);
      setBusy(false);
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nasłuch zależy tylko od widoczności komunikatu
  }, [denied]);

  const changeTime = async (date: Date) => {
    setTime(date.getHours(), date.getMinutes());
    setBusy(true);
    await resync();
    setBusy(false);
  };

  const current = new Date();
  current.setHours(hour, minute, 0, 0);

  const openPicker = () => {
    // Android pokazuje zegar jako okno systemowe, iOS jako element na ekranie
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: current,
        mode: "time",
        is24Hour: true,
        onValueChange: (_event, date) => changeTime(date),
      });
    } else {
      setPickerOpen((shown) => !shown);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={ui.sectionTitle}>{t("notifications.sectionTitle")}</Text>

      <View style={ui.row}>
        <Text style={[styles.label, ui.grow]}>{t("notifications.daily")}</Text>
        <Switch
          testID="notifications-switch"
          value={enabled}
          onValueChange={toggle}
          disabled={!hydrated || busy}
          trackColor={{ true: "#a5d6a7" }}
          thumbColor={enabled ? "#2e7d32" : undefined}
        />
      </View>

      {enabled && (
        <Pressable
          testID="notifications-time"
          style={ui.row}
          onPress={openPicker}
          disabled={busy}
        >
          <Text style={[styles.label, ui.grow]}>{t("notifications.time")}</Text>
          <Text style={ui.link}>{`${pad(hour)}:${pad(minute)}`}</Text>
        </Pressable>
      )}
      {enabled && pickerOpen && Platform.OS !== "android" && (
        <DateTimePicker
          testID="notifications-picker"
          value={current}
          mode="time"
          display="spinner"
          onValueChange={(_event, date) => changeTime(date)}
        />
      )}

      {denied && (
        <View style={styles.hint}>
          <Text style={ui.error}>{t("notifications.denied")}</Text>
          <Pressable
            testID="notifications-open-settings"
            hitSlop={8}
            onPress={() => Linking.openSettings()}
          >
            <Text style={ui.link}>{t("notifications.openSettings")}</Text>
          </Pressable>
        </View>
      )}
      {failed && <Text style={ui.error}>{t("notifications.failed")}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 4 },
  label: { fontSize: 16 },
  hint: { gap: 4 },
});
