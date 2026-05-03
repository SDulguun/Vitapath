#!/usr/bin/env node
// Headless verification of the supplement-evidence MCP server.
// Spawns the server over stdio (via tsx), lists its tools, and asserts that
// the seeded data is returned for vitamin_d / omega_3. Exits 0 on success.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const transport = new StdioClientTransport({
  command: "npx",
  args: ["--yes", "tsx", resolve(here, "src/index.ts")],
  cwd: here,
});

const client = new Client(
  { name: "supplement-evidence-verify", version: "0.1.0" },
  { capabilities: {} },
);

let failed = 0;
const fail = (m) => {
  console.error("✗", m);
  failed++;
};
const ok = (m) => console.log("✓", m);

try {
  await client.connect(transport);

  // 1) Tools advertised
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  const expected = ["get_supplement", "list_studies", "search_evidence"];
  for (const t of expected) {
    if (names.includes(t)) ok(`tool advertised: ${t}`);
    else fail(`tool missing: ${t}`);
  }

  // Helper: parse the first text content payload.
  const parse = (resp) => {
    const text = resp?.content?.[0]?.text;
    if (typeof text !== "string") throw new Error("expected text content");
    return JSON.parse(text);
  };

  // 2) get_supplement('vitamin_d') returns the seeded record
  const supp = parse(
    await client.callTool({
      name: "get_supplement",
      arguments: { slug: "vitamin_d" },
    }),
  );
  if (supp.slug === "vitamin_d" && /vitamin d/i.test(supp.name)) {
    ok(`get_supplement(vitamin_d) → ${supp.name}`);
  } else {
    fail(`get_supplement(vitamin_d) returned unexpected: ${JSON.stringify(supp)}`);
  }

  // 3) list_studies('omega_3') returns ≥1 study
  const studies = parse(
    await client.callTool({
      name: "list_studies",
      arguments: { slug: "omega_3" },
    }),
  );
  if (Array.isArray(studies) && studies.length >= 1) {
    ok(`list_studies(omega_3) → ${studies.length} study(ies)`);
  } else {
    fail(`list_studies(omega_3) returned unexpected: ${JSON.stringify(studies)}`);
  }

  // 4) search_evidence filters by concern
  const sleepStudies = parse(
    await client.callTool({
      name: "search_evidence",
      arguments: { slug: "magnesium_glycinate", concern: "sleep" },
    }),
  );
  if (Array.isArray(sleepStudies) && sleepStudies.length >= 1) {
    ok(`search_evidence(magnesium_glycinate, "sleep") → ${sleepStudies.length}`);
  } else {
    fail(
      `search_evidence(magnesium_glycinate, "sleep") returned unexpected: ${JSON.stringify(sleepStudies)}`,
    );
  }
} catch (err) {
  fail(`unhandled error: ${err?.message ?? err}`);
} finally {
  await client.close().catch(() => {});
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll Goal 5 MCP checks passed.");
