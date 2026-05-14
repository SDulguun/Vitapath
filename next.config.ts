import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Pin Turbopack's workspace root to this project directory.
//
// Without this, Next 16's Turbopack infers the root by walking UP the
// filesystem looking for a lockfile. There is a stray package-lock.json
// in the parent directory (~/Downloads), so it picked that as the root
// and then failed to resolve `tailwindcss` from a node_modules that does
// not exist there — breaking `npm run dev` and the Playwright web server.
// `npm run build` happened to still work, and Vercel is unaffected (it
// clones into an isolated dir with no parent lockfile), but local dev +
// e2e need this pin to be reliable.
const nextConfig: NextConfig = {
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },
};

export default nextConfig;
