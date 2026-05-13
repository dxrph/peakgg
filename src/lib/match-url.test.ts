import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  buildMatchUrl,
  buildTournamentMatchUrl,
  isValidMatchId,
  sanitizeMatchUrl,
} from "./match-url";

describe("match-url helpers", () => {
  it("rejects invalid match ids", () => {
    for (const bad of [undefined, null, "", " ", "undefined", "null", "NaN", 0, {}]) {
      expect(isValidMatchId(bad as unknown)).toBe(false);
      expect(buildMatchUrl(bad as unknown)).toBeNull();
      expect(buildTournamentMatchUrl("cup", bad as unknown)).toBeNull();
    }
  });

  it("builds urls for valid ids", () => {
    expect(buildMatchUrl("abc-123")).toBe("/matches/abc-123");
    expect(buildTournamentMatchUrl("cup", "abc-123")).toBe(
      "/tournaments/cup/matches/abc-123",
    );
    expect(buildTournamentMatchUrl(null, "abc-123")).toBeNull();
  });

  it("sanitizes urls coming from notifications", () => {
    expect(sanitizeMatchUrl(null)).toBeNull();
    expect(sanitizeMatchUrl("/matches/undefined")).toBeNull();
    expect(sanitizeMatchUrl("/matches/null")).toBeNull();
    expect(sanitizeMatchUrl("/matches/null?ref=x")).toBeNull();
    expect(sanitizeMatchUrl("/matches/abc")).toBe("/matches/abc");
    expect(sanitizeMatchUrl("/dashboard")).toBe("/dashboard");
  });
});

describe("repo guard: no hardcoded /matches/undefined or /matches/null", () => {
  const SRC = join(process.cwd(), "src");
  // App.tsx contains the intentional Navigate guards; this test file documents
  // the forbidden tokens. Anything else must be free of these literals.
  const ALLOWLIST = new Set<string>([
    "src/App.tsx",
    "src/lib/match-url.ts",
    "src/lib/match-url.test.ts",
  ]);

  function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      const s = statSync(p);
      if (s.isDirectory()) walk(p, out);
      else if (/\.(ts|tsx)$/.test(entry)) out.push(p);
    }
    return out;
  }

  it("never references /matches/undefined or /matches/null", () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const rel = relative(process.cwd(), file).replace(/\\/g, "/");
      if (ALLOWLIST.has(rel)) continue;
      // Strip line + block comments so doc references don't trip the guard.
      const content = readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "")
        .replace(/\s\/\/.*$/gm, "");
      if (/\/matches\/undefined|\/matches\/null/.test(content)) {
        offenders.push(rel);
      }
    }
    expect(offenders, `Unsafe match URLs found in: ${offenders.join(", ")}`).toEqual([]);
  });

  it("never builds match links from a raw, unguarded variable named *matchId* with template literal", () => {
    // Heuristic: lines with `/matches/${...}` must either guard the value
    // (ternary, &&, optional chaining, isValidMatchId, buildMatchUrl) OR live
    // inside the helper itself. This catches future regressions where a dev
    // writes `to={`/matches/${maybeUndefined}`}` directly.
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const rel = relative(process.cwd(), file).replace(/\\/g, "/");
      if (ALLOWLIST.has(rel)) continue;
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, idx) => {
        if (!/\/matches\/\$\{/.test(line)) return;
        // Skip pure comments
        if (/^\s*(\/\/|\*)/.test(line)) return;
        // Allow guarded usages — look at this line + 2 lines above for guards
        const ctx = lines.slice(Math.max(0, idx - 2), idx + 1).join("\n");
        const guarded =
          /\?\s*`\/matches\//.test(ctx) ||
          /&&\s*`\/matches\//.test(ctx) ||
          /isValidMatchId|buildMatchUrl/.test(ctx) ||
          /if\s*\(\s*!?[\w.]+\s*\)/.test(ctx);
        if (!guarded) offenders.push(`${rel}:${idx + 1}`);
      });
    }
    expect(
      offenders,
      `Unguarded match URL builders: ${offenders.join(", ")}`,
    ).toEqual([]);
  });
});