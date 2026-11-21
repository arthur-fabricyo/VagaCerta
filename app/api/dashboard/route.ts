import { DashboardRepository } from "@/lib/dashboard/dashboard-repository";
import { DashboardService } from "@/lib/dashboard/dashboard-service";
import { getDb } from "@/lib/db";
import { parseId, withOperator } from "@/lib/operations/http";

export function GET(request: Request) {
  return withOperator(request, async () => {
    const units = new URL(request.url).searchParams.getAll("unitId");
    const unitId = parseId(units.length === 1 ? units[0] : "");
    const service = new DashboardService(new DashboardRepository(getDb()));
    return Response.json(await service.getSummary(unitId), {
      headers: { "Cache-Control": "no-store" },
    });
  });
}
