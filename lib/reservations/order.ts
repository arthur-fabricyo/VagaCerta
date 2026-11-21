export type ReservationOrder = "oldest" | "newest" | "plate-asc" | "plate-desc";

type ReservationSummary = { id: string; plate: string; enteredAt: string };

export function sortReservations<T extends ReservationSummary>(reservations: readonly T[], order: ReservationOrder): T[] {
  return [...reservations].sort((first, second) => {
    const difference = order === "plate-asc" || order === "plate-desc"
      ? first.plate.localeCompare(second.plate, "pt-BR") * (order === "plate-desc" ? -1 : 1)
      : (Date.parse(first.enteredAt) - Date.parse(second.enteredAt)) * (order === "newest" ? -1 : 1);
    return difference || first.id.localeCompare(second.id);
  });
}
