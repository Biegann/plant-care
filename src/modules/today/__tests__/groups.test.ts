import type { TodayTask } from "../api/todayApi";
import { groupByGarden } from "../groups";

const item = (
  id: string,
  nextDueOn: string,
  plantName: string,
  gardenId: string,
  gardenName: string,
) =>
  ({
    task: { id, nextDueOn },
    plantName,
    gardenId,
    gardenName,
  }) as TodayTask;

const ids = (tasks: TodayTask[]) => tasks.map((entry) => entry.task.id);

describe("groupByGarden", () => {
  test("brak zadań: brak grup", () => {
    expect(groupByGarden([])).toEqual([]);
  });

  test("grupuje po ogrodzie, ogrody alfabetycznie", () => {
    const groups = groupByGarden([
      item("t1", "2026-10-13", "Monstera", "g2", "Dom"),
      item("t2", "2026-10-13", "Pelargonia", "g1", "Balkon"),
      item("t3", "2026-10-13", "Fikus", "g2", "Dom"),
    ]);

    expect(groups.map((group) => group.gardenName)).toEqual(["Balkon", "Dom"]);
    expect(groups[0].gardenId).toBe("g1");
    expect(ids(groups[1].tasks)).toEqual(["t3", "t1"]);
  });

  test("w ogrodzie najpierw najdłużej zaległe, potem alfabetycznie po roślinie", () => {
    const [group] = groupByGarden([
      item("t1", "2026-10-13", "Aloes", "g1", "Dom"),
      item("t2", "2026-10-10", "Monstera", "g1", "Dom"),
      item("t3", "2026-10-13", "Fikus", "g1", "Dom"),
    ]);

    expect(ids(group.tasks)).toEqual(["t2", "t1", "t3"]);
  });

  test("ogrody o tej samej nazwie zostają osobnymi grupami", () => {
    const groups = groupByGarden([
      item("t1", "2026-10-13", "Aloes", "g1", "Dom"),
      item("t2", "2026-10-13", "Fikus", "g2", "Dom"),
    ]);

    expect(groups).toHaveLength(2);
  });
});
