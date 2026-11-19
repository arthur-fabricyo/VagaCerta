import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { config } from "dotenv";
import pg from "pg";
import { z } from "zod";

config({ path: [".env.local", ".env"], quiet: true });

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!connectionString || !email || !password) {
    throw new Error("Configure DATABASE_URL, SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD.");
  }
  if (!z.email().safeParse(email).success || password.length < 8 || password.length > 128) {
    throw new Error("Use um e-mail válido e uma senha de 8 a 128 caracteres para o operador inicial.");
  }

  const db = new pg.Client({ connectionString });
  try {
    await db.connect();
    const existe = await db.query(`
      SELECT "aprovado", EXISTS (
        SELECT 1 FROM "account"
        WHERE "userId" = "user"."id" AND "providerId" = 'credential' AND "password" IS NOT NULL
      ) AS "temCredencial"
      FROM "user" WHERE "email" = $1
    `, [email]);

    if (existe.rowCount) {
      const conta = existe.rows[0];
      if (!conta.aprovado) throw new Error("O e-mail do seed pertence a um cadastro pendente.");
      if (!conta.temCredencial) throw new Error("O operador existente precisa de uma credencial de e-mail e senha.");
      console.log("O operador inicial já está cadastrado.");
      return;
    }

    // A conta e a credencial são gravadas na mesma instrução atômica.
    const { rowCount } = await db.query(`
      WITH novo_operador AS (
        INSERT INTO "user" ("id", "name", "email", "aprovado", "updatedAt")
        VALUES ($1, 'Operador inicial', $2, true, now())
        ON CONFLICT ("email") DO NOTHING
        RETURNING "id"
      )
      INSERT INTO "account" ("id", "accountId", "providerId", "userId", "password", "updatedAt")
      SELECT $3, "id", 'credential', "id", $4, now() FROM novo_operador
    `, [randomUUID(), email, randomUUID(), await hashPassword(password)]);

    if (!rowCount) throw new Error("O e-mail do seed foi cadastrado durante a execução. Execute o seed novamente.");
    console.log("Operador inicial criado.");
  } finally {
    await db.end();
  }
}

try {
  await seed();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
