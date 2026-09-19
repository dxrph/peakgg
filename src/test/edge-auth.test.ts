/// <reference types="node" />
// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";

// Execute the real handlers with external services stubbed; no network or DB writes.
function loadHandler(name: string) {
  let handler: (req: Request) => Promise<Response>;
  const createClient = vi.fn(() => { throw new Error("DB should not be reached"); });
  const source = readFileSync(resolve("supabase/functions", name, "index.ts"), "utf8")
    .replace(/^import .* from .*;?\r?\n/gm, "");
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  runInNewContext(code, {
    Deno: { serve: (fn: typeof handler) => { handler = fn; }, env: { get: (key: string) => key === "SUPABASE_SERVICE_ROLE_KEY" ? "server-only-secret" : "configured" } },
    createClient, corsHeaders: {}, Request, Response, console, atob,
  });
  return { call: (req: Request) => handler(req), createClient };
}

describe("internal endpoint authentication", () => {
  for (const name of ["tournament-reminder-24h", "process-email-queue"]) {
    it(`${name} rejects missing, public and forged credentials before database access`, async () => {
      const { call, createClient } = loadHandler(name);
      const forged = `header.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.forged`;
      for (const token of [null, "public-anon-key", forged]) {
        const response = await call(new Request("https://example.com", { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {} }));
        expect([401, 403]).toContain(response.status);
      }
      expect(createClient).not.toHaveBeenCalled();
    });
  }
  it("reminder accepts preflight and rejects unsupported methods without database access", async () => {
    const { call, createClient } = loadHandler("tournament-reminder-24h");
    expect((await call(new Request("https://example.com", { method: "OPTIONS" }))).status).toBe(200);
    expect((await call(new Request("https://example.com"))).status).toBe(405);
    expect(createClient).not.toHaveBeenCalled();
  });
});
