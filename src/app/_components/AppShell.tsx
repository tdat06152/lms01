import { getProfile, getUser } from "@/lib/auth/server";
import { serverEnv } from "@/lib/env.server";
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
  const profile = user ? await getProfile(user.id) : null;
  const isExpired = !!profile?.expires_at && new Date(profile.expires_at).getTime() <= Date.now();

  const fixedAdmin = !!serverEnv.adminEmail && user?.email?.toLowerCase() === serverEnv.adminEmail.toLowerCase();
  const isAdmin = !isExpired && (profile?.role === "admin" || fixedAdmin);
  const isEditor = !isExpired && (profile?.role === "admin" || profile?.role === "member" || fixedAdmin);
  const canSeeVideo = !isExpired && !!profile && (profile.role === "admin" || profile.role === "member" || profile.is_pro);

  return (
    <AppShellClient
      userEmail={user?.email ?? null}
      userName={user ? displayNameForUser(user) : null}
      isExpired={isExpired}
      isAdmin={isAdmin}
      isEditor={isEditor}
      canSeeVideo={canSeeVideo}
    >
      {children}
    </AppShellClient>
  );
}
