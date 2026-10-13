import { queryClient } from "../../shared/api/queryClient";
import { syncNotifications } from "../notifications/sync";
import {
    createPlant,
    deletePlant,
    updatePlant,
    type PhotoChange,
    type Plant,
    type PlantResult,
    type PlantSaved,
} from "./api/plantsApi";
import type { PlantInput } from "./validation";

const refreshPlants = (gardenId: string) =>
  queryClient.invalidateQueries({ queryKey: ["plants", gardenId] });

export async function createPlantAndRefresh(
  gardenId: string,
  input: PlantInput,
  photo?: ArrayBuffer,
): Promise<PlantResult<PlantSaved>> {
  const result = await createPlant(gardenId, input, photo);
  if (result.ok) await refreshPlants(gardenId);
  return result;
}

export async function updatePlantAndRefresh(
  plant: Plant,
  input: PlantInput,
  photo: PhotoChange,
): Promise<PlantResult<PlantSaved>> {
  const result = await updatePlant(plant, input, photo);
  if (result.ok) {
    // Nazwa rośliny jest w treści powiadomień
    void syncNotifications();
    await refreshPlants(plant.gardenId);
  }
  return result;
}

export async function deletePlantAndRefresh(
  plant: Plant,
): Promise<PlantResult> {
  const result = await deletePlant(plant);
  if (result.ok) {
    // Razem z rośliną znikają jej zadania
    void syncNotifications();
    await refreshPlants(plant.gardenId);
  }
  return result;
}
