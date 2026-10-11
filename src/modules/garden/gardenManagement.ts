import { queryClient } from "../../shared/api/queryClient";
import {
    deleteGarden,
    leaveGarden,
    removeMember,
    renameGarden,
    type GardenResult,
} from "./api/gardenApi";
import { useGardenStore } from "./store/gardenStore";

const refreshGardens = () =>
  queryClient.invalidateQueries({ queryKey: ["gardens"] });
const refreshMembers = (gardenId: string) =>
  queryClient.invalidateQueries({ queryKey: ["garden-members", gardenId] });

function forgetIfActive(gardenId: string) {
  const store = useGardenStore.getState();
  if (store.activeGardenId === gardenId) store.setActiveGardenId(null);
}

export async function renameAndRefresh(
  gardenId: string,
  name: string,
): Promise<GardenResult> {
  const result = await renameGarden(gardenId, name);
  if (result.ok) await refreshGardens();
  return result;
}

export async function deleteAndRefresh(
  gardenId: string,
): Promise<GardenResult> {
  const result = await deleteGarden(gardenId);
  if (result.ok) {
    forgetIfActive(gardenId);
    await refreshGardens();
  }
  return result;
}

export async function leaveAndRefresh(gardenId: string): Promise<GardenResult> {
  const result = await leaveGarden(gardenId);
  if (result.ok) {
    forgetIfActive(gardenId);
    await refreshGardens();
  }
  return result;
}

export async function removeMemberAndRefresh(
  gardenId: string,
  userId: string,
): Promise<GardenResult> {
  const result = await removeMember(gardenId, userId);
  if (result.ok) await refreshMembers(gardenId);
  return result;
}
