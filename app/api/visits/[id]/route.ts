import { visitActionSchema } from "../../../../lib/operations/contracts";
import { getOperations, parseId, readInput, withOperator } from "../../../../lib/operations/http";

type VisitRouteContext = { params: Promise<{ id: string }> };

export function GET(request: Request, { params }: VisitRouteContext) {
  return withOperator(request, async () => {
    const id = parseId((await params).id);
    return Response.json({ visit: await getOperations().getVisit(id) });
  });
}

export function PATCH(request: Request, { params }: VisitRouteContext) {
  return withOperator(request, async (operatorId) => {
    const id = parseId((await params).id);
    const { action } = await readInput(request, visitActionSchema, "Escolha registrar a saída ou cancelar a visita.");
    const visit = await getOperations().changeVisit(id, action, operatorId);
    return Response.json({ visit });
  });
}
