import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { sha256Hex } from "@/lib/crypto";
import { eventFingerprint, shouldOpenIncident } from "@/lib/domain";
import { newId } from "@/lib/utils";

const Body = z.object({
  source: z.string().min(1),
  severity: z.enum(["info", "warn", "error"]),
  title: z.string().min(1),
});

export async function POST(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "missing key" }, { status: 401 });
  const db = await getDb();
  const key = await db.query<{ organization_id: string }>(
    "select organization_id from api_keys where token_hash = $1",
    [sha256Hex(token)],
  );
  if (!key.rows[0]) return Response.json({ error: "invalid key" }, { status: 401 });
  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "invalid body" }, { status: 422 });
  const organizationId = key.rows[0].organization_id;
  const fingerprint = eventFingerprint(parsed.data.source, parsed.data.title);
  const existing = await db.query<{ id: string }>(
    "select id from events where organization_id = $1 and fingerprint = $2",
    [organizationId, fingerprint],
  );
  if (existing.rows[0]) return Response.json({ id: existing.rows[0].id, deduped: true }, { status: 200 });
  const id = newId();
  await db.query(
    "insert into events (id, organization_id, source, severity, title, fingerprint) values ($1,$2,$3,$4,$5,$6)",
    [id, organizationId, parsed.data.source, parsed.data.severity, parsed.data.title, fingerprint],
  );
  const count = await db.query<{ n: number }>(
    "select count(*)::int as n from events where organization_id = $1 and source = $2",
    [organizationId, parsed.data.source],
  );
  const rule = await db.query<{ threshold: number }>(
    "select threshold from alert_rules where organization_id = $1 and source = $2",
    [organizationId, parsed.data.source],
  );
  if (rule.rows[0] && shouldOpenIncident(count.rows[0].n, rule.rows[0].threshold)) {
    await db.query(
      "insert into incidents (id, organization_id, title, status) values ($1,$2,$3,'open')",
      [newId(), organizationId, `${parsed.data.source} crossed threshold`],
    );
  }
  return Response.json({ id, deduped: false }, { status: 201 });
}
