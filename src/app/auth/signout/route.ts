import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { clearAuthzCookie } from "@/lib/auth/access";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(`${origin}/`);
  const supabase = createSupabaseRouteClient(request, response);
  await supabase.auth.signOut();
  clearAuthzCookie(response);
  return response;
}
