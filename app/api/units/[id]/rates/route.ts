import { rateInputSchema } from "../../../../../lib/operations/contracts";
import { getOperations, parseId, readInput, withOperator } from "../../../../../lib/operations/http";

export function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withOperator(request, async () => {
    const unitId = parseId((await params).id);
    const input = await readInput(request, rateInputSchema, "Confira o preço, o modo de cobrança e a tolerância.");
    const rate = await getOperations().publishRate(unitId, input);
    return Response.json({ rate }, { status: 201 });
  });
}
