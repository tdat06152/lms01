import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env.server";

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

// Fast path for UI only: reads session from cookies without validating with Supabase.
// Do NOT use this for authorization checks.
export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
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

// Safe variant for non-critical UI (e.g. sidebar links). Never throws.
export async function getProfileSafe(userId: string) {
  try {
    return await getProfile(userId);
  } catch {
    return null;
  }
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

export async function requireActiveUser() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (profile && isExpired(profile.expires_at)) redirect("/expired");
  return { user, profile };
}

export async function requireAdmin() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const isFixedAdmin = !!serverEnv.adminEmail && user.email?.toLowerCase() === serverEnv.adminEmail.toLowerCase();
  if (!profile || (profile.role !== "admin" && !isFixedAdmin)) redirect("/not-found");
  if (profile && isExpired(profile.expires_at)) redirect("/expired");
  return { user, profile };
}

export async function requireEditor() {
  const { user, profile } = await requireActiveUser();
  if (!profile || (profile.role !== "admin" && profile.role !== "member")) redirect("/not-found");
  return { user, profile };
}

export async function requireVideoAccess() {
  const { user, profile } = await requireActiveUser();
  const hasVideo = !!profile && (profile.role === "admin" || profile.role === "member" || profile.is_pro);
  if (!hasVideo) redirect("/upgrade");
  return { user, profile };
}
