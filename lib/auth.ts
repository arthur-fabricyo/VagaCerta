import { betterAuth } from "better-auth/minimal";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { z } from "zod";
import { getDb } from "./db";

const nomeSchema = z.string().trim().min(1).max(120);

function validarNome(nome: string) {
  const resultado = nomeSchema.safeParse(nome);
  if (!resultado.success) {
    throw new APIError("BAD_REQUEST", { message: "Informe um nome de até 120 caracteres." });
  }
  return resultado.data;
}

export function getAuthOrigin() {
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!baseURL) throw new Error("Configure BETTER_AUTH_URL.");
  return new URL(baseURL).origin;
}

function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("Configure BETTER_AUTH_SECRET.");

  return betterAuth({
    baseURL: getAuthOrigin(),
    secret,
    database: prismaAdapter(getDb(), { provider: "postgresql", transaction: true }),
    emailAndPassword: { enabled: true },
    user: {
      additionalFields: {
        aprovado: { type: "boolean", defaultValue: false, input: false },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({ data: { ...user, name: validarNome(user.name) } }),
        },
        update: {
          before: async (user) => {
            if (user.name === undefined) return;
            return { data: { ...user, name: validarNome(user.name) } };
          },
        },
      },
    },
  });
}

let auth: ReturnType<typeof createAuth> | undefined;

export function getAuth() {
  return auth ??= createAuth();
}
