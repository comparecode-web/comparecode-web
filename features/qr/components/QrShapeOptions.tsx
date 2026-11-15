import { OptionsSection } from "@/components/settings/OptionsSection";
import { SelectionBar } from "@/components/ui/SelectionBar";
import { Checkbox } from "@/components/ui/Checkbox";
import { ColorInput } from "@/components/ui/ColorInput";
import { DEFAULT_QR_STYLE, eyeShape, qrModulePreviewPath, roundedShape, type QrBorderShape, type QrCenterShape, type QrModuleShape, type QrStyle } from "../services/qrShapes";

const modules: Array<{ value: QrModuleShape; label: string }> = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dots", label: "Dots" },
  { value: "connected", label: "Connected" },
  { value: "diamond", label: "Diamond" },
  { value: "leaf", label: "Leaf" },
  { value: "vertical-bars", label: "Vertical bars" },
  { value: "horizontal-bars", label: "Horizontal bars" },
  { value: "plus", label: "Plus" },
  { value: "star", label: "Star" }
];
const borders: Array<{ value: QrBorderShape; label: string }> = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "circle", label: "Circle" },
  { value: "leaf", label: "Leaf" },
  { value: "octagon", label: "Octagon" }
];
const centers: Array<{ value: QrCenterShape; label: string }> = [
  ...borders,
  { value: "diamond", label: "Diamond" },
  { value: "star", label: "Star" }
];

const gridCells: Array<[number, number]> = [0, 2, 4].flatMap(row => [0, 2, 4].map(col => [row, col] as [number, number]));
const largeGridCells: Array<[number, number]> = [0, 1.5, 3].flatMap(row => [0, 1.5, 3].map(col => [row, col] as [number, number]));
const verticalBarCells: Array<[number, number]> = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [0, 2], [1, 2], [3, 2], [4, 2], [0, 4], [1, 4], [2, 4], [4, 4]];
const horizontalBarCells = verticalBarCells.map(([row, col]) => [col, row] as [number, number]);
const connectedCells: Array<[number, number]> = ["11101", "00001", "10111", "10000", "11011"].flatMap((line, row) => [...line].flatMap((cell, col) => cell === "1" ? [[row, col] as [number, number]] : []));

function moduleIcon(shape: QrModuleShape): { viewBox: string; d: string } {
  const d = moduleIconPath(shape);
  return { viewBox: ["diamond", "leaf", "plus", "star"].includes(shape) ? "0 0 4 4" : "0 0 5 5", d };
}

function moduleIconPath(shape: QrModuleShape): string {
  switch (shape) {
    case "dots": return gridCells.map(([y, x]) => eyeShape(x, y, 1, "circle")).join("");
    case "connected": return qrModulePreviewPath(shape, connectedCells);
    case "square":
    case "rounded": return gridCells.map(([y, x]) => roundedShape(x, y, 1, shape === "rounded" ? .3 : 0)).join("");
    case "vertical-bars": return qrModulePreviewPath(shape, verticalBarCells);
    case "horizontal-bars": return qrModulePreviewPath(shape, horizontalBarCells);
    default: return qrModulePreviewPath(shape, largeGridCells);
  }
}

export function QrShapeOptions({ value, onChange, codeColor }: { value: QrStyle; onChange: (style: QrStyle) => void; codeColor: string }) {
  const linked = value.borderColor === null && value.centerColor === null;
  return <OptionsSection density="comfortable" title="Shape" description="Style the dots and the three corner markers." isDirty={JSON.stringify(value) !== JSON.stringify(DEFAULT_QR_STYLE)} onReset={() => onChange(DEFAULT_QR_STYLE)}>
    <div className="space-y-5">
      <fieldset><legend className="mb-2 text-sm font-semibold text-text-primary">Code shape</legend>
        <SelectionBar contentLayout="stacked" value={value.modules} onChange={modules => onChange({ ...value, modules })} className="grid grid-cols-2 sm:grid-cols-5" buttonClassName="min-w-0 px-2 py-3" options={modules.map(option => {
          const icon = moduleIcon(option.value);
          return { ...option, icon: <svg viewBox={icon.viewBox} className="size-8" aria-hidden="true"><path fill="currentColor" d={icon.d} /></svg> };
        })} />
      </fieldset>
      <fieldset><legend className="mb-2 text-sm font-semibold text-text-primary">Corner border</legend>
        <SelectionBar contentLayout="stacked" value={value.border} onChange={border => onChange({ ...value, border })} className="grid grid-cols-3 sm:grid-cols-5" buttonClassName="min-w-0 px-2 py-3" options={borders.map(option => ({ ...option, icon: <svg viewBox="0 0 9 9" className="size-8" aria-hidden="true"><path fill="currentColor" fillRule="evenodd" d={eyeShape(1, 1, 7, option.value) + eyeShape(2, 2, 5, option.value)} /></svg> }))} />
      </fieldset>
      <fieldset><legend className="mb-2 text-sm font-semibold text-text-primary">Corner center</legend>
        <SelectionBar contentLayout="stacked" value={value.center} onChange={center => onChange({ ...value, center })} className="grid grid-cols-4 sm:grid-cols-7" buttonClassName="min-w-0 px-2 py-3" options={centers.map(option => ({ ...option, icon: <svg viewBox="0 0 9 9" className="size-8" aria-hidden="true"><path fill="currentColor" fillRule="evenodd" d={eyeShape(1, 1, 7, option.value)} /></svg> }))} />
      </fieldset>
      <Checkbox label="Use code color for corners" checked={linked} onChange={event => onChange({ ...value, borderColor: event.target.checked ? null : codeColor, centerColor: event.target.checked ? null : codeColor })} />
      {!linked && <div className="grid gap-4 sm:grid-cols-2"><ColorInput label="Corner border color" value={value.borderColor ?? codeColor} onChange={borderColor => onChange({ ...value, borderColor })} /><ColorInput label="Corner center color" value={value.centerColor ?? codeColor} onChange={centerColor => onChange({ ...value, centerColor })} /></div>}
    </div>
  </OptionsSection>;
}
