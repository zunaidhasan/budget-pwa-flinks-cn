import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

let poolInstance: Pool | undefined;
let dbInstance: NodePgDatabase<typeof schema> | undefined;

function getPool() {
  if (poolInstance) return poolInstance;

  const existingPool = globalForDb.__arenaNextJsPostgresqlPool;
  if (existingPool) {
    poolInstance = existingPool;
    return poolInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  poolInstance = new Pool({ connectionString: databaseUrl });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = poolInstance;
  }

  return poolInstance;
}

function getDb() {
  return (dbInstance ??= drizzle(getPool(), { schema }));
}

function lazyProxy<T extends object>(getTarget: () => T): T {
  return new Proxy({} as T, {
    get(_target, property) {
      const target = getTarget();
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

export const pool = lazyProxy(getPool);
export const db = lazyProxy(getDb);
