import { describe, expect, it } from "vitest";
import { sortReservations } from "../lib/reservations/order";

const reservations = [
  { id: "b", plate: "XYZ1234", enteredAt: "2026-11-20T12:00:00Z" },
  { id: "a", plate: "ABC1234", enteredAt: "2026-11-20T10:00:00Z" },
  { id: "c", plate: "DEF1234", enteredAt: "2026-11-20T11:00:00Z" },
];

describe("reservation ordering", () => {
  it.each([
    ["oldest", ["a", "c", "b"]],
    ["newest", ["b", "c", "a"]],
    ["plate-asc", ["a", "c", "b"]],
    ["plate-desc", ["b", "c", "a"]],
  ] as const)("orders reservations by %s without changing the source", (order, expected) => {
    expect(sortReservations(reservations, order).map(({ id }) => id)).toEqual(expected);
    expect(reservations.map(({ id }) => id)).toEqual(["b", "a", "c"]);
  });

  it("breaks equal timestamp ties consistently by id", () => {
    const tied = [reservations[0], { ...reservations[0], id: "a" }];
    expect(sortReservations(tied, "oldest").map(({ id }) => id)).toEqual(["a", "b"]);
  });

  it("handles an empty list", () => {
    expect(sortReservations([], "oldest")).toEqual([]);
  });
});
