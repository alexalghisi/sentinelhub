import { cookies } from "next/headers";
import { getDb } from "@/lib/db/client";
import { SESSION_COOKIE } from "@/lib/auth/cookie";
import { sha256Hex } from "@/lib/crypto";
import { newId } from "@/lib/utils";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  organizationId: string;
  organizationName: string;
  role: string;
};

export async function createSession(userId: string) {
  const db = await getDb();
  const token = newId() + newId();
  const expiresAt = new Date(Date.now() + THIRTY_DAYS * 1000).toISOString();
  await db.query(
    "insert into sessions (id, user_id, token_hash, expires_at) values ($1, $2, $3, $4)",
    [newId(), userId, sha256Hex(token), expiresAt],
  );
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.query("update sessions set revoked_at = now() where token_hash = $1", [sha256Hex(token)]);
  }
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const result = await db.query<{
    user_id: string;
    email: string;
    display_name: string;
    expires_at: Date;
    revoked_at: Date | null;
    organization_id: string;
    organization_name: string;
    role: string;
  }>(
    `select u.id as user_id, u.email, p.display_name, s.expires_at, s.revoked_at,
            o.id as organization_id, o.name as organization_name, m.role
       from sessions s
       join users u on u.id = s.user_id
       join profiles p on p.user_id = u.id
       join organization_members m on m.user_id = u.id
       join organizations o on o.id = m.organization_id
      where s.token_hash = $1 and s.revoked_at is null
      limit 1`,
    [sha256Hex(token)],
  );
  const row = result.rows[0];
  if (!row || new Date(row.expires_at).getTime() < Date.now()) return null;
  return {
    id: row.user_id,
    email: row.email,
    displayName: row.display_name,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    role: row.role,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
    throw new Error("redirect");
  }
  return user;
}
