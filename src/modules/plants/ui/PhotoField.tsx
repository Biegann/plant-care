import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ActionSheet, type SheetAction } from "../../../shared/ui/ActionSheet";
import { useUi } from "../../../shared/ui/styles";
import { createThemedStyles, useColors } from "../../../shared/ui/theme";
import { pickPhoto, type PhotoSource, type PickedPhoto } from "../pickPhoto";

type Props = {
  // Adres zdjęcia do pokazania albo null, gdy roślina nie ma zdjęcia
  previewUri: string | null;
  onPicked: (photo: PickedPhoto) => void;
  onRemoved: () => void;
  // false: bez kadrowania do kwadratu (dziennik); podgląd i tak jest kwadratowy
  square?: boolean;
};

export function PhotoField({
  previewUri,
  onPicked,
  onRemoved,
  square = true,
}: Props) {
  const { t } = useTranslation();
  const ui = useUi();
  const colors = useColors();
  const styles = useStyles();
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<"cameraDenied" | "failed" | null>(
    null,
  );

  const pick = async (source: PhotoSource) => {
    setMenuOpen(false);
    setErrorKey(null);
    setBusy(true);
    const result = await pickPhoto(source, { square });
    setBusy(false);

    if (result.status === "picked") onPicked(result.photo);
    else if (result.status === "denied") setErrorKey("cameraDenied");
    else if (result.status === "failed") setErrorKey("failed");
  };

  const remove = () => {
    setMenuOpen(false);
    setErrorKey(null);
    onRemoved();
  };

  const actions: SheetAction[] = [
    {
      key: "take",
      label: t("plants.photo.take"),
      onPress: () => pick("camera"),
    },
    {
      key: "choose",
      label: t("plants.photo.choose"),
      onPress: () => pick("gallery"),
    },
  ];
  if (previewUri) {
    actions.push({
      key: "remove",
      label: t("plants.photo.remove"),
      onPress: remove,
      danger: true,
    });
  }

  return (
    <View style={styles.wrapper}>
      <Pressable
        testID="plant-photo-field"
        accessibilityLabel={t(
          previewUri ? "plants.photo.change" : "plants.photo.add",
        )}
        style={styles.tile}
        onPress={() => setMenuOpen(true)}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color={colors.primary} />
        ) : previewUri ? (
          <Image
            testID="plant-photo-preview"
            source={{ uri: previewUri }}
            style={styles.image}
          />
        ) : (
          <>
            <Ionicons name="camera-outline" size={28} color={colors.primary} />
            <Text style={styles.hint}>{t("plants.photo.add")}</Text>
          </>
        )}
      </Pressable>
      {errorKey && (
        <Text style={ui.error}>{t(`plants.photo.${errorKey}`)}</Text>
      )}
      <ActionSheet
        visible={menuOpen}
        actions={actions}
        cancelLabel={t("plants.photo.cancel")}
        onClose={() => setMenuOpen(false)}
      />
    </View>
  );
}

const useStyles = createThemedStyles((c) =>
  StyleSheet.create({
    wrapper: { alignItems: "center", gap: 6 },
    tile: {
      width: 128,
      height: 128,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.inputBorder,
      backgroundColor: c.surfaceActive,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      overflow: "hidden",
    },
    image: { width: "100%", height: "100%" },
    hint: { fontSize: 13, color: c.primary },
  }),
);
