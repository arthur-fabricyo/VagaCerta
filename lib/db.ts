import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalDb = globalThis as typeof globalThis & { vagaCertaDb?: PrismaClient };

export function getDb() {
  if (!globalDb.vagaCertaDb) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("Configure DATABASE_URL.");
    globalDb.vagaCertaDb = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  }
  return globalDb.vagaCertaDb;
}
