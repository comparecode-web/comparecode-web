import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FileDropZone } from "../FileDropZone";

function fileDrag(file: File) {
  return { dataTransfer: { types: ["Files"], files: [file], dropEffect: "none" } };
}

describe("FileDropZone", () => {
  it("shows feedback only for file drags and passes dropped files to its owner", () => {
    const onFilesDrop = vi.fn();
    const file = new File(["hello"], "example.txt", { type: "text/plain" });
    const { container } = render(<FileDropZone label="Drop a file" onFilesDrop={onFilesDrop}><div>Editor</div></FileDropZone>);
    const zone = container.firstElementChild as Element;
    fireEvent.dragEnter(zone, { dataTransfer: { types: ["text/plain"] } });
    expect(screen.queryByText("Drop a file")).not.toBeInTheDocument();
    fireEvent.dragEnter(zone, fileDrag(file));
    expect(screen.getByText("Drop a file")).toBeInTheDocument();
    fireEvent.drop(zone, fileDrag(file));
    expect(onFilesDrop).toHaveBeenCalledWith([file], expect.anything());
    expect(screen.queryByText("Drop a file")).not.toBeInTheDocument();
  });

  it("keeps feedback during nested drag transitions and clears it on exit", () => {
    const file = new File(["hello"], "example.txt");
    const { container } = render(<FileDropZone label="Drop a file" onFilesDrop={vi.fn()}><span>Child</span></FileDropZone>);
    const zone = container.firstElementChild as Element;
    const child = screen.getByText("Child");
    fireEvent.dragEnter(zone, fileDrag(file));
    fireEvent.dragEnter(child, fileDrag(file));
    fireEvent.dragLeave(child, fileDrag(file));
    expect(screen.getByText("Drop a file")).toBeInTheDocument();
    fireEvent.dragLeave(zone, fileDrag(file));
    expect(screen.queryByText("Drop a file")).not.toBeInTheDocument();
  });
});
