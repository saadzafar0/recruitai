/**
 * Push `supabase/migrations` to the hosted DB using `services/nextjs-web/.env`.
 * Requires one of: DATABASE_URL, or NEXT_PUBLIC_SUPABASE_URL + SUPABASE_DB_PASSWORD
 * (anon + service role keys are not enough — Supabase does not use them for Postgres).
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const { readFileSync, existsSync } = require("node:fs");
const { join, dirname } = require("node:path");
const { execFileSync } = require("node:child_process");

const scriptDir = __dirname;
const serviceRoot = join(scriptDir, "..");
const repoRoot = join(serviceRoot, "..", "..");
const envPath = join(serviceRoot, ".env");

function loadDotEnvFile(path) {
  if (!existsSync(path)) {
    console.error("Missing " + path);
    process.exit(1);
  }
  const o = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)) continue;
    let v = line.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    o[k] = v;
  }
  return o;
}

function buildDbUrlFromSupabaseUrl(supabaseUrl, password) {
  let hostname;
  try {
    hostname = new URL(supabaseUrl).hostname;
  } catch {
    return null;
  }
  const ref = hostname.split(".")[0];
  if (!ref) return null;
  const pass = encodeURIComponent(password);
  return `postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/postgres`;
}

const env = { ...process.env, ...loadDotEnvFile(envPath) };
let dbUrl = env.DATABASE_URL;
if (!dbUrl && env.SUPABASE_DB_PASSWORD && env.NEXT_PUBLIC_SUPABASE_URL) {
  dbUrl = buildDbUrlFromSupabaseUrl(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_DB_PASSWORD
  );
}
if (!dbUrl) {
  console.error(
    "Set DATABASE_URL in services/nextjs-web/.env, or set SUPABASE_DB_PASSWORD\n" +
      "together with NEXT_PUBLIC_SUPABASE_URL (the latter you already have).\n" +
      "Database password: Supabase Dashboard → Project Settings → Database (not the anon or service role keys).\n" +
      "Service role and anon keys cannot run `supabase db push` / migrations against Postgres."
  );
  process.exit(1);
}

execFileSync(
  "npx",
  [
    "-y",
    "supabase@latest",
    "db",
    "push",
    "--workdir",
    repoRoot,
    "--db-url",
    dbUrl,
    "--yes",
  ],
  { stdio: "inherit", env }
);
