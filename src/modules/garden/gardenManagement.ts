import { queryClient } from "../../shared/api/queryClient";
import { syncNotifications } from "../notifications/sync";
import {
    deleteGarden,
    leaveGarden,
    removeMember,
    renameGarden,
    transferOwnership,
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

// Ogród zniknął z konta: sprzątamy wybór, listę i plan powiadomień
// (zadania z tego ogrodu nie mają już przypominać)
async function afterGardenGone(gardenId: string) {
  forgetIfActive(gardenId);
  await refreshGardens();
  void syncNotifications();
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
  if (result.ok) await afterGardenGone(gardenId);
  return result;
}

export async function leaveAndRefresh(gardenId: string): Promise<GardenResult> {
  const result = await leaveGarden(gardenId);
  if (result.ok) await afterGardenGone(gardenId);
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

// Zmieniają się role obu osób, więc odświeżamy i listę ogrodów (moja rola),
// i listę członków
export async function transferAndRefresh(
  gardenId: string,
  newOwnerId: string,
): Promise<GardenResult> {
  const result = await transferOwnership(gardenId, newOwnerId);
  if (result.ok)
    await Promise.all([refreshGardens(), refreshMembers(gardenId)]);
  return result;
}
