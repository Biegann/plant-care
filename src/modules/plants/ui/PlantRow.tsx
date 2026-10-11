import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Plant } from "../api/plantsApi";
import { usePlantPhotoUrl } from "../hooks/usePlantPhotoUrl";

type Props = { plant: Plant; onPress: () => void };

export function PlantRow({ plant, onPress }: Props) {
  const photoUrl = usePlantPhotoUrl(plant.photoPath);
  const subtitle = [plant.speciesName, plant.locationNote]
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
          <Ionicons name="leaf" size={20} color="#2e7d32" />
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
      <Ionicons name="chevron-forward" size={18} color="#999" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  thumb: { width: 40, height: 40, borderRadius: 8 },
  thumbEmpty: {
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600" },
  subtitle: { fontSize: 12, color: "#666" },
});
