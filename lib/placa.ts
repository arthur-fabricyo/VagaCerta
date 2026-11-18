import { z } from "zod";

export const placaSchema = z.string()
  .transform((placa) => placa.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}$/, "Informe uma placa brasileira válida."))
  .transform((placa) => placa.toUpperCase());
