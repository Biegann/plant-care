import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { TextField } from "../../../shared/ui/TextField";
import { useUi } from "../../../shared/ui/styles";
import { useColors } from "../../../shared/ui/theme";
import { createAndActivate } from "../gardenActions";
import { isValidGardenName } from "../validation";

export function CreateGardenForm() {
  const { t } = useTranslation();
  const ui = useUi();
  const colors = useColors();
  const router = useRouter();

  const [name, setName] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (loading) return;
    if (!isValidGardenName(name)) {
      setErrorKey("invalidName");
      return;
    }

    setErrorKey(null);
    setLoading(true);
    const result = await createAndActivate(name);
    setLoading(false);

    if (result.ok) router.back();
    else setErrorKey(result.error);
  };

  return (
    <View style={ui.screen}>
      <Text style={ui.subtitle}>{t("gardens.nameHint")}</Text>
      <TextField
        testID="garden-name-input"
        style={ui.input}
        placeholder={t("gardens.namePlaceholder")}
        maxLength={60}
        value={name}
        onChangeText={setName}
      />
      {errorKey && (
        <Text style={ui.error}>{t(`gardens.errors.${errorKey}`)}</Text>
      )}
      <Pressable
        testID="create-garden-submit"
        style={[ui.button, loading && ui.buttonDisabled]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={ui.buttonText}>{t("gardens.create")}</Text>
        )}
      </Pressable>
    </View>
  );
}
