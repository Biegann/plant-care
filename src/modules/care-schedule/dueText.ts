// Funkcja tłumacząca (i18next), przekazywana z zewnątrz
type Translate = (key: string, options?: Record<string, unknown>) => string;

// Opis terminu: days to liczba dni do terminu (0 = dziś, ujemna = po terminie)
export function dueText(days: number, t: Translate): string {
  if (days < -1) return t("care.due.overdueMany", { count: -days });
  if (days === -1) return t("care.due.overdueOne");
  if (days === 0) return t("care.due.today");
  if (days === 1) return t("care.due.tomorrow");
  return t("care.due.inDays", { count: days });
}
