import { getDb } from "../db";

type HistoryRow = {
  total: number;
  lastEntryAt: Date | null;
  peaks: { weekday: number; hour: number; count: number }[];
};

export function listHistoryUnits() {
  return getDb().unidade.findMany({
    select: { id: true, nome: true, fuso: true },
    orderBy: { nome: "asc" },
  });
}

export async function findPlateHistory(unitId: string, plate: string, start?: string, end?: string) {
  const [result] = await getDb().$queryRaw<HistoryRow[]>`
    WITH selected_unit AS (
      SELECT id, fuso FROM unidades WHERE id = ${unitId}::uuid
    ), matching AS (
      SELECT v.entrada_em, v.entrada_em AT TIME ZONE u.fuso AS local_entry
      FROM visitas v JOIN selected_unit u ON u.id = v.unidade_id
      WHERE v.placa = ${plate}
        AND v.status = 'encerrada'
        AND (${start ?? null}::date IS NULL OR v.entrada_em >= (${start ?? null}::date::timestamp AT TIME ZONE u.fuso))
        AND (${end ?? null}::date IS NULL OR v.entrada_em < ((${end ?? null}::date + 1)::timestamp AT TIME ZONE u.fuso))
    ), counts AS (
      SELECT EXTRACT(ISODOW FROM local_entry)::int AS weekday,
             EXTRACT(HOUR FROM local_entry)::int AS hour,
             COUNT(*)::int AS count
      FROM matching GROUP BY 1, 2
    )
    SELECT (SELECT COUNT(*)::int FROM matching) AS total,
           (SELECT MAX(entrada_em) FROM matching) AS "lastEntryAt",
           COALESCE((SELECT jsonb_agg(to_jsonb(c) ORDER BY weekday, hour) FROM counts c
                     WHERE c.count = (SELECT MAX(count) FROM counts)), '[]'::jsonb) AS peaks
    FROM selected_unit
  `;
  return result ?? null;
}
