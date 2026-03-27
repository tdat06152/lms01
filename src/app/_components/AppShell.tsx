import { getAccessState, getUser } from "@/lib/auth/server";
import { AppShellClient } from "@/app/_components/AppShellClient";

function displayNameForUser(user: { email?: string | null; user_metadata?: Record<string, unknown> }) {
  const md = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName = typeof md.full_name === "string" ? md.full_name : null;
  const name = typeof md.name === "string" ? md.name : null;
  const email = user.email ?? null;
  const local = email ? email.split("@")[0] : null;
  return (fullName || name || local || "User").trim();
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const access = user ? await getAccessState(user) : null;

  return (
    <AppShellClient
      userEmail={user?.email ?? null}
      userName={user ? displayNameForUser(user) : null}
      isExpired={access?.isExpired ?? false}
      isAdmin={access?.isAdmin ?? false}
      isEditor={access?.isEditor ?? false}
      canSeeVideo={access?.canSeeVideo ?? false}
    >
      {children}
    </AppShellClient>
  );
}
