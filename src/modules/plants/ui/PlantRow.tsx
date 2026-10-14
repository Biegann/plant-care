import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Plant } from "../api/plantsApi";
import { usePlantPhotoUrl } from "../hooks/usePlantPhotoUrl";
import { createThemedStyles, useColors } from "../../../shared/ui/theme";
import {
  speciesLabel,
  useSpeciesLanguage,
} from "../../species/useSpeciesLanguage";

type Props = {
  plant: Plant;
  // Czy roślina ma zadanie opieki na dziś lub po terminie
  needsCare?: boolean;
  onPress: () => void;
};

export function PlantRow({ plant, needsCare = false, onPress }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useStyles();
  const photoUrl = usePlantPhotoUrl(plant.photoPath);
  const language = useSpeciesLanguage();
  const subtitle = [speciesLabel(plant, language), plant.locationNote]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable
      testID={`plant-${plant.id}`}
      style={styles.row}
      onPress={onPress}
    >
      {photoUrl ? (
        <Image
          testID={`plant-photo-${plant.id}`}
          source={{ uri: photoUrl }}
          style={styles.thumb}
        />
      ) : (
        <View style={[styles.thumb, styles.thumbEmpty]}>
          <Ionicons name="leaf" size={20} color={colors.primary} />
        </View>
      )}
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {plant.name}
        </Text>
        {subtitle !== "" && (
          <Text
            testID={`plant-subtitle-${plant.id}`}
            style={styles.subtitle}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {needsCare && (
        <View
          testID={`plant-care-marker-${plant.id}`}
          accessibilityLabel={t("care.needsCare")}
        >
          <Ionicons name="alert-circle" size={18} color={colors.warning} />
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const useStyles = createThemedStyles((c) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    thumb: { width: 40, height: 40, borderRadius: 8 },
    thumbEmpty: {
      backgroundColor: c.primaryTint,
      alignItems: "center",
      justifyContent: "center",
    },
    text: { flex: 1 },
    name: { fontSize: 15, fontWeight: "600", color: c.text },
    subtitle: { fontSize: 12, color: c.textMuted },
  }),
);
