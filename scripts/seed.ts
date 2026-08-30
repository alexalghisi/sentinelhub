import { PGlite } from "@electric-sql/pglite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { SCHEMA_SQL } from "../lib/db/schema-sql";
import { hashPassword } from "../lib/auth/password";

const email = "demo@sentinelhub.dev";
const orgId = "org_demo";
const userId = "user_demo";

async function main() {
  mkdirSync(path.join(process.cwd(), ".data"), { recursive: true });
  const db = new PGlite(path.join(process.cwd(), ".data", "pglite"));
  await db.waitReady;
  await db.exec(SCHEMA_SQL);
  const passwordHash = await hashPassword("DemoPass123!");
  await db.query("insert into users (id, email, password_hash) values ($1, $2, $3) on conflict (email) do nothing", [userId, email, passwordHash]);
  await db.query("insert into profiles (user_id, display_name) values ($1, $2) on conflict (user_id) do nothing", [userId, "Alex Demo"]);
  await db.query("insert into organizations (id, name, slug) values ($1, $2, $3) on conflict (id) do nothing", [orgId, "Cedar Relay", "sentinelhub"]);
  await db.query("insert into organization_members (id, organization_id, user_id, role) values ($1, $2, $3, $4) on conflict do nothing", ["mem_1", orgId, userId, "owner"]);

  const { sha256Hex } = await import("../lib/crypto");
  await db.query("insert into api_keys (id, organization_id, token_hash, name) values ($1,$2,$3,$4)", ["k1", orgId, sha256Hex("sh_live_demo_key"), "Ingest"]);
  await db.query("insert into alert_rules (id, organization_id, source, threshold) values ($1,$2,$3,$4)", ["r1", orgId, "auth", 2]);
  await db.query("insert into events (id, organization_id, source, severity, title, fingerprint) values ($1,$2,$3,$4,$5,$6)", ["e1", orgId, "auth", "warn", "Failed login burst", "auth|failed login burst"]);
  await db.query("insert into events (id, organization_id, source, severity, title, fingerprint) values ($1,$2,$3,$4,$5,$6)", ["e2", orgId, "nginx", "error", "5xx burst", "nginx|5xx burst"]);
  await db.query("insert into incidents (id, organization_id, title, status) values ($1,$2,$3,$4)", ["i1", orgId, "auth crossed threshold", "open"]);
  console.log("Seeded SentinelHub");
}

main();
