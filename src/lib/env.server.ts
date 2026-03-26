import "server-only";

function optional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export const envServer = {
  // Cloudflare R2 (server-only)
  r2AccountId: optional(process.env.R2_ACCOUNT_ID),
  r2AccessKeyId: optional(process.env.R2_ACCESS_KEY_ID),
  r2SecretAccessKey: optional(process.env.R2_SECRET_ACCESS_KEY),
  r2Bucket: optional(process.env.R2_BUCKET),
  r2PublicBaseUrl: optional(process.env.R2_PUBLIC_BASE_URL),

  // Supabase / admin (server-only)
  supabaseServiceRoleKey: optional(process.env.SUPABASE_SERVICE_ROLE_KEY),
  adminEmail: optional(process.env.ADMIN_EMAIL)
};

// Back-compat for newer code paths
export const serverEnv = {
  supabaseServiceRoleKey: envServer.supabaseServiceRoleKey,
  adminEmail: envServer.adminEmail
};

