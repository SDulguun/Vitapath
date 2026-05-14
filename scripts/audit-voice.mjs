#!/usr/bin/env node
// VitaPath voice-rule auditor.
//
// Scans app/**/*.tsx for v2 voice rule violations (see HANDOFF.md §7):
//   1. Em dashes (—) in user-facing text (code comments are allowed)
//   2. The forbidden "AUM AI Agentic capstone" tagline
//   3. Literal `←` character (must use <BackButton> instead)
//
// Strips JS/TS comments before scanning, so em dashes in `/* ... */`
// and `// ...` blocks are ignored. This isn't a full AST analysis — it
// catches the common-case mistakes and reads cleanly enough that the
// Ralph loop (.claude/ralph/voice-cleanup.md) can act on the output.
//
// Exit 0 if clean, 1 if any violation found.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const APP_DIR = join(ROOT, "app");

// Allow-listed exact substrings. Per HANDOFF §7, the disclaimer regex
// pinned in tests/results.spec.ts uses "not medical advice" — that
// "not X, Y" structure is intentional and tests assert it. We don't
// scan for that pattern, but if we did, this is where it'd be excused.
const ALLOWED_SUBSTRINGS = [];

const RULES = [
  {
    id: "em-dash",
    pattern: /—/,
    message: "Em dash in user copy. Use period, comma, or colon.",
  },
  {
    id: "aum-tagline",
    pattern: /AUM AI Agentic/i,
    message:
      'Forbidden "AUM AI Agentic" tagline in product copy (footer is "Source on GitHub" only).',
  },
  {
    id: "left-arrow",
    pattern: /←/,
    message: "Literal `←` character. Use <BackButton> with ChevronLeftIcon.",
  },
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      out.push(...walk(p));
    } else if (name.endsWith(".tsx")) {
      out.push(p);
    }
  }
  return out;
}

// Strip /* ... */ block comments and // line comments. Imperfect — does
// not parse string literals — but adequate for our codebase where the
// forbidden characters never appear inside legitimate strings.
function stripComments(src) {
  let out = "";
  let i = 0;
  while (i < src.length) {
    if (src[i] === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      if (end === -1) break;
      out += " ".repeat(end + 2 - i);
      i = end + 2;
    } else if (src[i] === "/" && src[i + 1] === "/") {
      const end = src.indexOf("\n", i);
      if (end === -1) {
        out += " ".repeat(src.length - i);
        i = src.length;
      } else {
        out += " ".repeat(end - i);
        i = end;
      }
    } else {
      out += src[i];
      i++;
    }
  }
  return out;
}

function audit(file) {
  const src = readFileSync(file, "utf-8");
  const stripped = stripComments(src);
  const lines = stripped.split("\n");
  const violations = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const rule of RULES) {
      if (!rule.pattern.test(line)) continue;
      if (ALLOWED_SUBSTRINGS.some((s) => line.includes(s))) continue;
      violations.push({
        file: relative(ROOT, file),
        line: i + 1,
        rule: rule.id,
        message: rule.message,
        text: line.trim().slice(0, 120),
      });
    }
  }
  return violations;
}

const files = walk(APP_DIR);
const all = files.flatMap(audit);

if (all.length === 0) {
  console.log(`✓ voice audit clean across ${files.length} .tsx files`);
  process.exit(0);
}

console.error(
  `✗ ${all.length} voice violation${all.length === 1 ? "" : "s"} across ${files.length} .tsx files\n`,
);
for (const v of all) {
  console.error(`${v.file}:${v.line}  [${v.rule}]  ${v.message}`);
  console.error(`    ${v.text}\n`);
}
console.error(
  'Run the Ralph loop at .claude/ralph/voice-cleanup.md to auto-fix, or edit manually following HANDOFF.md §7.',
);
process.exit(1);
