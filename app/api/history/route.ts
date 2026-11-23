import { getPlateHistory } from "../../../lib/history/history-service";
import { withOperator } from "../../../lib/operations/http";

export async function GET(request: Request) {
  return withOperator(request, async () => {
    const params = new URL(request.url).searchParams;
    const result = await getPlateHistory({
      unitId: params.get("unitId"),
      plate: params.get("plate"),
      start: params.get("start") || undefined,
      end: params.get("end") || undefined,
    });

    if (result.status === "invalid") {
      return Response.json({ error: "Confira a unidade, a placa e o período." }, { status: 400 });
    }
    if (result.status === "missing") {
      return Response.json({ error: "Unidade não encontrada." }, { status: 404 });
    }
    return Response.json({ history: result.history });
  });
}
