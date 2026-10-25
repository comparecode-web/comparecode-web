import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CHANGELOG_PATH, releaseChangelog, validateChangelog } from "../changelog.mjs";

const PREAMBLE = "# Changelog\n\nUser-visible changes.\n";

function changelog(...sections: Array<string>): string {
  return `${PREAMBLE}\n${sections.join("\n\n")}\n`;
}

describe("changelog", () => {
  it("keeps the repository changelog valid", () => {
    expect(validateChangelog(readFileSync(CHANGELOG_PATH, "utf8")), "Run `npm run changelog:check` and follow docs/changelog.md.").toEqual([]);
  });

  it("accepts an empty unreleased section followed by dated releases", () => {
    expect(validateChangelog(changelog(
      "## Unreleased",
      "## 2026-10-25\n\n### Added\n\n- **Text compare:** Unified view.\n\n### Fixed\n\n- **Markdown:** List indentation.",
      "## 2026-09-01\n\n### Security\n\n- **General:** Safer links."
    ))).toEqual([]);
  });

  it("reports structural mistakes", () => {
    const errors = validateChangelog(changelog(
      "## Unreleased\n\n### Fixed\n\n- **Image compare:** One.\n\n### Added\n\n- **Sidebar:** Two.\n- Missing area; with a semicolon.",
      "## 2026-09-01\n\n### Added\n\n- **Home:** Older.",
      "## 2026-10-25\n\n### Improved\n\n- **Home:** Newer."
    ));
    expect(errors).toEqual([
      expect.stringContaining("in the order Added, Changed"),
      expect.stringContaining("unknown area \"Sidebar\""),
      expect.stringContaining("must look like"),
      expect.stringContaining("must not contain semicolons"),
      expect.stringContaining("must be older"),
      expect.stringContaining("unknown category \"Improved\"")
    ]);
    expect(validateChangelog("# Notes\n\n## 2026-10-25\n")).toEqual([
      expect.stringContaining("# Changelog"),
      expect.stringContaining("## Unreleased"),
      expect.stringContaining("has no entries")
    ]);
  });

  it("dates unreleased entries and leaves an empty unreleased section", () => {
    const released = releaseChangelog(changelog(
      "## Unreleased\n\n### Added\n\n- **Themes:** Forest theme.",
      "## 2026-09-01\n\n### Fixed\n\n- **Home:** Footer link."
    ), "2026-10-25");
    expect(released).toBe(changelog(
      "## Unreleased",
      "## 2026-10-25\n\n### Added\n\n- **Themes:** Forest theme.",
      "## 2026-09-01\n\n### Fixed\n\n- **Home:** Footer link."
    ));
    expect(validateChangelog(released)).toEqual([]);
  });

  it("merges a second release on the same day into that day", () => {
    const released = releaseChangelog(changelog(
      "## Unreleased\n\n### Added\n\n- **QR code:** SVG export.\n\n### Fixed\n\n- **Markdown:** Paste.",
      "## 2026-10-25\n\n### Fixed\n\n- **Home:** Footer link."
    ), "2026-10-25");
    expect(released).toBe(changelog(
      "## Unreleased",
      "## 2026-10-25\n\n### Added\n\n- **QR code:** SVG export.\n\n### Fixed\n\n- **Home:** Footer link.\n- **Markdown:** Paste."
    ));
  });

  it("refuses to release nothing, an invalid date, or a date before the latest release", () => {
    const empty = changelog("## Unreleased", "## 2026-10-25\n\n### Fixed\n\n- **Home:** Footer link.");
    expect(() => releaseChangelog(empty, "2026-10-26")).toThrow("no unreleased changes");
    const pending = changelog("## Unreleased\n\n### Added\n\n- **Home:** Hero.", "## 2026-10-25\n\n### Fixed\n\n- **Home:** Footer link.");
    expect(() => releaseChangelog(pending, "26-10-2026")).toThrow("YYYY-MM-DD");
    expect(() => releaseChangelog(pending, "2026-10-24")).toThrow("newer than 2026-10-24");
  });
});
