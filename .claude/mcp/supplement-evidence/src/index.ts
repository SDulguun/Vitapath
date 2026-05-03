#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(here, "..", "data", "supplements.json");

type Study = {
  title: string;
  year: number;
  doi?: string;
  summary: string;
  concerns: string[];
};

type Supplement = {
  slug: string;
  name: string;
  forms: string[];
  typical_dose: string;
  pregnancy_safe: boolean;
  studies: Study[];
};

const supplements: Supplement[] = JSON.parse(
  readFileSync(dataPath, "utf-8"),
);
const bySlug = new Map(supplements.map((s) => [s.slug, s]));

const server = new Server(
  { name: "supplement-evidence", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_supplement",
      description: "Return metadata for a supplement by slug.",
      inputSchema: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
      },
    },
    {
      name: "list_studies",
      description: "Return all studies cited for a supplement.",
      inputSchema: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
      },
    },
    {
      name: "search_evidence",
      description:
        "Return studies for a supplement filtered to those tagged with the given concern (e.g. 'sleep', 'energy').",
      inputSchema: {
        type: "object",
        properties: {
          slug: { type: "string" },
          concern: { type: "string" },
        },
        required: ["slug", "concern"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  const slug = String(args?.slug ?? "");
  const supplement = bySlug.get(slug);

  if (!supplement) {
    return {
      content: [{ type: "text", text: JSON.stringify({ error: "unknown_slug", slug }) }],
      isError: true,
    };
  }

  if (name === "get_supplement") {
    const { studies, ...meta } = supplement;
    return { content: [{ type: "text", text: JSON.stringify(meta) }] };
  }

  if (name === "list_studies") {
    return { content: [{ type: "text", text: JSON.stringify(supplement.studies) }] };
  }

  if (name === "search_evidence") {
    const concern = String(args?.concern ?? "").toLowerCase();
    const filtered = supplement.studies.filter((s) =>
      s.concerns.map((c) => c.toLowerCase()).includes(concern),
    );
    return { content: [{ type: "text", text: JSON.stringify(filtered) }] };
  }

  return {
    content: [{ type: "text", text: JSON.stringify({ error: "unknown_tool", name }) }],
    isError: true,
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
