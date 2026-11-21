import { unitInputSchema } from "../../../lib/operations/contracts";
import { getOperations, readInput, withOperator } from "../../../lib/operations/http";

export function GET(request: Request) {
  return withOperator(request, async () => Response.json({ units: await getOperations().listUnits() }));
}

export function POST(request: Request) {
  return withOperator(request, async () => {
    const input = await readInput(request, unitInputSchema, "Informe um nome e um fuso horário válidos.");
    const unit = await getOperations().createUnit(input);
    return Response.json({ unit }, { status: 201 });
  });
}
