import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CHANGELOG_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "CHANGELOG.md");
export const UNRELEASED_HEADING = "## Unreleased";
export const CATEGORIES = ["Added", "Changed", "Fixed", "Removed", "Security"];
export const AREAS = [
  "General",
  "Home",
  "Navigation",
  "Themes",
  "Settings",
  "History",
  "Text compare",
  "Image compare",
  "Markdown",
  "QR code"
];

const RELEASE_HEADING = /^## (\d{4}-\d{2}-\d{2})$/;
const ENTRY = /^- \*\*([^*]+):\*\* \S.*$/;
const FORBIDDEN_PUNCTUATION = /[;‘’“”–—]/;

function splitSections(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const firstSection = lines.findIndex((line) => line.startsWith("## "));
  const preamble = firstSection === -1 ? lines : lines.slice(0, firstSection);
  const sections = [];
  for (const line of firstSection === -1 ? [] : lines.slice(firstSection)) {
    if (line.startsWith("## ")) {
      sections.push({ heading: line, categories: [], loose: [] });
    } else if (line.startsWith("### ")) {
      sections.at(-1).categories.push({ name: line.slice(4), entries: [] });
    } else if (line.trim() !== "") {
      const category = sections.at(-1).categories.at(-1);
      (category ? category.entries : sections.at(-1).loose).push(line);
    }
  }
  return { preamble, sections };
}

function formatSection(section) {
  const lines = [section.heading];
  for (const category of section.categories) {
    lines.push("", `### ${category.name}`, "", ...category.entries);
  }
  return lines.join("\n");
}

function formatChangelog(preamble, sections) {
  const head = preamble.join("\n").trimEnd();
  return `${head}\n\n${sections.map(formatSection).join("\n\n")}\n`;
}

export function validateChangelog(text) {
  const errors = [];
  const { preamble, sections } = splitSections(text);
  if (preamble[0] !== "# Changelog") {
    errors.push("The file must start with \"# Changelog\".");
  }
  if (sections[0]?.heading !== UNRELEASED_HEADING) {
    errors.push(`The first section must be "${UNRELEASED_HEADING}".`);
  }

  let previousDate = null;
  sections.forEach((section, index) => {
    const isUnreleased = index === 0 && section.heading === UNRELEASED_HEADING;
    const date = section.heading.match(RELEASE_HEADING)?.[1];
    if (!isUnreleased && !date) {
      errors.push(`"${section.heading}" must be "${UNRELEASED_HEADING}" or "## YYYY-MM-DD".`);
    }
    if (date) {
      if (Number.isNaN(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
        errors.push(`"${section.heading}" is not a valid date.`);
      }
      if (previousDate !== null && date >= previousDate) {
        errors.push(`"${section.heading}" must be older than the release above it, and each date may appear once.`);
      }
      previousDate = date;
      if (section.categories.length === 0) {
        errors.push(`"${section.heading}" has no entries.`);
      }
    }
    if (section.loose.length > 0) {
      errors.push(`"${section.heading}" has text outside a category: "${section.loose[0]}".`);
    }

    let previousCategoryIndex = -1;
    for (const category of section.categories) {
      const categoryIndex = CATEGORIES.indexOf(category.name);
      if (categoryIndex === -1) {
        errors.push(`"${section.heading}" uses unknown category "${category.name}". Use ${CATEGORIES.join(", ")}.`);
      } else if (categoryIndex <= previousCategoryIndex) {
        errors.push(`"${section.heading}" must list categories once, in the order ${CATEGORIES.join(", ")}.`);
      }
      previousCategoryIndex = Math.max(previousCategoryIndex, categoryIndex);
      if (category.entries.length === 0) {
        errors.push(`"${section.heading}" has an empty "${category.name}" category.`);
      }
      for (const entry of category.entries) {
        const area = entry.match(ENTRY)?.[1];
        if (!area) {
          errors.push(`Entry "${entry}" must look like "- **Area:** Description".`);
        } else if (!AREAS.includes(area)) {
          errors.push(`Entry "${entry}" uses unknown area "${area}". Use ${AREAS.join(", ")}.`);
        }
        if (FORBIDDEN_PUNCTUATION.test(entry)) {
          errors.push(`Entry "${entry}" must not contain semicolons, typographic quotes, or en/em dashes.`);
        }
      }
    }
  });
  return errors;
}

export function releaseChangelog(text, date) {
  if (!RELEASE_HEADING.test(`## ${date}`)) {
    throw new Error(`Release date "${date}" must use YYYY-MM-DD.`);
  }
  const errors = validateChangelog(text);
  if (errors.length > 0) {
    throw new Error(`The changelog is invalid:\n${errors.join("\n")}`);
  }
  const { preamble, sections } = splitSections(text);
  const [unreleased, ...releases] = sections;
  if (unreleased.categories.length === 0) {
    throw new Error("There are no unreleased changes to release.");
  }

  const heading = `## ${date}`;
  const existing = releases.find((section) => section.heading === heading);
  if (releases.some((section) => section.heading.slice(3) > date)) {
    throw new Error(`A release newer than ${date} already exists.`);
  }
  const release = existing ?? { heading, categories: [], loose: [] };
  for (const category of unreleased.categories) {
    const target = release.categories.find((item) => item.name === category.name);
    if (target) {
      target.entries.push(...category.entries);
    } else {
      release.categories.push({ name: category.name, entries: [...category.entries] });
    }
  }
  release.categories.sort((left, right) => CATEGORIES.indexOf(left.name) - CATEGORIES.indexOf(right.name));

  const nextReleases = existing ? releases : [release, ...releases];
  return formatChangelog(preamble, [{ heading: UNRELEASED_HEADING, categories: [], loose: [] }, ...nextReleases]);
}

function runCli([command, ...args]) {
  const text = readFileSync(CHANGELOG_PATH, "utf8");
  if (command === "check") {
    const errors = validateChangelog(text);
    if (errors.length > 0) {
      console.error(errors.join("\n"));
      process.exit(1);
    }
    console.log("CHANGELOG.md is valid.");
    return;
  }
  if (command === "release") {
    const dateFlag = args.indexOf("--date");
    const date = dateFlag === -1 ? new Date().toISOString().slice(0, 10) : args[dateFlag + 1];
    const eol = text.includes("\r\n") ? "\r\n" : "\n";
    writeFileSync(CHANGELOG_PATH, releaseChangelog(text, date).replace(/\n/g, eol));
    console.log(`Moved the unreleased changes to ${date}.`);
    return;
  }
  console.error("Usage: node scripts/changelog.mjs <check | release [--date YYYY-MM-DD]>");
  process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    runCli(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
