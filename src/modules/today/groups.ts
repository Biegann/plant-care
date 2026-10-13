import type { TodayTask } from "./api/todayApi";

export type GardenGroup = {
  gardenId: string;
  gardenName: string;
  tasks: TodayTask[];
};

// Najpierw najdłużej zaległe, potem alfabetycznie po roślinie
const byUrgency = (a: TodayTask, b: TodayTask) =>
  a.task.nextDueOn.localeCompare(b.task.nextDueOn) ||
  a.plantName.localeCompare(b.plantName);

// Zadania pogrupowane ogrodami; ogrody alfabetycznie
export function groupByGarden(tasks: TodayTask[]): GardenGroup[] {
  const groups = new Map<string, GardenGroup>();

  for (const item of [...tasks].sort(byUrgency)) {
    const group = groups.get(item.gardenId) ?? {
      gardenId: item.gardenId,
      gardenName: item.gardenName,
      tasks: [],
    };
    group.tasks.push(item);
    groups.set(item.gardenId, group);
  }

  return [...groups.values()].sort((a, b) =>
    a.gardenName.localeCompare(b.gardenName),
  );
}
