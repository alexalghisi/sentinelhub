import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { SCHEMA_SQL } from "@/lib/db/schema-sql";

type Pg = import("@electric-sql/pglite").PGlite;

type GlobalDb = { db?: Pg; ready?: Promise<Pg> };
const globalForDb = globalThis as unknown as GlobalDb;

function dataDir(): string {
  const dir = path.join(process.cwd(), ".data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

async function createDb(): Promise<Pg> {
  const { PGlite } = await import("@electric-sql/pglite");
  const client = new PGlite(path.join(dataDir(), "pglite"));
  await client.waitReady;
  await client.exec(SCHEMA_SQL);
  return client;
}

export async function getDb(): Promise<Pg> {
  if (globalForDb.db) return globalForDb.db;
  if (!globalForDb.ready) {
    globalForDb.ready = createDb().then((db) => {
      globalForDb.db = db;
      return db;
    });
  }
  return globalForDb.ready;
}
