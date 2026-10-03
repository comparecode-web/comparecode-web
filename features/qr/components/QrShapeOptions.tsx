import { OptionsSection } from "@/components/settings/OptionsSection";
import { SelectionBar } from "@/components/ui/SelectionBar";
import { Checkbox } from "@/components/ui/Checkbox";
import { ColorInput } from "@/components/ui/ColorInput";
import { DEFAULT_QR_STYLE, eyeShape, roundedShape, type QrStyle, type QrEyeShape, type QrModuleShape } from "../services/qrShapes";

const modules: Array<{ value: QrModuleShape; label: string }> = [{ value: "square", label: "Square" }, { value: "rounded", label: "Rounded" }, { value: "dots", label: "Dots" }, { value: "connected", label: "Connected" }];
const eyes: Array<{ value: QrEyeShape; label: string }> = [{ value: "square", label: "Square" }, { value: "rounded", label: "Rounded" }, { value: "circle", label: "Circle" }];

export function QrShapeOptions({ value, onChange, codeColor }: { value: QrStyle; onChange: (style: QrStyle) => void; codeColor: string }) {
  const linked = value.borderColor === null && value.centerColor === null;
  return <OptionsSection title="Shape" description="Style the dots and the three corner markers." isDirty={JSON.stringify(value) !== JSON.stringify(DEFAULT_QR_STYLE)} onReset={() => onChange(DEFAULT_QR_STYLE)}>
    <div className="space-y-5">
      <fieldset><legend className="mb-2 text-sm font-semibold text-text-primary">Code shape</legend>
        <SelectionBar contentLayout="stacked" value={value.modules} onChange={modules => onChange({ ...value, modules })} className="grid grid-cols-2 sm:grid-cols-4" buttonClassName="min-w-0 px-2 py-3" options={modules.map(option => ({ ...option, icon: <svg viewBox="0 0 5 5" className="size-8" aria-hidden="true"><path fill="currentColor" d={option.value === "dots" ? [0, 2, 4].flatMap(x => [0, 2, 4].map(y => eyeShape(x, y, 1, "circle"))).join("") : option.value === "connected" ? roundedShape(0, 0, 5, 1.2) + roundedShape(1, 1, 3, .8) : [0, 2, 4].flatMap(x => [0, 2, 4].map(y => roundedShape(x, y, 1, option.value === "rounded" ? .3 : 0))).join("")} fillRule="evenodd" /></svg> }))} />
      </fieldset>
      {(["border", "center"] as const).map(part => <fieldset key={part}><legend className="mb-2 text-sm font-semibold text-text-primary">{part === "border" ? "Corner border" : "Corner center"}</legend>
        <SelectionBar contentLayout="stacked" value={value[part]} onChange={shape => onChange({ ...value, [part]: shape })} className="grid grid-cols-3" buttonClassName="min-w-0 px-2 py-3" options={eyes.map(option => ({ ...option, icon: <svg viewBox="0 0 9 9" className="size-8" aria-hidden="true"><path fill="currentColor" fillRule="evenodd" d={eyeShape(1, 1, 7, option.value) + (part === "border" ? eyeShape(2, 2, 5, option.value) : "")} /></svg> }))} />
      </fieldset>)}
      <Checkbox label="Use code color for corners" checked={linked} onChange={event => onChange({ ...value, borderColor: event.target.checked ? null : codeColor, centerColor: event.target.checked ? null : codeColor })} />
      {!linked && <div className="grid gap-4 sm:grid-cols-2"><ColorInput label="Corner border color" value={value.borderColor ?? codeColor} onChange={borderColor => onChange({ ...value, borderColor })} /><ColorInput label="Corner center color" value={value.centerColor ?? codeColor} onChange={centerColor => onChange({ ...value, centerColor })} /></div>}
      <p className="text-xs text-text-secondary">Scan your styled code before sharing or printing. Keep strong contrast and a clear border.</p>
    </div>
  </OptionsSection>;
}
