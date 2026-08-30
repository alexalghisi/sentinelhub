"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { nextStatus, type IncidentStatus } from "@/lib/domain";

export async function setIncidentAction(id: string, action: "ack" | "resolve" | "reopen") {
  const user = await requireUser();
  const db = await getDb();
  const row = await db.query<{ status: IncidentStatus }>(
    "select status from incidents where id = $1 and organization_id = $2",
    [id, user.organizationId],
  );
  if (!row.rows[0]) return;
  await db.query("update incidents set status = $1 where id = $2", [nextStatus(row.rows[0].status, action), id]);
  revalidatePath("/app");
}
