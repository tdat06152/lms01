import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createPresignedGetUrl } from "@/lib/r2";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("expires_at")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) return NextResponse.json({ error: "Profile lookup failed" }, { status: 500 });
  if (profile?.expires_at && new Date(profile.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: "Account expired" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  // Prevent signing paths outside the user's own folder.
  if (!key.startsWith(`uploads/${user.id}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = await createPresignedGetUrl({ key, expiresInSeconds: 60 });
  return NextResponse.json({ url, expiresInSeconds: 60 });
}
