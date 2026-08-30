import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";

export default async function EventsPage() {
  const user = await requireUser();
  const db = await getDb();
  const rows = await db.query<{ source: string; severity: string; title: string }>(
    "select source, severity, title from events where organization_id = $1 order by created_at desc",
    [user.organizationId],
  );
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Events</h1>
      <p className="text-sm text-muted-foreground">Ingest: POST /api/v1/events with Bearer sh_live_demo_key</p>
      <ul className="space-y-2 text-sm">
        {rows.rows.map((row, i) => (
          <li key={i} className="rounded-xl border border-border bg-card p-3">{row.severity} · {row.source} · {row.title}</li>
        ))}
      </ul>
    </div>
  );
}
