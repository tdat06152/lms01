import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env.server";
import { buildAccessState, readAuthzCookie, type AccessProfile } from "@/lib/auth/access";

export type Profile = {
  id: string;
  email: string | null;
  role: "user" | "admin" | "member";
  is_pro: boolean;
  expires_at: string | null;
};

export async function getUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function getProfile(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, is_pro, expires_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as Profile | null) ?? null;
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

function isFixedAdminEmail(email: string | null | undefined) {
  return !!serverEnv.adminEmail && !!email && email.toLowerCase() === serverEnv.adminEmail.toLowerCase();
}

export async function getAccessState(user: { id: string; email?: string | null }) {
  const fixedAdmin = isFixedAdminEmail(user.email);
  const fromCookie = await readAuthzCookie(user.id);
  if (fromCookie) {
    return fixedAdmin ? buildAccessState({ role: fromCookie.role, is_pro: fromCookie.isPro, expires_at: fromCookie.expiresAt }, { fixedAdmin }) : fromCookie;
  }

  const profile = await getProfile(user.id);
  return buildAccessState(profile as AccessProfile | null, { fixedAdmin });
}

export async function requireActiveUser() {
  const user = await requireUser();
  const access = await getAccessState(user);
  if (access.isExpired) redirect("/expired");
  return { user, access };
}

export async function requireAdmin() {
  const user = await requireUser();
  const access = await getAccessState(user);
  if (!access.isAdmin) redirect("/not-found");
  if (access.isExpired) redirect("/expired");
  return { user, access };
}

export async function requireEditor() {
  const { user, access } = await requireActiveUser();
  if (!access.isEditor) redirect("/not-found");
  return { user, access };
}

export async function requireVideoAccess() {
  const { user, access } = await requireActiveUser();
  if (!access.canSeeVideo) redirect("/upgrade");
  return { user, access };
}
