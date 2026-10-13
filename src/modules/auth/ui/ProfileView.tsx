import { useTranslation } from "react-i18next";
import { Pressable, Text } from "react-native";
import { NotificationSettings } from "../../notifications/ui/NotificationSettings";
import { ThemeSettings } from "../../theme/ui/ThemeSettings";
import { Screen } from "../../../shared/ui/Screen";
import { useUi } from "../../../shared/ui/styles";
import { signOut } from "../api/authApi";
import { useSession } from "../hooks/useSession";

export function ProfileView() {
  const { t } = useTranslation();
  const session = useSession();
  const ui = useUi();

  return (
    <Screen>
      <Text style={ui.title}>{t("profile.title")}</Text>
      <Text style={ui.subtitle}>{t("profile.signedInAs")}</Text>
      <Text testID="profile-email" style={ui.text}>
        {session?.user.email}
      </Text>
      <NotificationSettings />
      <ThemeSettings />
      <Pressable
        testID="logout-button"
        style={ui.button}
        onPress={() => signOut()}
      >
        <Text style={ui.buttonText}>{t("auth.logout")}</Text>
      </Pressable>
    </Screen>
  );
}
