import { NextRequest, NextResponse } from "next/server";
import { getAccessState } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createPresignedPutUrl, r2PublicUrlForKey } from "@/lib/r2";

export const runtime = "nodejs";

type UploadRequest = {
  filename?: string;
  contentType?: string;
  sizeBytes?: number;
};

function sanitizeFilename(filename: string) {
  const base = filename.split(/[\\/]/).pop() ?? "file";
  return base.replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const access = await getAccessState(user);
  if (access.isExpired) {
    return NextResponse.json({ error: "Account expired" }, { status: 403 });
  }

  let body: UploadRequest;
  try {
    body = (await request.json()) as UploadRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const filename = typeof body.filename === "string" ? body.filename : "file";
  const contentType = typeof body.contentType === "string" ? body.contentType : "application/octet-stream";
  const sizeBytes = typeof body.sizeBytes === "number" ? body.sizeBytes : null;

  // Basic guardrails for images/docs; adjust as needed.
  const maxBytes = 25 * 1024 * 1024;
  if (sizeBytes != null && (sizeBytes <= 0 || sizeBytes > maxBytes)) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const safeName = sanitizeFilename(filename);
  const ext = safeName.includes(".") ? safeName.slice(safeName.lastIndexOf(".")) : "";
  const key = `uploads/${user.id}/${crypto.randomUUID()}${ext}`;

  const uploadUrl = await createPresignedPutUrl({
    key,
    contentType,
    expiresInSeconds: 60
  });

  return NextResponse.json({
    key,
    uploadUrl,
    publicUrl: r2PublicUrlForKey(key),
    expiresInSeconds: 60
  });
}
