import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { config } from "dotenv";

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
