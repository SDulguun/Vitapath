#!/usr/bin/env node
// Verifies that supabase/migrations/0001_init.sql has been applied.
// Reads .env.local, calls public._verify_init() via the service role key,
// and asserts the schema matches expectations.
//
// Exits 0 on success, 1 on any failure.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
if (!existsSync(envPath)) {
  console.error("✗ .env.local not found in", process.cwd());
  process.exit(1);
}
const env = Object.fromEntries(
  readFileSync(envPath, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const expected = {
  tables: [
    "profiles",
    "quizzes",
    "recommendations",
    "share_tokens",
    // Migration 0003 adds the rec_explanations cache table.
    "rec_explanations",
  ],
  policyCounts: {
    profiles: 3,
    quizzes: 2,
    recommendations: 2,
    // Migration 0002 added share_tokens_self_delete on top of the
    // _self_select + _self_insert policies from 0001.
    share_tokens: 3,
    // Migration 0003 added two policies: _self_select + _self_insert.
    rec_explanations: 2,
  },
};

const { data, error } = await supabase.rpc("_verify_init");
if (error) {
  console.error(
    "✗ RPC _verify_init failed — has 0001_init.sql been applied in the SQL Editor?",
  );
  console.error("  ", error.message);
  process.exit(1);
}

let failed = 0;
const fail = (msg) => {
  console.error("✗", msg);
  failed++;
};
const ok = (msg) => console.log("✓", msg);

// Tables exist + RLS enabled
for (const table of expected.tables) {
  const t = data.tables?.[table];
  if (!t) {
    fail(`${table}: table not found in public schema`);
    continue;
  }
  if (!t.rls) {
    fail(`${table}: RLS NOT enabled`);
    continue;
  }
  ok(`${table}: exists with RLS enabled`);
}

// Policy counts
for (const [table, want] of Object.entries(expected.policyCounts)) {
  const got = data.policies?.[table] ?? 0;
  if (got < want) {
    fail(`${table}: expected ≥${want} policies, got ${got}`);
    continue;
  }
  ok(`${table}: ${got} RLS policies in place`);
}

// Shared-result function
if (!data.get_shared_result_exists) {
  fail("get_shared_result(): function missing");
} else {
  ok("get_shared_result(): function exists");
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed. Re-apply 0001_init.sql and retry.`);
  process.exit(1);
}
console.log("\nAll Goal 2 checks passed.");
