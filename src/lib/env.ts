function required(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

// Note: In Next.js client bundles, `process.env` values are inlined only when
// referenced statically (e.g. `process.env.NEXT_PUBLIC_FOO`). Avoid dynamic
// access like `process.env[name]` for public env vars.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function validateSupabaseEnv(url: string, anonKey: string) {
  // Common misconfig for this repo: using local Supabase Studio port with a placeholder key.
  // That results in OAuth redirects to `localhost:54321` and a confusing "connection refused".
  if (
    /:\/\/(localhost|127\.0\.0\.1):54321\b/.test(url) &&
    (anonKey === "dummy" || anonKey.trim() === "")
  ) {
    throw new Error(
      "Supabase env looks misconfigured: NEXT_PUBLIC_SUPABASE_URL points to localhost:54321 but NEXT_PUBLIC_SUPABASE_ANON_KEY is a placeholder. Set these to your hosted Supabase Project URL + anon key."
    );
  }

  // Never expose service role / secret keys to the client bundle.
  if (anonKey.startsWith("sb_secret_")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY must be the anon/public key (sb_publishable_… or JWT), not an sb_secret_… key."
    );
  }

  if (anonKey === "dummy") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is still set to 'dummy'. Replace it with your Supabase publishable/anon key."
    );
  }

  try {
    // eslint-disable-next-line no-new
    new URL(url);
  } catch {
    throw new Error("Invalid NEXT_PUBLIC_SUPABASE_URL (must be a full URL).");
  }
}

export const env = {
  supabaseUrl: required(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: required(supabaseAnonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
};

validateSupabaseEnv(env.supabaseUrl, env.supabaseAnonKey);
