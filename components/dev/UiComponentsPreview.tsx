"use client";

import { useRef, useState } from "react";
import { MdAdd, MdDownload, MdSettings, MdWidgets } from "react-icons/md";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { OptionsSection } from "@/components/settings/OptionsSection";
import { ThemeSelect } from "@/components/settings/ThemeSelect";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { FormField } from "@/components/ui/FormField";
import { ResetButton } from "@/components/ui/ResetButton";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { SelectionBar } from "@/components/ui/SelectionBar";
import { Checkbox } from "@/components/ui/Checkbox";
import { Switch } from "@/components/ui/Switch";
import { Slider } from "@/components/ui/Slider";
import { ColorInput } from "@/components/ui/ColorInput";
import { Dialog } from "@/components/ui/Dialog";
import { DialogHeader } from "@/components/ui/DialogHeader";
import { Popover } from "@/components/ui/Popover";
import { PopoverMenu, MenuItem } from "@/components/ui/PopoverMenu";
import { WorkspaceToolbar } from "@/components/ui/WorkspaceToolbar";
import { FileDropZone } from "@/components/ui/FileDropZone";
import { buttonVariants, controlSizes, type ButtonVariant, type ControlSize } from "@/components/ui/controlStyles";

const sizes = Object.keys(controlSizes) as ControlSize[];
const variants = Object.keys(buttonVariants) as ButtonVariant[];
const choices = [{ value: "original", label: "Original" }, { value: "modified", label: "Modified" }];

