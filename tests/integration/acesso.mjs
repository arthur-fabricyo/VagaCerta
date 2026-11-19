import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { setTimeout as esperar } from "node:timers/promises";
import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });
const { BETTER_AUTH_URL, DATABASE_URL, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = process.env;
assert.ok(BETTER_AUTH_URL && DATABASE_URL && SEED_ADMIN_EMAIL && SEED_ADMIN_PASSWORD,
  "Configure a aplicação e o banco de teste antes de rodar a suíte.");
const origin = new URL(BETTER_AUTH_URL).origin;

function request(path, { method = "GET", cookie, body, from = origin } = {}) {
  return fetch(new URL(path, origin), {
    method,
    redirect: "manual",
    headers: {
      ...(cookie && { cookie }),
      ...(method !== "GET" && { origin: from }),
      ...(body && { "content-type": "application/json" }),
    },
    body: body && JSON.stringify(body),
  });
}

function sessionCookie(response) {
  const cookies = response.headers.getSetCookie();
  assert.ok(cookies.length > 0, "A autenticação deve criar um cookie de sessão.");
  return cookies.map((cookie) => cookie.split(";", 1)[0]).join("; ");
}

async function authRequest(path, options) {
  const response = await request(path, options);
  if (response.status !== 429) return response;

  const segundos = Number(response.headers.get("x-retry-after"));
  assert.ok(segundos > 0 && segundos <= 60, "O Better Auth deve informar um intervalo de espera.");
  await response.body?.cancel();
  await esperar((segundos + 1) * 1000);
  return request(path, options);
}

async function signup({ email = `${randomUUID()}@example.test`, ...extra } = {}) {
  const response = await authRequest("/api/auth/sign-up/email", {
    method: "POST",
    body: { name: "Operador de teste", email, password: "Acesso-teste-1234", ...extra },
  });
  return { response, email };
}

async function pendingUser() {
  const { response, email } = await signup();
  assert.equal(response.status, 200);
  const { user } = await response.json();
  return { id: user.id, email, cookie: sessionCookie(response) };
}

async function signIn(email, password) {
  return authRequest("/api/auth/sign-in/email", { method: "POST", body: { email, password } });
}

async function operatorCookie() {
  const response = await signIn(SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD);
  assert.equal(response.status, 200);
  return sessionCookie(response);
}

function decision(id, acao, cookie, from) {
  return request(`/api/usuarios/${id}`, { method: "PATCH", cookie, from, body: { acao } });
}

test("páginas públicas e proteção de visitantes sem sessão", async () => {
  assert.equal((await request("/api/usuarios")).status, 401);
  assert.equal((await request("/")).headers.get("location"), "/entrar");
  assert.equal((await request("/usuarios")).headers.get("location"), "/entrar");
  for (const path of ["/reservations", "/settings"]) {
    assert.equal((await request(path)).headers.get("location"), "/entrar");
  }
  for (const [path, titulo] of [["/entrar", /Entrar/], ["/cadastro", /Criar conta/]]) {
    const pagina = await (await request(path)).text();
    assert.match(pagina, titulo);
    assert.match(pagina, /<form\b[^>]*\bmethod="post"/i);
  }
});

test("cadastro pendente, aprovação e acesso com a mesma sessão", async () => {
  const operator = await operatorCookie();
  const { id, email, cookie } = await pendingUser();
  assert.equal((await request("/api/usuarios", { cookie })).status, 403);
  assert.equal((await request("/api/dashboard", { cookie })).status, 403);
  assert.equal((await request("/", { cookie })).headers.get("location"), "/aguardando-aprovacao");
  for (const path of ["/reservations", "/settings"]) {
    assert.equal((await request(path, { cookie })).headers.get("location"), "/aguardando-aprovacao");
  }
  assert.match(await (await request("/aguardando-aprovacao", { cookie })).text(), /Cadastro aguardando aprovação/);
  assert.equal((await decision(id, "aprovar", cookie)).status, 403);
  assert.equal((await decision(id, "invalidar", operator)).status, 400);
  assert.equal((await decision(id, "aprovar", operator, "https://outra-origem.example")).status, 403);

  const listed = await (await request("/api/usuarios", { cookie: operator })).json();
  assert.ok(listed.pendentes.some((user) => user.id === id && user.email === email));
  assert.equal((await decision(id, "aprovar", operator)).status, 200);
  assert.equal((await request("/", { cookie })).status, 200);
  for (const path of ["/reservations", "/settings"]) {
    assert.equal((await request(path, { cookie })).status, 200);
  }
  const updated = await (await request("/api/usuarios", { cookie })).json();
  assert.ok(updated.aprovados.some((user) => user.id === id));
  assert.ok(!updated.pendentes.some((user) => user.id === id));
  assert.match(await (await request("/usuarios", { cookie })).text(), /Usuários/);
});

test("o cadastro público não concede aprovação", async () => {
  const { response } = await signup({ aprovado: true });
  if (response.status === 200) {
    assert.equal((await request("/api/usuarios", { cookie: sessionCookie(response) })).status, 403);
  } else {
    assert.equal(response.status, 400);
  }
});

test("o cadastro exige um nome identificável no servidor", async () => {
  const { response } = await signup({ name: "   " });
  assert.equal(response.status, 400);
});

test("recusa remove o cadastro e invalida a sessão", async () => {
  const operator = await operatorCookie();
  const { id, email, cookie } = await pendingUser();
  assert.equal((await decision(id, "recusar", operator)).status, 200);
  assert.equal((await request("/api/usuarios", { cookie })).status, 401);
  assert.equal((await signIn(email, "Acesso-teste-1234")).status, 401);
  assert.equal((await decision(id, "aprovar", operator)).status, 409);
});

test("aprovação e recusa simultâneas só alteram um cadastro uma vez", async () => {
  const operator = await operatorCookie();
  const { id } = await pendingUser();
  const outcomes = await Promise.all([decision(id, "aprovar", operator), decision(id, "recusar", operator)]);
  assert.deepEqual(outcomes.map((response) => response.status).sort(), [200, 409]);
});

test("seed preserva um operador existente e não promove um cadastro pendente", async () => {
  const { email, cookie } = await pendingUser();
  const rerun = spawnSync(process.execPath, ["prisma/seed.mjs"], {
    encoding: "utf8",
    env: { ...process.env, SEED_ADMIN_PASSWORD: "Outra-senha-seed-1234" },
  });
  assert.equal(rerun.status, 0, rerun.stderr);
  await operatorCookie();
  const collision = spawnSync(process.execPath, ["prisma/seed.mjs"], {
    encoding: "utf8",
    env: { ...process.env, SEED_ADMIN_EMAIL: email },
  });
  assert.equal(collision.status, 1);
  assert.match(collision.stderr, /cadastro pendente/);
  const parInvalido = spawnSync(process.execPath, ["prisma/seed.mjs"], {
    encoding: "utf8",
    env: { ...process.env, SEED_ADMIN_EMAIL: "operador@empresa.c" },
  });
  assert.equal(parInvalido.status, 1);
  assert.match(parInvalido.stderr, /e-mail válido/);
  assert.equal((await request("/api/usuarios", { cookie })).status, 403);
  assert.equal((await request("/api/auth/sign-out", { method: "POST", cookie })).status, 200);
  assert.equal((await request("/api/usuarios", { cookie })).status, 401);
});
