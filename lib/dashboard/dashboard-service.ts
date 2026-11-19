import { OperationError } from "@/lib/operations/contracts";
import type { DashboardSummary } from "./dashboard-contract";
import type { DashboardRepository } from "./dashboard-repository";

export class DashboardService {
  constructor(private readonly repository: Pick<DashboardRepository, "readMovement">) {}

  async getSummary(unitId: string, referenceTime = new Date()): Promise<DashboardSummary> {
    const rows = await this.repository.readMovement(unitId, referenceTime);
    const first = rows[0];
    if (!first) throw new OperationError("missing", "Unidade não encontrada.");

    const movementByHour = new Map(rows.map((row) => [row.hour, row]));
    const hourly = Array.from({ length: 24 }, (_, hour) => {
      const movement = movementByHour.get(hour);
      return { hour, entries: movement?.entries ?? 0, exits: movement?.exits ?? 0 };
    });

    return {
      unitId,
      localDate: first.localDate,
      timeZone: first.timeZone,
      vehiclesOnSite: first.vehiclesOnSite,
      entriesToday: hourly.reduce((total, hour) => total + hour.entries, 0),
      exitsToday: hourly.reduce((total, hour) => total + hour.exits, 0),
      hourly,
    };
  }
}
