import type { PrismaClient } from "@/generated/prisma/client";
import type { HourlyMovement } from "./dashboard-contract";

type MovementRow = Omit<HourlyMovement, "hour"> & {
  hour: number | null;
  localDate: string;
  timeZone: string;
  vehiclesOnSite: number;
};

export class DashboardRepository {
  constructor(private readonly database: PrismaClient) {}

  readMovement(unitId: string, referenceTime: Date) {
    return this.database.$queryRaw<MovementRow[]>`
      WITH unit_day AS (
        SELECT id, fuso, (${referenceTime}::timestamptz AT TIME ZONE fuso)::date AS local_day
        FROM unidades
        WHERE id = ${unitId}::uuid
      ), bounds AS (
        -- Filter by the local date after bounding the UTC scan to handle offset changes at midnight.
        SELECT *, (local_day - 1)::timestamp AT TIME ZONE 'UTC' AS starts_at,
          (local_day + 2)::timestamp AT TIME ZONE 'UTC' AS ends_at
        FROM unit_day
      ), movement AS (
        SELECT EXTRACT(HOUR FROM v.entrada_em AT TIME ZONE u.fuso)::int AS hour,
          true AS is_entry
        FROM bounds u JOIN visitas v ON v.unidade_id = u.id
        WHERE v.status IN ('aberta', 'encerrada')
          AND v.entrada_em >= u.starts_at AND v.entrada_em < u.ends_at
          AND (v.entrada_em AT TIME ZONE u.fuso)::date = u.local_day
        UNION ALL
        SELECT EXTRACT(HOUR FROM v.saida_em AT TIME ZONE u.fuso)::int, false
        FROM bounds u JOIN visitas v ON v.unidade_id = u.id
        WHERE v.status = 'encerrada'
          AND v.saida_em >= u.starts_at AND v.saida_em < u.ends_at
          AND (v.saida_em AT TIME ZONE u.fuso)::date = u.local_day
      ), hourly AS (
        SELECT hour, COUNT(*) FILTER (WHERE is_entry)::int AS entries,
          COUNT(*) FILTER (WHERE NOT is_entry)::int AS exits
        FROM movement
        GROUP BY hour
      ), current_yard AS (
        SELECT COUNT(*)::int AS vehicles
        FROM unit_day u JOIN visitas v ON v.unidade_id = u.id
        WHERE v.status = 'aberta'
      )
      SELECT u.local_day::text AS "localDate", u.fuso AS "timeZone",
        y.vehicles AS "vehiclesOnSite", h.hour, COALESCE(h.entries, 0) AS entries,
        COALESCE(h.exits, 0) AS exits
      FROM unit_day u CROSS JOIN current_yard y LEFT JOIN hourly h ON true
    `;
  }
}
