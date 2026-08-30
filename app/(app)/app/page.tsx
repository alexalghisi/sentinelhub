import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { setIncidentAction } from "@/features/work/actions";
import { Button } from "@/components/ui/button";

export default async function IncidentsPage() {
  const user = await requireUser();
  const db = await getDb();
  const rows = await db.query<{ id: string; title: string; status: string }>(
    "select id, title, status from incidents where organization_id = $1 order by created_at desc",
    [user.organizationId],
  );
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Incidents</h1>
      <p className="text-sm text-muted-foreground">Defensive monitoring only. No offensive tooling.</p>
      <ul className="space-y-2">
        {rows.rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
            <span>{row.title} · {row.status}</span>
            <div className="flex gap-1">
              <form action={setIncidentAction.bind(null, row.id, "ack")}><Button size="sm" variant="outline">Ack</Button></form>
              <form action={setIncidentAction.bind(null, row.id, "resolve")}><Button size="sm">Resolve</Button></form>
              <form action={setIncidentAction.bind(null, row.id, "reopen")}><Button size="sm" variant="ghost">Reopen</Button></form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