export function UiComponentsPreview() {
  const [choice, setChoice] = useState("original");
  const [multiple, setMultiple] = useState<string[]>(["original"]);
  const [checked, setChecked] = useState(true);
  const [amount, setAmount] = useState(40);
  const [color, setColor] = useState("#3b82f6");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState("No action yet.");
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const formTrigger = useRef<HTMLButtonElement>(null);

  return <PageContent contentClassName="space-y-5">
    <PageHeader title="UI components" description="Development preview of shared sizes, variants, states and compositions." icon={MdWidgets} actions={<ThemeSelect className="w-48" />} />
    <OptionsSection density="comfortable" title="Buttons" description="The same size scale controls labelled actions, icon actions and fields.">
      {sizes.map(size => <div key={size} className="space-y-2 py-2">
        <p className="text-sm font-semibold text-text-secondary">{size}</p>
        <div className="flex flex-wrap items-center gap-2">{variants.map(variant => <Button key={variant} size={size} variant={variant} leftIcon={<MdAdd />} onClick={() => setMessage(`${variant} / ${size}`)}>{variant}</Button>)}<Button size={size} disabled>Disabled</Button></div>
        <div className="flex flex-wrap items-center gap-2">{variants.map(variant => <IconButton key={variant} size={size} variant={variant} title={`${variant} / ${size}`} onClick={() => setMessage(`${variant} icon / ${size}`)}><MdAdd /></IconButton>)}<IconButton size={size} isActive title={`Active / ${size}`}><MdSettings /></IconButton><IconButton size={size} disabled title={`Disabled / ${size}`}><MdAdd /></IconButton><ResetButton size={size} isDirty onClick={() => setMessage("Defaults restored.")} /></div>
      </div>)}
      <p role="status" className="text-sm text-text-secondary">{message}</p>
    </OptionsSection>
    <OptionsSection density="comfortable" title="Fields" description="Labels, helper text and validation messages share FormField.">
      <div className="grid gap-4 md:grid-cols-3">
        {sizes.map(size => <div key={size} className="space-y-3">
          <FormField label={`Input / ${size}`} description="Editable text">{field => <Input {...field} size={size} placeholder="Enter a value" />}</FormField>
          <SelectDropdown label={`Select / ${size}`} size={size} value={choice} options={choices} onChange={setChoice} />
          <SelectionBar size={size} value={choice} options={choices} onChange={setChoice} />
        </div>)}
        <FormField label="Disabled field">{field => <Input {...field} disabled value="Unavailable" />}</FormField>
        <FormField label="Read-only field">{field => <Input {...field} readOnly value="Read-only value" />}</FormField>
        <FormField label="Invalid field" error="Enter a valid value.">{field => <Input {...field} defaultValue="Invalid value" />}</FormField>
        <FormField label="Notes">{field => <Textarea {...field} placeholder="Multiple lines" />}</FormField>
        <div className="space-y-3"><SelectDropdown label="Disabled select" disabled value={choice} options={choices} onChange={setChoice} /><SelectionBar selectionMode="multiple" value={multiple} options={choices} onChange={setMultiple} /><SelectionBar disabled value={choice} options={choices} onChange={setChoice} /></div>
        <ColorInput label="Color" value={color} onChange={setColor} onRestoreDefault={() => setColor("#3b82f6")} isDifferentFromDefault={color !== "#3b82f6"} />
      </div>
    </OptionsSection>
    <OptionsSection density="comfortable" title="Toggles and ranges" onReset={() => { setChecked(true); setAmount(40); }} isDirty={!checked || amount !== 40}>
      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Checkbox label="Checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} />
        <Switch label="Switch" checked={checked} onChange={event => setChecked(event.target.checked)} />
        <Switch label="Small switch" size="sm" checked={checked} onChange={event => setChecked(event.target.checked)} />
        <Checkbox label="Disabled checkbox" disabled checked readOnly />
        <Switch label="Disabled switch" disabled checked readOnly />
        <Slider label="Amount" displayValue={amount} min={0} max={100} value={amount} onChange={event => setAmount(Number(event.target.value))} />
      </div>
    </OptionsSection>
    <OptionsSection density="comfortable" title="Toolbars and overlays" description="Use the generic popover for forms and the menu composition for actions.">
      <WorkspaceToolbar variant="card">
        <Button size="sm" leftIcon={<MdDownload />} onClick={() => setDialogOpen(true)}>Open dialog</Button>
        <Button ref={menuTrigger} size="sm" variant="outline" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>Action menu</Button>
        <Button ref={formTrigger} size="sm" variant="outline" aria-expanded={formOpen} onClick={() => setFormOpen(!formOpen)}>Form popover</Button>
        <IconButton size="sm" shape="circle" title="Circle action"><MdAdd /></IconButton>
      </WorkspaceToolbar>
      <WorkspaceToolbar><Button size="sm" variant="ghost">Inline action</Button><ResetButton title="Restore toolbar defaults" /></WorkspaceToolbar>
      <PopoverMenu isOpen={menuOpen} onOpenChange={setMenuOpen} triggerRef={menuTrigger} className="py-1">
        <MenuItem onClick={() => { setMessage("First action selected."); setMenuOpen(false); menuTrigger.current?.focus(); }}>First action</MenuItem>
        <MenuItem disabled>Unavailable action</MenuItem>
        <MenuItem onClick={() => { setMessage("Last action selected."); setMenuOpen(false); menuTrigger.current?.focus(); }}>Last action</MenuItem>
      </PopoverMenu>
      <Popover isOpen={formOpen} onOpenChange={setFormOpen} triggerRef={formTrigger} className="w-60 p-3"><FormField label="Popover value">{field => <Input {...field} />}</FormField></Popover>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} aria-labelledby="preview-dialog-title">
        <DialogHeader title="Example dialog" titleId="preview-dialog-title" onClose={() => setDialogOpen(false)} />
        <div className="space-y-4 p-4"><FormField label="Dialog input">{field => <Input {...field} />}</FormField><SelectDropdown label="Dialog choice" value={choice} options={choices} onChange={setChoice} /><Button onClick={() => setDialogOpen(false)}>Done</Button></div>
      </Dialog>
      <FileDropZone label="Drop files" onFilesDrop={files => setMessage(`${files.length} file(s) dropped.`)} className="rounded-md border border-dashed border-border-default p-6 text-sm text-text-secondary">Drop a local file here to preview the shared feedback.</FileDropZone>
    </OptionsSection>
  </PageContent>;
}
