import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { config } from "dotenv";
import pg from "pg";

config({ path: [".env.local", ".env"], quiet: true });
const { BETTER_AUTH_URL, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = process.env;
assert.ok(BETTER_AUTH_URL && SEED_ADMIN_EMAIL && SEED_ADMIN_PASSWORD,
  "Start the application with a dedicated test database and a seeded operator.");
const origin = new URL(BETTER_AUTH_URL).origin;

async function request(path, { method = "GET", body, cookie, status, from = origin } = {}) {
  const response = await fetch(new URL(path, origin), {
    method,
    headers: {
      ...(cookie && { cookie }),
      ...(method !== "GET" && { origin: from }),
      ...(body && { "content-type": "application/json" }),
    },
    body: body && JSON.stringify(body),
    redirect: "manual",
  });
  if (status !== undefined) {
    assert.equal(response.status, status, `${method} ${path}: ${await response.clone().text()}`);
  }
  return response;
}

function sessionCookie(response) {
  const cookies = response.headers.getSetCookie();
  assert.ok(cookies.length > 0);
  return cookies.map((cookie) => cookie.split(";", 1)[0]).join("; ");
}

test("dashboard counts visits by unit and by the unit's local day", async () => {
  const unitId = randomUUID();
  const emptyUnitId = randomUUID();
  const tariffId = randomUUID();
  const dashboardPath = (id) => `/api/dashboard?unitId=${id}`;
  await request(dashboardPath(unitId), { status: 401 });
  const operator = await request("/api/auth/sign-in/email", {
    method: "POST", status: 200, body: { email: SEED_ADMIN_EMAIL, password: SEED_ADMIN_PASSWORD },
  });
  const cookie = sessionCookie(operator);
  await request(dashboardPath("invalid"), { cookie, status: 400 });
  await request(`${dashboardPath(unitId)}&unitId=${unitId}`, { cookie, status: 400 });
  await request(dashboardPath(unitId), { cookie, status: 404 });

  const database = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await database.connect();
  try {
    await database.query(`
      INSERT INTO unidades (id, nome, fuso)
      VALUES ($1::uuid, $1::uuid::text, 'Pacific/Kiritimati'), ($2::uuid, $2::uuid::text, 'Pacific/Honolulu')
    `, [unitId, emptyUnitId]);
    await database.query(`
      INSERT INTO tarifas (id, unidade_id, modo, preco_centavos)
      VALUES ($1, $2, 'proporcional', 800)
    `, [tariffId, unitId]);
    const { rows: [day] } = await database.query(`
      SELECT (now() AT TIME ZONE fuso)::date::text AS today,
        ((now() AT TIME ZONE fuso)::date - 1)::text AS yesterday
      FROM unidades WHERE id = $1
    `, [unitId]);
    await database.query(`
      WITH fixture (plate, status, entry_offset, exit_offset) AS (
        VALUES
          ('KPI1A01', 'aberta', interval '0 hours', NULL),
          ('KPI1A02', 'aberta', interval '-1 hour', NULL),
          ('KPI1A03', 'encerrada', interval '3 hours', interval '4 hours'),
          ('KPI1A04', 'encerrada', interval '-1 hour', interval '1 hour'),
          ('KPI1A05', 'cancelada', interval '2 hours', NULL),
          ('KPI1A06', 'encerrada', interval '23 hours', interval '24 hours'),
          ('KPI1A07', 'encerrada', interval '24 hours', interval '25 hours')
      ), unit_day AS (
        SELECT id, $3::date::timestamp AT TIME ZONE fuso AS midnight FROM unidades WHERE id = $1
      )
      INSERT INTO visitas (unidade_id, tarifa_id, placa, status, entrada_em, saida_em,
        operador_entrada_id, operador_saida_id, duracao_seg, cobravel_seg, valor_centavos)
      SELECT u.id, $2, f.plate, f.status, u.midnight + f.entry_offset,
        u.midnight + f.exit_offset, o.id, CASE WHEN f.exit_offset IS NOT NULL THEN o.id END,
        EXTRACT(EPOCH FROM f.exit_offset - f.entry_offset),
        EXTRACT(EPOCH FROM f.exit_offset - f.entry_offset),
        CASE WHEN f.exit_offset IS NOT NULL THEN 800 END
      FROM fixture f CROSS JOIN unit_day u CROSS JOIN "user" o
      WHERE o.email = $4
    `, [unitId, tariffId, day.today, SEED_ADMIN_EMAIL.trim().toLowerCase()]);

    const summary = await (await request(dashboardPath(unitId), { cookie, status: 200 })).json();
    assert.equal(summary.localDate, day.today);
    assert.equal(summary.vehiclesOnSite, 2);
    assert.equal(summary.entriesToday, 3);
    assert.equal(summary.exitsToday, 2);
    assert.equal(summary.hourly.length, 24);
    assert.deepEqual(summary.hourly.filter(({ entries, exits }) => entries || exits), [
      { hour: 0, entries: 1, exits: 0 },
      { hour: 1, entries: 0, exits: 1 },
      { hour: 3, entries: 1, exits: 0 },
      { hour: 4, entries: 0, exits: 1 },
      { hour: 23, entries: 1, exits: 0 },
    ]);
    const empty = await (await request(dashboardPath(emptyUnitId), { cookie, status: 200 })).json();
    assert.equal(empty.localDate, day.yesterday);
    assert.equal(empty.vehiclesOnSite, 0);
    assert.equal(empty.entriesToday, 0);
    assert.equal(empty.exitsToday, 0);
    assert.equal(empty.hourly.length, 24);
    assert.ok(empty.hourly.every(({ entries, exits }) => entries === 0 && exits === 0));
  } finally {
    try {
      await database.query("DELETE FROM visitas WHERE unidade_id = $1", [unitId]);
      await database.query("DELETE FROM tarifas WHERE id = $1", [tariffId]);
      await database.query("DELETE FROM unidades WHERE id IN ($1, $2)", [unitId, emptyUnitId]);
    } finally {
      await database.end();
    }
  }
});

test("manual visit workflow preserves rates and handles concurrent entry and exit", async () => {
  await request("/api/units", { status: 401 });
  await request("/api/history", { status: 401 });
  await request("/api/visits", { status: 401 });
  const operator = await request("/api/auth/sign-in/email", {
    method: "POST", status: 200, body: { email: SEED_ADMIN_EMAIL, password: SEED_ADMIN_PASSWORD },
  });
  const cookie = sessionCookie(operator);
  const name = `Test ${randomUUID()}`;
  const unitData = { name, timeZone: "America/Sao_Paulo" };
  await request("/api/units", { method: "POST", body: unitData, cookie, status: 403, from: "https://other.example" });
  const unitResponse = await request("/api/units", { method: "POST", body: unitData, cookie, status: 201 });
  const { unit } = await unitResponse.json();
  const ratePath = `/api/units/${unit.id}/rates`;
  const rate = { mode: "blocks", blockMinutes: 60, priceCents: 800, graceMinutes: 0, graceMode: "charge_total" };
  const enter = (plate, status) => request("/api/visits", { method: "POST", cookie, status, body: { unitId: unit.id, plate } });

  await enter("invalid", 400);
  await enter("abc-1d23", 409);
  const initialRate = (await (await request(ratePath, { method: "POST", cookie, body: rate, status: 201 })).json()).rate;
  const entries = await Promise.all([enter("abc-1d23"), enter("ABC1D23")]);
  assert.deepEqual(entries.map(({ status }) => status).sort(), [200, 201]);
  const [first, second] = await Promise.all(entries.map((response) => response.json()));
  assert.equal(first.visit.id, second.visit.id);
  assert.notEqual(first.duplicate, second.duplicate);
  const visitId = first.visit.id;
  await request(`/api/visits?unitId=${unit.id}`, { cookie, status: 200 });
  await request(ratePath, { method: "POST", cookie, body: { ...rate, priceCents: 990 }, status: 201 });
  const change = (id, action, status) => request(`/api/visits/${id}`, {
    method: "PATCH", cookie, status, body: { action },
  });

  const exits = await Promise.all([change(visitId, "exit", 200), change(visitId, "exit", 200)]);
  const [exit, retry] = await Promise.all(exits.map((response) => response.json()));
  assert.deepEqual(exit.visit, retry.visit);
  assert.equal(exit.visit.status, "closed");
  assert.equal(exit.visit.rate.id, initialRate.id);
  assert.equal(exit.visit.totalCents, 800);

  const cancelled = (await (await enter("ABC1D23", 201)).json()).visit;
  await change(cancelled.id, "cancel", 200);
  await change(cancelled.id, "exit", 409);
  const contested = (await (await enter("ABC2D23", 201)).json()).visit;
  const transitions = await Promise.all([change(contested.id, "exit"), change(contested.id, "cancel")]);
  assert.deepEqual(transitions.map(({ status }) => status).sort(), [200, 409]);

  const history = await request(`/api/history?unitId=${unit.id}&plate=abc-1d23`, { cookie, status: 200 });
  const data = (await history.json()).history;
  assert.equal(data.total, 1);
  assert.equal(data.lastEntryAt, first.visit.enteredAt);
  assert.equal(data.peaks.length, 1);
  await request(`/api/history?unitId=${unit.id}&plate=ABC1D23&start=2026-12-02&end=2026-12-01`, { cookie, status: 400 });
});
