import { requireOptionalNativeModule } from "expo";

// Lokalny moduł natywny (tylko Android): pozwolenie "Alarmy i przypomnienia"
type ExactAlarmNative = {
  canScheduleExactAlarms(): boolean;
  openExactAlarmSettings(): boolean;
};

// Na iOS i w testach modułu nie ma: wtedy udajemy, że pozwolenie jest
const native = requireOptionalNativeModule<ExactAlarmNative>("ExactAlarm");

export function canScheduleExactAlarms(): boolean {
  return native?.canScheduleExactAlarms() ?? true;
}

export function openExactAlarmSettings(): boolean {
  return native?.openExactAlarmSettings() ?? false;
}
