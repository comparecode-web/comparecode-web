import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CLAUDE_SKILLS_DIR, buildClaudeSkillWrappers } from "../sync-claude-skills.mjs";

const root = path.resolve(__dirname, "../..");

describe("Claude Code skill wrappers", () => {
  const wrappers = buildClaudeSkillWrappers(root);

  it("exposes every repository skill to Claude Code", () => {
    expect(wrappers.length).toBeGreaterThan(0);
    const installed = readdirSync(path.join(root, CLAUDE_SKILLS_DIR), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(installed, "Run `npm run agents:sync` after adding, renaming, or removing a skill.").toEqual(wrappers.map((wrapper) => wrapper.name));
  });

  it.each(wrappers.map((wrapper) => [wrapper.name, wrapper] as const))("keeps %s in sync with its source skill", (_name, wrapper) => {
    const wrapperPath = path.join(root, wrapper.path);
    expect(existsSync(wrapperPath)).toBe(true);
    const actual = readFileSync(wrapperPath, "utf8").replace(/\r\n/g, "\n");
    expect(actual, "Run `npm run agents:sync` after changing a skill name or description.").toBe(wrapper.content);
  });
});
