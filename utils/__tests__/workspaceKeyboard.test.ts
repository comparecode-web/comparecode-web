import { describe, expect, it } from "vitest";
import { isEditableTarget } from "../workspaceKeyboard";

describe("isEditableTarget", () => {
  it("treats form fields and editable content as typing targets", () => {
    for (const tag of ["input", "textarea", "select"]) expect(isEditableTarget(document.createElement(tag))).toBe(true);
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    Object.defineProperty(editable, "isContentEditable", { value: true });
    expect(isEditableTarget(editable)).toBe(true);
  });

  it("ignores buttons, plain elements, and non-elements", () => {
    expect(isEditableTarget(document.createElement("button"))).toBe(false);
    expect(isEditableTarget(document.createElement("div"))).toBe(false);
    expect(isEditableTarget(document)).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});
