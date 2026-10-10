import { queryClient } from "../../shared/api/queryClient";
import { createGarden, joinGarden, type GardenResult } from "./api/gardenApi";
import { useGardenStore } from "./store/gardenStore";

async function activate(gardenId: string) {
  useGardenStore.getState().setActiveGardenId(gardenId);
  await queryClient.invalidateQueries({ queryKey: ["gardens"] });
}

export async function createAndActivate(
  name: string,
): Promise<GardenResult<string>> {
  const result = await createGarden(name);
  if (result.ok) await activate(result.data);
  return result;
}

export async function joinAndActivate(
  code: string,
): Promise<GardenResult<string>> {
  const result = await joinGarden(code);
  if (result.ok) await activate(result.data);
  return result;
}
