package expo.modules.exactalarm

import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Pozwolenie "Alarmy i przypomnienia" (SCHEDULE_EXACT_ALARM): bez niego Android
// dostarcza zaplanowane powiadomienia z opóźnieniem nawet do godziny.
// expo-notifications samo używa dokładnych alarmów, gdy pozwolenie jest
class ExactAlarmModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExactAlarm")

    Function("canScheduleExactAlarms") {
      // Przed Androidem 12 dokładne alarmy nie wymagają pozwolenia
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return@Function true
      val context = appContext.reactContext ?: return@Function true
      val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      alarmManager.canScheduleExactAlarms()
    }

    // Otwiera ekran ustawień z przełącznikiem dla tej aplikacji
    Function("openExactAlarmSettings") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return@Function false
      val context = appContext.reactContext ?: return@Function false
      val intent = Intent(
        Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
        Uri.parse("package:${context.packageName}")
      ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      true
    }
  }
}
