import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { config } from "dotenv";
import sharp from "sharp";

config({ path: [".env.local", ".env"], quiet: true });
const { BETTER_AUTH_URL, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, XAI_API_KEY } = process.env;
assert.ok(BETTER_AUTH_URL && SEED_ADMIN_EMAIL && SEED_ADMIN_PASSWORD,
  "Start the application with a dedicated test database and a seeded operator.");
const origin = new URL(BETTER_AUTH_URL).origin;

async function request(path, { method = "GET", cookie, body, status, from = origin } = {}) {
  const isForm = body instanceof FormData;
  const response = await fetch(new URL(path, origin), {
    method,
    headers: {
      ...(cookie && { cookie }),
      ...(method !== "GET" && { origin: from }),
      ...(body && !isForm && { "content-type": "application/json" }),
    },
    body: isForm ? body : body && JSON.stringify(body),
    redirect: "manual",
  });
  assert.equal(response.status, status, `${method} ${path} returned ${response.status}, expected ${status}.`);
  return response;
}

function sessionCookie(response) {
  const cookies = response.headers.getSetCookie();
  assert.ok(cookies.length > 0);
  return cookies.map((cookie) => cookie.split(";", 1)[0]).join("; ");
}

function photoForm(bytes, type) {
  const form = new FormData();
  form.append("photo", new Blob([bytes], { type }), "entry-photo");
  return form;
}

test("photo endpoints require approval and round-trip validated image bytes", async (context) => {
  const aiPath = "/api/ai/plate";
  const png = await sharp({ create: { width: 32, height: 16, channels: 3, background: "white" } }).png().toBuffer();
  await request(aiPath, { method: "POST", body: photoForm(png, "image/png"), status: 401 });

  const pending = await request("/api/auth/sign-up/email", {
    method: "POST",
    body: { name: "Photo test", email: `${randomUUID()}@example.test`, password: "Photo-test-1234" },
    status: 200,
  });
  const pendingCookie = sessionCookie(pending);
  await request(aiPath, { method: "POST", body: photoForm(png, "image/png"), cookie: pendingCookie, status: 403 });

  const operator = await request("/api/auth/sign-in/email", {
    method: "POST", body: { email: SEED_ADMIN_EMAIL, password: SEED_ADMIN_PASSWORD }, status: 200,
  });
  const cookie = sessionCookie(operator);
  await request(aiPath, { method: "POST", body: photoForm(png, "image/jpeg"), cookie, status: 400 });
  await request(aiPath, { method: "POST", body: photoForm(png, "image/png"), cookie, from: "https://other.example", status: 403 });

  await context.test("a missing provider key leaves manual entry available", { skip: Boolean(XAI_API_KEY?.trim()) }, async () => {
    const response = await request(aiPath, { method: "POST", body: photoForm(png, "image/png"), cookie, status: 503 });
    assert.match((await response.json()).error, /Digite a placa/);
  });

  const { unit } = await (await request("/api/units", {
    method: "POST", body: { name: `Photo test ${randomUUID()}`, timeZone: "America/Sao_Paulo" }, cookie, status: 201,
  })).json();
  await request(`/api/units/${unit.id}/rates`, {
    method: "POST", body: { mode: "proportional", priceCents: 800, graceMinutes: 0, graceMode: "charge_total" }, cookie, status: 201,
  });
  const base64 = png.toString("base64");
  const entry = { unitId: unit.id, plate: "ABC1D23", suggestedPlate: "ABC1D24", confidence: "medium" };
  await request("/api/visits", {
    method: "POST", body: { ...entry, photo: { base64, mimeType: "image/jpeg" } }, cookie, status: 400,
  });
  const { visit } = await (await request("/api/visits", {
    method: "POST", body: { ...entry, photo: { base64, mimeType: "image/png" } }, cookie, status: 201,
  })).json();
  assert.equal(visit.plate, entry.plate);
  assert.equal(visit.suggestedPlate, entry.suggestedPlate);
  assert.equal(visit.hasPhoto, true);

  const photoPath = `/api/visits/${visit.id}/photo`;
  await request(photoPath, { status: 401 });
  await request(photoPath, { cookie: pendingCookie, status: 403 });
  await request(`/api/visits/${randomUUID()}/photo`, { cookie, status: 404 });
  const response = await request(photoPath, { cookie, status: 200 });
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), png);
});
