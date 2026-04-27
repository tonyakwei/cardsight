/**
 * seed-qrians-prod.ts — manual production reseed gate
 *
 * Loads server/.env.production, confirms with the operator, then runs
 * the standard QRians seed against the production database.
 *
 * Run: pnpm --filter server db:seed-qrians:prod
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { spawnSync } from "node:child_process";

const ENV_FILE = resolve(import.meta.dirname, "..", ".env.production");
const SEED_SCRIPT = resolve(import.meta.dirname, "..", "prisma", "seed-qrians.ts");
const MAGIC_WORD = "RESEED";

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) {
    console.error(`✗ Missing ${path}`);
    console.error("  Create it with your Railway DATABASE_URL, e.g.:");
    console.error('  DATABASE_URL="postgresql://user:pass@host:5432/db"');
    process.exit(1);
  }
  const env: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function redactUrl(url: string): string {
  // Show host but redact password.
  try {
    const u = new URL(url);
    const user = u.username || "user";
    const host = u.hostname;
    const port = u.port ? `:${u.port}` : "";
    const db = u.pathname;
    return `postgresql://${user}:***@${host}${port}${db}`;
  } catch {
    return "(unparseable URL)";
  }
}

async function main() {
  const env = loadEnvFile(ENV_FILE);
  const dbUrl = env.DATABASE_URL;
  if (!dbUrl) {
    console.error("✗ DATABASE_URL not found in .env.production");
    process.exit(1);
  }

  console.log("");
  console.log("─".repeat(60));
  console.log("  PRODUCTION RESEED — Temple of the QRians");
  console.log("─".repeat(60));
  console.log(`  Target:  ${redactUrl(dbUrl)}`);
  console.log("");
  console.log("  This will DELETE the existing production game and");
  console.log("  everything attached to it (cards, scans, answers,");
  console.log("  missions, story sheets) before recreating it from");
  console.log("  scratch. This cannot be undone.");
  console.log("");
  console.log(`  Type ${MAGIC_WORD} to proceed, anything else to cancel.`);
  console.log("─".repeat(60));

  const rl = createInterface({ input, output });
  const answer = (await rl.question("> ")).trim();
  rl.close();

  if (answer !== MAGIC_WORD) {
    console.log("Cancelled. No changes made.");
    process.exit(0);
  }

  console.log("");
  console.log(`Running ${SEED_SCRIPT} against production…`);
  console.log("");

  const result = spawnSync("tsx", [SEED_SCRIPT], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: dbUrl },
  });

  process.exit(result.status ?? 1);
}

main();
