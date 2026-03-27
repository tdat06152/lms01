import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env.server";

export type AccessRole = "user" | "admin" | "member";

export type AccessProfile = {
  role: AccessRole;
  is_pro: boolean;
  expires_at: string | null;
};

type AuthzCookiePayload = {
  v: 1;
  userId: string;
  role: AccessRole;
  isPro: boolean;
  expiresAt: string | null;
};

export type AccessState = {
  role: AccessRole;
  isPro: boolean;
  expiresAt: string | null;
  isExpired: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  canSeeVideo: boolean;
};

export const AUTHZ_COOKIE_NAME = "toeic_authz";

function getCookieSecret() {
  return serverEnv.authzCookieSecret;
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

export function buildAccessState(profile: AccessProfile | null, options?: { fixedAdmin?: boolean }) {
  const fixedAdmin = !!options?.fixedAdmin;
  const baseRole = profile?.role ?? "user";
  const role: AccessRole = fixedAdmin ? "admin" : baseRole;
  const isPro = fixedAdmin ? true : !!profile?.is_pro;
  const expiresAt = fixedAdmin ? null : profile?.expires_at ?? null;
  const expired = !fixedAdmin && isExpired(expiresAt);
  const isAdmin = !expired && role === "admin";
  const isEditor = !expired && (role === "admin" || role === "member");
  const canSeeVideo = !expired && (isEditor || isPro);

  return {
    role,
    isPro,
    expiresAt,
    isExpired: expired,
    isAdmin,
    isEditor,
    canSeeVideo
  } satisfies AccessState;
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function serializePayload(payload: AuthzCookiePayload) {
  const secret = getCookieSecret();
  if (!secret) return null;

  const encodedPayload = encode(JSON.stringify(payload));
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

function parsePayload(raw: string) {
  const secret = getCookieSecret();
  if (!secret) return null;

  const [encodedPayload, encodedSignature] = raw.split(".");
  if (!encodedPayload || !encodedSignature) return null;

  const expectedSignature = sign(encodedPayload, secret);
  const provided = Buffer.from(encodedSignature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  try {
    const payload = JSON.parse(decode(encodedPayload)) as AuthzCookiePayload;
    if (payload.v !== 1 || !payload.userId) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setAuthzCookie(
  response: NextResponse,
  userId: string,
  profile: AccessProfile | null,
  options?: { fixedAdmin?: boolean; secure?: boolean }
) {
  const access = buildAccessState(profile, { fixedAdmin: options?.fixedAdmin });
  const raw = serializePayload({
    v: 1,
    userId,
    role: access.role,
    isPro: access.isPro,
    expiresAt: access.expiresAt
  });
  if (!raw) return;

  response.cookies.set(AUTHZ_COOKIE_NAME, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: options?.secure ?? process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearAuthzCookie(response: NextResponse) {
  response.cookies.set(AUTHZ_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function readAuthzCookie(userId: string) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(AUTHZ_COOKIE_NAME)?.value;
  if (!raw) return null;

  const payload = parsePayload(raw);
  if (!payload || payload.userId !== userId) return null;

  return buildAccessState({
    role: payload.role,
    is_pro: payload.isPro,
    expires_at: payload.expiresAt
  });
}
