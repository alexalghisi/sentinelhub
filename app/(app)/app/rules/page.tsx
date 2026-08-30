import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";

export default async function RulesPage() {
  const user = await requireUser();
  const db = await getDb();
  const rows = await db.query<{ source: string; threshold: number }>(
    "select source, threshold from alert_rules where organization_id = $1",
    [user.organizationId],
  );
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Rules</h1>
      <ul className="text-sm">
        {rows.rows.map((row) => (
          <li key={row.source}>Open an incident when <strong>{row.source}</strong> events ≥ {row.threshold}</li>
        ))}
      </ul>
    </div>
  );
}
