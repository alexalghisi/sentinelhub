import Link from "next/link";
import { logoutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <p className="font-semibold">SentinelHub</p>
          <p className="text-xs text-muted-foreground">{user.organizationName} · {user.role}</p>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/app" className="text-sm underline">Incidents</Link>
          <Link href="/app/events" className="text-sm underline">Events</Link>
          <Link href="/app/rules" className="text-sm underline">Rules</Link>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost">Log out</Button>
          </form>
        </nav>
      </header>
      <div className="px-6 py-8">{children}</div>
    </div>
  );
}
