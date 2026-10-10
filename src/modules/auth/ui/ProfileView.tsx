import { useTranslation } from "react-i18next";
import { Pressable, Text } from "react-native";
import { Screen } from "../../../shared/ui/Screen";
import { ui } from "../../../shared/ui/styles";
import { signOut } from "../api/authApi";
import { useSession } from "../hooks/useSession";

export function ProfileView() {
  const { t } = useTranslation();
  const session = useSession();

  return (
    <Screen>
      <Text style={ui.title}>{t("profile.title")}</Text>
      <Text style={ui.subtitle}>{t("profile.signedInAs")}</Text>
      <Text testID="profile-email">{session?.user.email}</Text>
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
